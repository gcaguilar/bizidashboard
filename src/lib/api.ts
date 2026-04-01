import 'server-only';

import { AlertType, DayType } from '@/analytics/types';
import {
  getActiveAlerts,
  getAvailableDataMonths,
  getHeatmap,
  getStationPatterns,
  getStationPatternsBulk,
  getStationRankings,
  getStationsWithLatestStatus,
} from '@/analytics/queries/read';
import { withCache } from '@/lib/cache/cache';
import {
  resolveDatasetDataState,
  resolveHistoryDataState,
  resolveRankingsDataState,
  resolveStationsDataState,
  resolveStatusDataState,
  type DataState,
} from '@/lib/data-state';
import { buildStationDistrictMap, fetchDistrictCollection } from '@/lib/districts';
import {
  attachPeakFullHours,
  buildDistrictSpotlight,
  buildPeakFullHoursByStation,
  enrichRankingRows,
  type DistrictSpotlightRow,
  type EnrichedRankingRow,
} from '@/lib/ranking-enrichment';
import {
  getHistoryMetadata,
  getPipelineStatusSummary,
  getSharedDatasetSnapshot,
  type CoverageSummary,
  type HistoryMetadata as HistoryMetadataBase,
  type PipelineStatusSummary,
  type SharedDatasetSnapshot as SharedDatasetSnapshotBase,
} from '@/services/shared-data';

export type StationSnapshot = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  capacity: number;
  bikesAvailable: number;
  anchorsFree: number;
  recordedAt: string;
};

export type StationsResponse = {
  stations: StationSnapshot[];
  generatedAt: string;
  dataState: DataState;
};

/** Fila de ranking con nombre, barrio y lectura demanda vs huecos (API /api/rankings). */
export type RankingRow = EnrichedRankingRow;

export type { DistrictSpotlightRow, PeakFullHourSlot } from '@/lib/ranking-enrichment';

export type RankingsResponse = {
  type: 'turnover' | 'availability';
  limit: number;
  rankings: EnrichedRankingRow[];
  districtSpotlight: DistrictSpotlightRow[];
  generatedAt: string;
  dataState: DataState;
};

export type StationPatternRow = {
  stationId: string;
  dayType: DayType | string;
  hour: number;
  bikesAvg: number;
  anchorsAvg: number;
  occupancyAvg: number;
  sampleCount: number;
};

export type HeatmapCell = {
  stationId: string;
  dayOfWeek: number;
  hour: number;
  bikesAvg: number;
  anchorsAvg: number;
  occupancyAvg: number;
  sampleCount: number;
};

export type AlertRow = {
  id: number;
  stationId: string;
  alertType: AlertType | string;
  severity: number;
  metricValue: number;
  windowHours: number;
  generatedAt: string;
  isActive: boolean;
};

export type AlertsResponse = {
  limit: number;
  alerts: AlertRow[];
  generatedAt: string;
};

export type AvailableMonthsResponse = {
  months: string[];
  generatedAt: string;
};

export type StatusResponse = PipelineStatusSummary & {
  dataState: DataState;
};

export type HistoryMetadata = HistoryMetadataBase & {
  dataState: DataState;
};

export type SharedDatasetSnapshot = SharedDatasetSnapshotBase & {
  dataState: DataState;
};

export type { CoverageSummary };

const LIVE_CACHE_TTL_SECONDS = 60;
const ANALYTICS_CACHE_TTL_SECONDS = 300;

function assertArray(value: unknown, label: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Respuesta invalida: ${label} no es una lista.`);
  }
}

function normalizeRecordedAt(recordedAt: string | Date): string {
  return recordedAt instanceof Date ? recordedAt.toISOString() : recordedAt;
}

function normalizeStations(
  stations: Array<Omit<StationSnapshot, 'recordedAt'> & { recordedAt: string | Date }>
): StationSnapshot[] {
  return stations.map((station) => ({
    ...station,
    recordedAt: normalizeRecordedAt(station.recordedAt),
  }));
}

export async function fetchStations(): Promise<StationsResponse> {
  const payload = await withCache('stations:current', LIVE_CACHE_TTL_SECONDS, async () => {
    const [stations, dataset] = await Promise.all([
      getStationsWithLatestStatus(),
      getSharedDatasetSnapshot().catch(() => null),
    ]);
    return {
      stations,
      generatedAt: new Date().toISOString(),
      dataState: resolveStationsDataState({
        count: stations.length,
        coverage: dataset?.coverage,
        status: dataset?.pipeline,
      }),
    };
  });

  assertArray(payload.stations, 'stations');
  return {
    ...payload,
    stations: normalizeStations(
      payload.stations as Array<
        Omit<StationSnapshot, 'recordedAt'> & { recordedAt: string | Date }
      >
    ),
  };
}

export async function fetchRankings(
  type: RankingsResponse['type'],
  limit = 20
): Promise<RankingsResponse> {
  if (!type) {
    throw new Error('Debes indicar el tipo de ranking.');
  }

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error('El limite del ranking debe ser un entero positivo.');
  }

  const cacheKey = `rankings:type=${type}:limit=${limit}`;
  const payload = await withCache(cacheKey, ANALYTICS_CACHE_TTL_SECONDS, async () => {
    const [rankings, stations, districtCollection, dataset] = await Promise.all([
      getStationRankings(type, limit),
      getStationsWithLatestStatus(),
      fetchDistrictCollection().catch(() => null),
      getSharedDatasetSnapshot().catch(() => null),
    ]);

    const stationNameById = new Map(stations.map((s) => [s.id, s.name]));
    const districtNameById =
      districtCollection !== null
        ? buildStationDistrictMap(
            stations.map((s) => ({ id: s.id, lon: s.lon, lat: s.lat })),
            districtCollection
          )
        : new Map<string, string>();

    let enrichedRankings = enrichRankingRows(rankings, stationNameById, districtNameById);
    const patternRows = await getStationPatternsBulk(enrichedRankings.map((r) => r.stationId));
    const peakMap = buildPeakFullHoursByStation(patternRows);
    enrichedRankings = attachPeakFullHours(enrichedRankings, peakMap);
    const districtSpotlight = buildDistrictSpotlight(enrichedRankings, type);

    return {
      type,
      limit,
      rankings: enrichedRankings,
      districtSpotlight,
      generatedAt: new Date().toISOString(),
      dataState: resolveRankingsDataState({
        count: enrichedRankings.length,
        coverage: dataset?.coverage,
        status: dataset?.pipeline,
        requestedLimit: limit,
      }),
    };
  });

  assertArray(payload.rankings, 'rankings');
  const districtSpotlight = Array.isArray(payload.districtSpotlight)
    ? payload.districtSpotlight
    : [];

  if (!Array.isArray(payload.districtSpotlight)) {
    console.warn(
      '[Rankings] Payload legacy sin districtSpotlight como lista; se normaliza a [].'
    );
  }

  return {
    ...payload,
    districtSpotlight,
  };
}

export async function fetchAlerts(limit = 50): Promise<AlertsResponse> {
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error('El limite de alertas debe ser un entero positivo.');
  }

  const cacheKey = `alerts:limit=${limit}`;
  const payload = await withCache(cacheKey, ANALYTICS_CACHE_TTL_SECONDS, async () => {
    const alerts = await getActiveAlerts(limit);
    return {
      limit,
      alerts,
      generatedAt: new Date().toISOString(),
    };
  });

  assertArray(payload.alerts, 'alerts');
  return payload;
}

export async function fetchStatus(): Promise<StatusResponse> {
  const payload = await withCache('status:current', LIVE_CACHE_TTL_SECONDS, async () => {
    const data = await getPipelineStatusSummary();

    if (!data || typeof data !== 'object') {
      throw new Error('Respuesta invalida al consultar el estado del sistema.');
    }

    return {
      ...data,
      dataState: resolveStatusDataState(data),
    };
  });

  return payload;
}

export async function fetchPatterns(
  stationId: string,
  monthKey?: string | null
): Promise<StationPatternRow[]> {
  if (!stationId) {
    throw new Error('stationId es obligatorio para patrones.');
  }

  const data = await withCache(
    `patterns:stationId=${stationId}:month=${monthKey ?? 'all'}`,
    ANALYTICS_CACHE_TTL_SECONDS,
    () => getStationPatterns(stationId, monthKey ?? undefined)
  );

  assertArray(data, 'patterns');
  return data;
}

export async function fetchHeatmap(stationId: string, monthKey?: string | null): Promise<HeatmapCell[]> {
  if (!stationId) {
    throw new Error('stationId es obligatorio para el heatmap.');
  }

  const data = await withCache(
    `heatmap:stationId=${stationId}:month=${monthKey ?? 'all'}`,
    ANALYTICS_CACHE_TTL_SECONDS,
    () => getHeatmap(stationId, monthKey ?? undefined)
  );

  assertArray(data, 'heatmap');
  return data;
}

export async function fetchAvailableDataMonths(): Promise<AvailableMonthsResponse> {
  const payload = await withCache('data-months', ANALYTICS_CACHE_TTL_SECONDS, async () => ({
    months: await getAvailableDataMonths(),
    generatedAt: new Date().toISOString(),
  }));

  assertArray(payload.months, 'months');
  return payload;
}

export async function fetchHistoryMetadata(): Promise<HistoryMetadata> {
  const payload = await withCache('history:metadata', ANALYTICS_CACHE_TTL_SECONDS, async () => {
    const [historyMetadata, status] = await Promise.all([
      getHistoryMetadata(),
      getPipelineStatusSummary().catch(() => null),
    ]);

    return {
      ...historyMetadata,
      dataState: resolveHistoryDataState({
        count: historyMetadata.coverage.totalDays,
        coverage: historyMetadata.coverage,
        status,
        expectedDays: 30,
      }),
    };
  });

  return payload;
}

export async function fetchSharedDatasetSnapshot(): Promise<SharedDatasetSnapshot> {
  const payload = await withCache('shared-dataset:snapshot', LIVE_CACHE_TTL_SECONDS, async () => {
    const snapshot = await getSharedDatasetSnapshot();

    return {
      ...snapshot,
      dataState: resolveDatasetDataState({
        coverage: snapshot.coverage,
        status: snapshot.pipeline,
      }),
    };
  });

  return payload;
}
