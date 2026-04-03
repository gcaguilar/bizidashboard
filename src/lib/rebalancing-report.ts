import 'server-only';

import {
  getStationGlobalMetrics,
  getStationTimeBandMetrics,
  getCriticalEpisodes,
  getStationDistanceMatrix,
} from '@/analytics/queries/rebalancing';
import { getStationsWithLatestStatus, getStationPatternsBulk } from '@/analytics/queries/read';
import { fetchDistrictCollection, buildStationDistrictMap } from '@/lib/districts';
import { withCache } from '@/lib/cache/cache';

import { inferStationType } from '@/lib/station-typology';
import { getTargetBand, getCurrentTimeBand } from '@/lib/target-bands';
import { classifyStation } from '@/lib/station-classifier';
import { assessStationRisk } from '@/lib/rebalancing-prediction';
import { buildNetworkContext } from '@/lib/rebalancing-network';
import { decideAction } from '@/lib/rebalancing-engine';
import { computeTransfers, DEFAULT_LOGISTICS_CONFIG } from '@/lib/rebalancing-matching';
import { computeReportImpact } from '@/lib/rebalancing-impact';

import type { RebalancingReport, StationDiagnostic } from '@/types/rebalancing';

export async function buildRebalancingReport(options: {
  days?: number;
  district?: string | null;
} = {}): Promise<RebalancingReport> {
  const days = options.days ?? 15;
  const cacheKey = `rebalancing-report:days=${days}:district=${options.district ?? 'all'}`;

  return withCache(cacheKey, 300, async () => {
    // 1. Parallel fetch
    const [
      stations,
      globalMetricsMap,
      timeBandMetricsMap,
      episodesMap,
      districtsCollection,
    ] = await Promise.all([
      getStationsWithLatestStatus(),
      getStationGlobalMetrics(days),
      getStationTimeBandMetrics(days),
      getCriticalEpisodes(days),
      fetchDistrictCollection().catch(() => null),
    ]);

    const stationIds = stations.map((s) => s.id);
    const patternsBulk = await getStationPatternsBulk(stationIds);

    // Group patterns by station for faster access
    const patternsByStation = new Map<string, typeof patternsBulk>();
    for (const p of patternsBulk) {
      if (!patternsByStation.has(p.stationId)) {
        patternsByStation.set(p.stationId, []);
      }
      patternsByStation.get(p.stationId)!.push(p);
    }

    const stationDistrictMap = districtsCollection
      ? buildStationDistrictMap(
          stations.map((s) => ({ id: s.id, lon: s.lon, lat: s.lat })),
          districtsCollection
        )
      : new Map<string, string>();

    // 2. Build distance matrix
    const stationCoords = stations.map(s => ({ id: s.id, lat: s.lat, lon: s.lon }));
    const distanceMatrix = await getStationDistanceMatrix(stationCoords, DEFAULT_LOGISTICS_CONFIG.maxTransferDistanceMeters);

    const now = new Date();
    const currentHour = now.getHours();
    const currentTimeBand = getCurrentTimeBand(currentHour);

    const diagnostics: StationDiagnostic[] = [];
    const allGlobalMetrics = Object.values(globalMetricsMap);

    // 3. Process each station
    for (const station of stations) {
      const globalMetrics = globalMetricsMap[station.id];
      if (!globalMetrics) continue; // Skip if no data

      const timeBandMetrics = timeBandMetricsMap[station.id] || [];
      const episodes = episodesMap[station.id];
      if (episodes) {
        globalMetrics.criticalEpisodeAvgMinutes = (episodes.avgEmptyEpisodeMinutes + episodes.avgFullEpisodeMinutes) / 2;
      }

      const patterns = patternsByStation.get(station.id) || [];
      const districtName = stationDistrictMap.get(station.id) ?? null;

      // Type & Band
      const { type: inferredType } = inferStationType(patterns);
      const targetBand = getTargetBand(inferredType, currentTimeBand);

      // Classification
      const { classification, reasons: classificationReasons } = classifyStation(
        station.capacity,
        station.bikesAvailable,
        station.anchorsFree,
        globalMetrics,
        timeBandMetrics,
        targetBand,
        globalMetricsMap
      );

      // Risk Assessment
      const risk = assessStationRisk(station, patterns, timeBandMetrics, targetBand, now);

      // Network Context
      const rawNeighbors = distanceMatrix.get(station.id) || [];
      const network = buildNetworkContext(station.id, station.capacity > 0 ? station.bikesAvailable / station.capacity : 0, rawNeighbors, globalMetricsMap);

      // Action Decision
      const partialDiag: Partial<StationDiagnostic> = {
        stationId: station.id,
        capacity: station.capacity,
        currentBikes: station.bikesAvailable,
        risk,
        classification,
        network,
        targetBand,
        currentTimeBand,
      };

      const { actionGroup, urgency, reasons: actionReasons, priorityScore } = decideAction(partialDiag);

      diagnostics.push({
        stationId: station.id,
        stationName: station.name,
        districtName,
        capacity: station.capacity,
        currentBikes: station.bikesAvailable,
        currentAnchors: station.anchorsFree,
        inferredType,
        classification,
        classificationReasons,
        globalMetrics,
        timeBandMetrics,
        targetBand,
        currentTimeBand,
        risk,
        network,
        actionGroup,
        actionReasons,
        urgency,
        priorityScore,
      });
    }

    // 4. Match Transfers
    const transfers = computeTransfers(diagnostics, stationCoords, DEFAULT_LOGISTICS_CONFIG);

    // 5. Compute Impact & KPIs
    const { kpis, baselineComparison } = computeReportImpact(diagnostics, transfers);

    // Filter by district if requested
    let filteredDiagnostics = diagnostics;
    if (options.district && options.district !== 'all') {
      filteredDiagnostics = diagnostics.filter((d) => d.districtName === options.district);
    }

    // Sort default: priorityScore desc
    filteredDiagnostics.sort((a, b) => b.priorityScore - a.priorityScore);

    const summary = {
      totalStations: filteredDiagnostics.length,
      donors: filteredDiagnostics.filter(d => d.actionGroup === 'donor' || d.actionGroup === 'peak_remove').length,
      receptors: filteredDiagnostics.filter(d => d.actionGroup === 'receptor' || d.actionGroup === 'peak_fill').length,
      interventions: filteredDiagnostics.filter(d => d.actionGroup !== 'stable' && d.actionGroup !== 'review').length,
      balanced: filteredDiagnostics.filter(d => d.actionGroup === 'stable').length,
      review: filteredDiagnostics.filter(d => d.actionGroup === 'review').length,
      activeTransfers: transfers.length,
    };

    return {
      generatedAt: now.toISOString(),
      modelVersion: 'historical-baseline-v1-rebalancing',
      analysisWindowDays: days,
      districtFilter: options.district ?? null,
      summary,
      diagnostics: filteredDiagnostics,
      transfers,
      kpis,
      baselineComparison,
    };
  });
}
