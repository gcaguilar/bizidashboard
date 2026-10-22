import type {
  AlertsResponse,
  AvailableMonthsResponse,
  HeatmapCell,
  HistoryMetadata,
  RankingsResponse,
  SharedDatasetSnapshot,
  StationPatternRow,
  StationSnapshot,
  StationsResponse,
  StatusResponse,
} from '@/lib/api-types';
import type { DataState } from '@/lib/data-state';
import { withCache } from '@/lib/cache/cache';
import { CacheTTL } from '@/lib/cache/config';
import {
  getActiveAlerts,
  getAvailableDataMonths,
  getHeatmap,
  getStationPatterns,
  getStationPatternsBulk,
  getStationRankings,
  getStationsWithLatestStatus,
  getHistoryMetadata as _getHistoryMetadata,
  getPipelineStatusSummary,
  getSharedDatasetSnapshot as _getSharedDatasetSnapshot,
} from '@/lib/data-query';
import { captureWarningWithContext } from '@/lib/sentry-reporting';
import { logger } from '@/lib/logger';
import {
  resolveDatasetDataState,
  resolveHistoryDataState,
  resolveRankingsDataState,
  resolveStationsDataState,
  resolveStatusDataState,
} from '@/lib/data-state';
import { buildStationDistrictMap } from '@/lib/districts';
import { fetchDistrictCollection } from '@/lib/districts.server';
import {
  attachPeakFullHours,
  buildDistrictSpotlight,
  buildPeakFullHoursByStation,
  enrichRankingRows,
} from '@/lib/ranking-enrichment';

function assertArray(value: unknown, label: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Respuesta inválida: ${label} no es una lista.`);
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

async function fetchLiveStationsFallback(): Promise<StationSnapshot[]> {
  try {
    const { fetchDiscovery, fetchStationInformation, fetchStationStatus } = await import(
      '@/services/gbfs-client'
    );
    const discovery = await fetchDiscovery();
    const [stationStatus, stationInformation] = await Promise.all([
      fetchStationStatus(discovery),
      fetchStationInformation(discovery),
    ]);
    const infoMap = new Map(
      stationInformation.map((station) => [station.station_id, station])
    );
    const recordedAt = new Date(stationStatus.last_updated * 1000).toISOString();

    return stationStatus.data.stations
      .map((status) => {
        const info = infoMap.get(status.station_id);
        return {
          id: status.station_id,
          name: info?.name ?? `Estación ${status.station_id}`,
          lat: Number(info?.lat ?? 0),
          lon: Number(info?.lon ?? 0),
          capacity: Number(info?.capacity ?? status.num_bikes_available + status.num_docks_available),
          bikesAvailable: Number(status.num_bikes_available ?? 0),
          anchorsFree: Number(status.num_docks_available ?? 0),
          recordedAt,
        };
      })
      .filter((station) => Number.isFinite(station.lat) && Number.isFinite(station.lon));
  } catch (error) {
    captureWarningWithContext('Live GBFS stations fallback failed.', {
      area: 'api.fetchStations',
      operation: 'fetchLiveStationsFallback',
      dedupeKey: 'api.fetchStations.live-fallback-failed',
      extra: { reason: String(error) },
    });
    return [];
  }
}

function logFallback<T>(label: string, fallback: T): (err: unknown) => T {
  return (err: unknown) => {
    logger.warn('data_fetcher_fallback', { label, error: err instanceof Error ? err.message : String(err) });
    return fallback;
  };
}

export const STATIONS_CACHE_KEY = 'stations:current';

/**
 * Payload completo de `stations:current`. El prewarm del job de analítica lo
 * reutiliza para que la caché caliente lleve también `dataState`.
 */
export async function buildStationsPayload(): Promise<StationsResponse> {
  const [dbStations, dataset] = await Promise.all([
    getStationsWithLatestStatus().catch(logFallback('stations', [])),
    _getSharedDatasetSnapshot().catch(logFallback('dataset', null)),
  ]);
  const nowIso = new Date().toISOString();
  const stations =
    dbStations.length > 0 ? dbStations : await fetchLiveStationsFallback();
  return {
    stations,
    generatedAt: nowIso,
    dataState: resolveStationsDataState({
      count: stations.length,
      coverage: dataset?.coverage,
      status: dataset?.pipeline,
    }),
  };
}

export async function fetchStations(): Promise<StationsResponse> {
  // `withCache` ya deduplica y cachea esta consulta 60 s (la misma ventana
  // que `fetchCachedStationsWithLatestStatus`), así que no se anida el wrapper.
  const payload = await withCache(STATIONS_CACHE_KEY, CacheTTL.LIVE, buildStationsPayload);

  assertArray(payload.stations, 'stations');
  return {
    ...payload,
    stations: normalizeStations(payload.stations),
  };
}

export type LiteRankingRow = {
  id: number;
  stationId: string;
  turnoverScore: number;
  emptyHours: number;
  fullHours: number;
  totalHours: number;
  windowStart: string;
  windowEnd: string;
};

export type LiteRankingsResponse = {
  type: 'turnover' | 'availability';
  limit: number;
  rankings: LiteRankingRow[];
  generatedAt: string;
  dataState: DataState;
};

export async function fetchRankingsLite(
  type: LiteRankingsResponse['type'],
  limit = 20
): Promise<LiteRankingsResponse> {
  const cacheKey = `rankings-lite:type=${type}:limit=${limit}`;
  return withCache(cacheKey, CacheTTL.ANALYTICS, async () => {
    const [rankings, dataset] = await Promise.all([
      getStationRankings(type, limit),
      _getSharedDatasetSnapshot().catch(logFallback('dataset', null)),
    ]);

    return {
      type,
      limit,
      rankings,
      generatedAt: new Date().toISOString(),
      dataState: resolveRankingsDataState({
        count: rankings.length,
        coverage: dataset?.coverage,
        status: dataset?.pipeline,
        requestedLimit: limit,
      }),
    };
  });
}

export async function fetchRankings(
  type: RankingsResponse['type'],
  limit = 20
): Promise<RankingsResponse> {
  if (!type) {
    throw new Error('Debes indicar el tipo de ranking.');
  }

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error('El límite del ranking debe ser un entero positivo.');
  }

  const cacheKey = `rankings:type=${type}:limit=${limit}`;
  const payload = await withCache(cacheKey, CacheTTL.ANALYTICS, async () => {
    const [rankings, stations, districtCollection, dataset] = await Promise.all([
      getStationRankings(type, limit),
      getStationsWithLatestStatus(),
      fetchDistrictCollection().catch(logFallback('districtCollection', null)),
      _getSharedDatasetSnapshot().catch(logFallback('dataset', null)),
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
    const patternRows = await getStationPatternsBulk(
      enrichedRankings.map((r) => r.stationId)
    ).catch((error) => {
      captureWarningWithContext('Rankings enrichment degraded: station patterns unavailable.', {
        area: 'api.fetchRankings',
        operation: 'fetchRankings',
        dedupeKey: 'api.fetchRankings.station-patterns-fallback',
        extra: { type, limit, reason: String(error) },
      });
      return [];
    });
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
    throw new Error('El límite de alertas debe ser un entero positivo.');
  }

  const cacheKey = `alerts:limit=${limit}`;
  const payload = await withCache(cacheKey, CacheTTL.ANALYTICS, async () => {
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
  const payload = await withCache('status:current', CacheTTL.LIVE, async () => {
    const data = await getPipelineStatusSummary();

    if (!data || typeof data !== 'object') {
      throw new Error('Respuesta inválida al consultar el estado del sistema.');
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
    `patterns:stationId=${stationId}:month=${monthKey ?? 'all'}`, CacheTTL.ANALYTICS,
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
    `heatmap:stationId=${stationId}:month=${monthKey ?? 'all'}`, CacheTTL.ANALYTICS,
    () => getHeatmap(stationId, monthKey ?? undefined)
  );

  assertArray(data, 'heatmap');
  return data;
}

export async function fetchAvailableDataMonths(): Promise<AvailableMonthsResponse> {
  const payload = await withCache('data-months', CacheTTL.ANALYTICS, async () => ({
    months: await getAvailableDataMonths(),
    generatedAt: new Date().toISOString(),
  }));

  assertArray(payload.months, 'months');
  return payload;
}

export async function fetchHistoryMetadata(): Promise<HistoryMetadata> {
  const payload = await withCache('history:metadata', CacheTTL.ANALYTICS, async () => {
    const [historyMetadata, status] = await Promise.all([
      _getHistoryMetadata(),
      getPipelineStatusSummary().catch(logFallback('pipelineStatus', null)),
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
  const payload = await withCache('shared-dataset:snapshot', CacheTTL.LIVE, async () => {
    const snapshot = await _getSharedDatasetSnapshot();

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
