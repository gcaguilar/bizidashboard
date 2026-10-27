import { cache } from 'react';
import {
  fetchHeatmap,
  fetchPatterns,
  fetchRankings,
  fetchStations,
} from '@/lib/api';
import type {
  HeatmapCell,
  PeakFullHourSlot,
  RankingRow,
  StationPatternRow,
  StationSnapshot,
} from '@/lib/api-types';
import { buildStationDistrictMap } from '@/lib/districts';
import { fetchDistrictCollection } from '@/lib/districts.server';
import {
  getEmptyStationPredictions,
  getStationPredictions,
  type StationPredictionsResponse,
} from '@/lib/predictions';
import { appRoutes } from '@/lib/routes';
import {
  evaluatePageIndexability,
  type SeoIndexabilityDecision,
  type SeoIndexabilityInput,
} from '@/lib/seo-policy';
import { slugifyDistrictName } from '@/lib/seo-districts';
import { buildFallbackStations } from '@/lib/shared-data-fallbacks';
import {
  buildStationComparisonMetrics,
  type StationComparisonMetrics,
} from '@/lib/station-district-comparison';

export type StationSeoSummary = {
  station: StationSnapshot;
  districtName: string | null;
  districtSlug: string | null;
  turnover: RankingRow | null;
  availability: RankingRow | null;
  peakHours: PeakFullHourSlot[];
  currentOccupancy: number;
  cityAverageOccupancy: number;
  indexabilityInput: Omit<SeoIndexabilityInput, 'path' | 'canonicalPath'>;
  indexability: SeoIndexabilityDecision;
};

/** Subconjunto de la estación que pintan las listas (alternativas, directorio). */
type StationListSnapshot = Pick<
  StationSnapshot,
  'id' | 'name' | 'bikesAvailable' | 'anchorsFree' | 'capacity'
>;

/** Lo que la ficha pinta de su propia estación; el resto del ranking no viaja al HTML. */
export type StationPageSummary = Pick<
  StationSeoSummary,
  'districtSlug' | 'currentOccupancy' | 'cityAverageOccupancy'
> & { station: StationListSnapshot };

/** Alternativa cercana en la ficha: solo nombre y disponibilidad actual. */
export type RelatedStationSummary = {
  station: Pick<StationSnapshot, 'id' | 'name' | 'bikesAvailable' | 'anchorsFree'>;
};

/** Fila del directorio de estaciones: lo justo para filtrar, ordenar y pintar tarjetas. */
export type StationDirectoryRow = Pick<StationSeoSummary, 'currentOccupancy'> & {
  station: StationListSnapshot;
  turnover: Pick<RankingRow, 'turnoverScore' | 'emptyHours' | 'fullHours'> | null;
};

export function toStationPageSummary(row: StationSeoSummary): StationPageSummary {
  const { id, name, bikesAvailable, anchorsFree, capacity } = row.station;
  return {
    station: { id, name, bikesAvailable, anchorsFree, capacity },
    districtSlug: row.districtSlug,
    currentOccupancy: row.currentOccupancy,
    cityAverageOccupancy: row.cityAverageOccupancy,
  };
}

export function toRelatedStationSummary(row: StationSeoSummary): RelatedStationSummary {
  const { id, name, bikesAvailable, anchorsFree } = row.station;
  return { station: { id, name, bikesAvailable, anchorsFree } };
}

export function toStationDirectoryRow(row: StationSeoSummary): StationDirectoryRow {
  const { id, name, bikesAvailable, anchorsFree, capacity } = row.station;
  return {
    station: { id, name, bikesAvailable, anchorsFree, capacity },
    currentOccupancy: row.currentOccupancy,
    turnover: row.turnover
      ? {
          turnoverScore: row.turnover.turnoverScore,
          emptyHours: row.turnover.emptyHours,
          fullHours: row.turnover.fullHours,
        }
      : null,
  };
}

export type StationSeoPageData = {
  summary: StationPageSummary;
  patterns: StationPatternRow[];
  heatmap: HeatmapCell[];
  predictions: StationPredictionsResponse;
  relatedStations: RelatedStationSummary[];
  highOccupancySlots: StationPatternRow[];
  lowOccupancySlots: StationPatternRow[];
  /** Métricas de las demás estaciones del mismo barrio (para "Frente a tu barrio"). */
  districtPeerMetrics: StationComparisonMetrics[];
};

function buildSummaryComparisonMetrics(row: StationSeoSummary): StationComparisonMetrics {
  return buildStationComparisonMetrics({
    station: row.station,
    turnover: row.turnover,
    availability: row.availability,
  });
}

function toOccupancy(station: StationSnapshot): number {
  if (!Number.isFinite(station.capacity) || station.capacity <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, station.bikesAvailable / station.capacity));
}

function getStationSignalHours(
  turnover: RankingRow | null,
  availability: RankingRow | null
): number {
  return Math.max(
    Number(turnover?.totalHours ?? 0),
    Number(availability?.totalHours ?? 0)
  );
}

function dedupePeakHours(slots: PeakFullHourSlot[]): PeakFullHourSlot[] {
  const seen = new Set<string>();

  return slots.filter((slot) => {
    const key = `${slot.dayType}:${slot.hour}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function buildStationIndexabilityInput({
  station,
  turnover,
  availability,
  peakHours,
}: {
  station: StationSnapshot;
  turnover: RankingRow | null;
  availability: RankingRow | null;
  peakHours: PeakFullHourSlot[];
}): Omit<SeoIndexabilityInput, 'path' | 'canonicalPath'> {
  const signalHours = getStationSignalHours(turnover, availability);
  const hasLiveSnapshotSignal = station.bikesAvailable > 0 || station.anchorsFree > 0;
  return {
    pageType: 'station',
    hasMeaningfulContent: station.capacity > 0,
    hasData:
      (signalHours > 0 &&
        (Number(turnover?.turnoverScore ?? 0) > 0 ||
          Number(availability?.problemHours ?? 0) > 0 ||
          peakHours.length > 0)) ||
      hasLiveSnapshotSignal,
    requiresStrongCoverage: true,
    thresholds: [
      {
        label: 'station-signal-hours',
        current: signalHours,
        minimum: hasLiveSnapshotSignal ? 0 : 24,
      },
      {
        label: 'station-peak-hours',
        current: peakHours.length,
        minimum: hasLiveSnapshotSignal ? 0 : 2,
      },
    ],
  };
}

function sortPatternRows(
  rows: StationPatternRow[],
  direction: 'asc' | 'desc'
): StationPatternRow[] {
  return [...rows]
    .filter(
      (row) =>
        Number.isFinite(row.occupancyAvg) &&
        Number.isFinite(row.sampleCount) &&
        row.sampleCount > 0
    )
    .sort((left, right) => {
      const occupancyDelta = direction === 'desc'
        ? right.occupancyAvg - left.occupancyAvg
        : left.occupancyAvg - right.occupancyAvg;

      if (occupancyDelta !== 0) {
        return occupancyDelta;
      }

      return right.sampleCount - left.sampleCount;
    });
}

export const getStationSeoRows = cache(async (): Promise<StationSeoSummary[]> => {
  const nowIso = new Date().toISOString();
  const stationsResponse = await fetchStations().catch(() => buildFallbackStations(nowIso));
  const stationCount = Math.max(stationsResponse.stations.length, 1);
  const [turnoverResponse, availabilityResponse, districtCollection] = await Promise.all([
    fetchRankings('turnover', stationCount).catch(() => ({
      type: 'turnover' as const,
      limit: stationCount,
      rankings: [],
      districtSpotlight: [],
      generatedAt: nowIso,
      dataState: 'empty' as const,
    })),
    fetchRankings('availability', stationCount).catch(() => ({
      type: 'availability' as const,
      limit: stationCount,
      rankings: [],
      districtSpotlight: [],
      generatedAt: nowIso,
      dataState: 'empty' as const,
    })),
    fetchDistrictCollection().catch(() => null),
  ]);

  const districtMap =
    districtCollection !== null
      ? buildStationDistrictMap(stationsResponse.stations, districtCollection)
      : new Map<string, string>();
  const turnoverMap = new Map(
    turnoverResponse.rankings.map((row) => [row.stationId, row])
  );
  const availabilityMap = new Map(
    availabilityResponse.rankings.map((row) => [row.stationId, row])
  );
  const cityAverageOccupancy =
    stationsResponse.stations.length > 0
      ? stationsResponse.stations.reduce((sum, station) => sum + toOccupancy(station), 0) /
        stationsResponse.stations.length
      : 0;

  return stationsResponse.stations
    .map((station) => {
      const turnover = turnoverMap.get(station.id) ?? null;
      const availability = availabilityMap.get(station.id) ?? null;
      const districtName =
        districtMap.get(station.id) ??
        turnover?.districtName ??
        availability?.districtName ??
        null;
      const districtSlug = districtName ? slugifyDistrictName(districtName) : null;
      const peakHours = dedupePeakHours([
        ...(availability?.peakFullHours ?? []),
        ...(turnover?.peakFullHours ?? []),
      ]).slice(0, 3);
      const indexabilityInput = buildStationIndexabilityInput({
        station,
        turnover,
        availability,
        peakHours,
      });
      const indexability = evaluatePageIndexability({
        path: appRoutes.stationDetail(station.id),
        ...indexabilityInput,
      });

      return {
        station,
        districtName,
        districtSlug,
        turnover,
        availability,
        peakHours,
        currentOccupancy: toOccupancy(station),
        cityAverageOccupancy,
        indexabilityInput,
        indexability,
      };
    })
    .sort((left, right) => {
      const demandDelta =
        Number(right.turnover?.turnoverScore ?? 0) -
        Number(left.turnover?.turnoverScore ?? 0);

      if (demandDelta !== 0) {
        return demandDelta;
      }

      const availabilityDelta =
        Number(right.availability?.problemHours ?? 0) -
        Number(left.availability?.problemHours ?? 0);

      if (availabilityDelta !== 0) {
        return availabilityDelta;
      }

      return left.station.name.localeCompare(right.station.name, 'es');
    });
});

export const getStationSeoRowById = cache(
  async (stationId: string): Promise<StationSeoSummary | null> => {
    const rows = await getStationSeoRows();
    return rows.find((row) => row.station.id === stationId) ?? null;
  }
);

export const getStationSeoPageData = cache(
  async (stationId: string): Promise<StationSeoPageData | null> => {
    const [rows, patterns, heatmap, predictions] = await Promise.all([
      getStationSeoRows(),
      fetchPatterns(stationId).catch(() => []),
      fetchHeatmap(stationId).catch(() => []),
      getStationPredictions(stationId).catch(() => null),
    ]);
    const summary = rows.find((row) => row.station.id === stationId) ?? null;

    if (!summary) {
      return null;
    }

    const relatedStations = rows
      .filter(
        (row) =>
          row.station.id !== stationId &&
          row.districtSlug !== null &&
          row.districtSlug === summary.districtSlug &&
          row.indexability.indexable
      )
      .slice(0, 4)
      .map(toRelatedStationSummary);

    const districtPeerMetrics =
      summary.districtSlug === null
        ? []
        : rows
            .filter((row) => row.station.id !== stationId && row.districtSlug === summary.districtSlug)
            .map(buildSummaryComparisonMetrics);

    return {
      summary: toStationPageSummary(summary),
      districtPeerMetrics,
      patterns,
      heatmap,
      predictions: predictions ?? getEmptyStationPredictions(stationId),
      relatedStations,
      highOccupancySlots: sortPatternRows(patterns, 'desc').slice(0, 3),
      lowOccupancySlots: sortPatternRows(patterns, 'asc').slice(0, 3),
    };
  }
);
