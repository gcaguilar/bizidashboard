import 'server-only';

import {
  getStationPatternsBulk,
  getStationsWithLatestStatus,
} from '@/analytics/queries/read';
import {
  getStationGlobalMetrics,
  getStationTimeBandMetrics,
  getCriticalEpisodes,
  getActiveStationPoints,
  buildDistanceMatrix,
  computeRotationPercentiles,
  computeUnsatisfiedDemandProxy,
} from '@/analytics/queries/rebalancing';
import { withCache } from '@/lib/cache/cache';
import { buildStationDistrictMap, fetchDistrictCollection } from '@/lib/districts';
import { hourToTimeBand } from '@/analytics/queries/rebalancing';
import { inferStationType } from '@/lib/station-typology';
import { getTargetBand } from '@/lib/target-bands';
import { classifyStation } from '@/lib/station-classifier';
import type { MetricsWithSampleCount } from '@/lib/station-classifier';
import { assessStationRisk } from '@/lib/rebalancing-prediction';
import { buildNetworkContext } from '@/lib/rebalancing-network';
import { decideAction } from '@/lib/rebalancing-engine';
import { computeTransfers, DEFAULT_LOGISTICS_CONFIG } from '@/lib/rebalancing-matching';
import { computeReportKPIs, computeBaselineComparison } from '@/lib/rebalancing-impact';
import { getLocalHour } from '@/analytics/time-buckets';
import type { PatternRow } from '@/lib/rebalancing-prediction';
import type {
  RebalancingReport,
  StationDiagnostic,
  ReportSummary,
  StationClassification,
  ActionGroup,
} from '@/types/rebalancing';

// ─── Constants ───────────────────────────────────────────────────────────────

const MODEL_VERSION = 'rebalancing-v1-historical-baseline';
const CACHE_TTL_SECONDS = 300;
const DEFAULT_DAYS = 15;

// ─── Summary builder ─────────────────────────────────────────────────────────

function buildSummary(diagnostics: StationDiagnostic[], transfers: number): ReportSummary {
  const classificationCounts: Record<StationClassification, number> = {
    overstock: 0,
    deficit: 0,
    peak_saturation: 0,
    peak_emptying: 0,
    balanced: 0,
    data_review: 0,
  };
  const actionCounts: Record<ActionGroup, number> = {
    donor: 0,
    receptor: 0,
    peak_remove: 0,
    peak_fill: 0,
    stable: 0,
    review: 0,
  };

  let criticalUrgencyCount = 0;
  let highUrgencyCount = 0;

  for (const d of diagnostics) {
    classificationCounts[d.classification] = (classificationCounts[d.classification] ?? 0) + 1;
    actionCounts[d.actionGroup] = (actionCounts[d.actionGroup] ?? 0) + 1;
    if (d.urgency === 'critical') criticalUrgencyCount++;
    if (d.urgency === 'high') highUrgencyCount++;
  }

  return {
    totalStations: diagnostics.length,
    byClassification: classificationCounts,
    byAction: actionCounts,
    criticalUrgencyCount,
    highUrgencyCount,
    stationsWithTransfer: transfers,
  };
}

// ─── Main report builder ──────────────────────────────────────────────────────

export type RebalancingReportOptions = {
  days?: number;
  district?: string | null;
};

/**
 * Builds the full rebalancing report.
 *
 * Orchestration order:
 * 1. Parallel data fetch (metrics, patterns, stations, districts)
 * 2. Build distance matrix
 * 3. Per-station: typology → target band → classify → predict risk → network → decide
 * 4. Transfer matching
 * 5. KPIs and baseline comparison
 * 6. Filter by district if provided
 */
export async function buildRebalancingReport(
  options: RebalancingReportOptions = {}
): Promise<RebalancingReport> {
  const days = Math.max(1, Math.min(90, Math.floor(options.days ?? DEFAULT_DAYS)));
  const districtFilter = options.district?.trim() || null;
  const cacheKey = `rebalancing-report:days=${days}:district=${districtFilter ?? 'all'}`;

  return withCache(cacheKey, CACHE_TTL_SECONDS, async () => {
    const now = new Date();
    const currentHour = getLocalHour(now);
    const currentTimeBand = hourToTimeBand(currentHour);

    // ── Step 1: Parallel data fetch ─────────────────────────────────────────
    const [
      globalMetricsRaw,
      timeBandMetricsRaw,
      episodesRaw,
      stationsWithStatus,
      stationPoints,
      districtCollection,
    ] = await Promise.all([
      getStationGlobalMetrics(days),
      getStationTimeBandMetrics(days),
      getCriticalEpisodes(days),
      getStationsWithLatestStatus(),
      getActiveStationPoints(),
      fetchDistrictCollection().catch(() => null),
    ]);

    const stationIds = stationsWithStatus.map((s) => s.id);
    const patternRows = await getStationPatternsBulk(stationIds);

    // ── Step 2: Enrich metrics with episode data and unsatisfied demand ─────
    // Attach critical episode minutes to global metrics
    for (const [stationId, episodes] of episodesRaw.entries()) {
      const global = globalMetricsRaw.get(stationId);
      if (global) {
        global.criticalEpisodeAvgMinutes =
          (episodes.avgEmptyEpisodeMinutes + episodes.avgFullEpisodeMinutes) / 2;
      }
    }
    const unsatisfiedDemandMap = computeUnsatisfiedDemandProxy(globalMetricsRaw, timeBandMetricsRaw);
    for (const [stationId, proxy] of unsatisfiedDemandMap.entries()) {
      const global = globalMetricsRaw.get(stationId);
      if (global) global.unsatisfiedDemandProxy = proxy;
    }
    const timeBandMetricsWithEpisodes = timeBandMetricsRaw;
    for (const [stationId, bands] of timeBandMetricsWithEpisodes.entries()) {
      const episodes = episodesRaw.get(stationId);
      if (episodes) {
        for (const band of bands) {
          band.criticalEpisodeAvgMinutes =
            (episodes.avgEmptyEpisodeMinutes + episodes.avgFullEpisodeMinutes) / 2;
        }
      }
    }

    // ── Step 3: Rotation percentiles (for classifier) ───────────────────────
    const rotationPercentiles = computeRotationPercentiles(globalMetricsRaw);

    // ── Step 4: District map ────────────────────────────────────────────────
    const districtNameById =
      districtCollection !== null
        ? buildStationDistrictMap(
            stationsWithStatus.map((s) => ({ id: s.id, lon: s.lon, lat: s.lat })),
            districtCollection
          )
        : new Map<string, string>();

    // ── Step 5: Current bikes map (for network context) ─────────────────────
    const currentBikesMap = new Map(
      stationsWithStatus.map((s) => [
        s.id,
        { bikesAvailable: s.bikesAvailable, anchorsFree: s.anchorsFree },
      ])
    );

    // ── Step 6: Distance matrix ──────────────────────────────────────────────
    const distanceMatrix = buildDistanceMatrix(
      stationPoints,
      globalMetricsRaw,
      currentBikesMap,
      500
    );

    // ── Step 7: Per-station pattern map ──────────────────────────────────────
    const patternsByStation = new Map<string, PatternRow[]>();
    for (const row of patternRows) {
      const list = patternsByStation.get(row.stationId) ?? [];
      list.push({
        dayType: row.dayType,
        hour: row.hour,
        occupancyAvg: Number(row.occupancyAvg),
        bikesAvg: 0, // not in StationPatternBulkRow, use occupancyAvg-derived proxy
        anchorsAvg: 0,
        sampleCount: Number(row.sampleCount),
      });
      patternsByStation.set(row.stationId, list);
    }

    // ── Step 8: Build per-station diagnostics ────────────────────────────────
    const maxDemandAcrossStations = Math.max(
      ...Array.from(globalMetricsRaw.values()).map((m) => m.rotation),
      1
    );

    const diagnostics: StationDiagnostic[] = [];

    for (const station of stationsWithStatus) {
      const globalMetrics = globalMetricsRaw.get(station.id);
      if (!globalMetrics) continue;

      const timeBandMetrics = timeBandMetricsRaw.get(station.id) ?? [];
      const rotationPercentile = rotationPercentiles.get(station.id) ?? 50;
      const patterns = patternsByStation.get(station.id) ?? [];
      const nearbyStations = distanceMatrix.get(station.id) ?? [];

      const currentOccupancy =
        station.capacity > 0 ? station.bikesAvailable / station.capacity : 0;

      // Typology inference
      const typologyResult = inferStationType(patterns);
      const inferredType = typologyResult.type;

      // Target band for current time
      const targetBand = getTargetBand(inferredType, currentTimeBand);

      // Classification
      const metricsWithCount: MetricsWithSampleCount = {
        ...globalMetrics,
        sampleCount: (globalMetrics as MetricsWithSampleCount).sampleCount,
      };
      const classificationResult = classifyStation(
        metricsWithCount,
        timeBandMetrics,
        targetBand,
        rotationPercentile
      );

      // Risk assessment
      const risk = assessStationRisk(
        station.id,
        station.capacity,
        station.bikesAvailable,
        patterns,
        targetBand,
        now
      );

      // Network context
      const network = buildNetworkContext(nearbyStations, currentBikesMap);

      // Decision
      const decision = decideAction(
        classificationResult.classification,
        currentOccupancy,
        targetBand,
        currentTimeBand,
        risk,
        network,
        maxDemandAcrossStations
      );

      diagnostics.push({
        stationId: station.id,
        stationName: station.name,
        districtName: districtNameById.get(station.id) ?? null,
        capacity: station.capacity,
        currentBikes: station.bikesAvailable,
        currentAnchors: station.anchorsFree,
        currentOccupancy,
        inferredType,
        inferredTypeConfidence: typologyResult.confidence,
        classification: classificationResult.classification,
        classificationReasons: classificationResult.reasons,
        globalMetrics,
        timeBandMetrics,
        targetBand,
        currentTimeBand,
        risk,
        network,
        actionGroup: decision.actionGroup,
        actionReasons: decision.reasons,
        urgency: decision.urgency,
        priorityScore: decision.priorityScore,
      });
    }

    // Sort by priority score descending
    diagnostics.sort((a, b) => b.priorityScore - a.priorityScore);

    // ── Step 9: Transfer matching ────────────────────────────────────────────
    const transfers = computeTransfers(diagnostics, DEFAULT_LOGISTICS_CONFIG);

    // ── Step 10: KPIs and baseline comparison ────────────────────────────────
    const kpis = computeReportKPIs(diagnostics, transfers);
    const baselineComparison = computeBaselineComparison(diagnostics, transfers);

    // ── Step 11: District filter ─────────────────────────────────────────────
    const filteredDiagnostics = districtFilter
      ? diagnostics.filter((d) => d.districtName === districtFilter)
      : diagnostics;

    const filteredTransfers = districtFilter
      ? transfers.filter(
          (t) =>
            filteredDiagnostics.some((d) => d.stationId === t.originStationId) ||
            filteredDiagnostics.some((d) => d.stationId === t.destinationStationId)
        )
      : transfers;

    const summary = buildSummary(filteredDiagnostics, filteredTransfers.length);

    return {
      generatedAt: now.toISOString(),
      modelVersion: MODEL_VERSION,
      analysisWindowDays: days,
      districtFilter,
      summary,
      diagnostics: filteredDiagnostics,
      transfers: filteredTransfers,
      kpis,
      baselineComparison,
    } satisfies RebalancingReport;
  });
}
