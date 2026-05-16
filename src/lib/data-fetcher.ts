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
import { DataCache } from '@/lib/data-cache';
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

async function fetchLiveStationsFallback(): Promise<StationSnapshot[]> {
  try {
    const [{ fetchDiscovery, fetchStationInformation, fetchStationStatus }] = await Promise.all([
      import('@/services/gbfs-client'),
    ]);
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
          name: info?.name ?? `Estacion ${status.station_id}`,
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

const cache = new DataCache();

export async function fetchStations(): Promise<StationsResponse> {
  const payload = await cache.live('stations:current', async () => {
    const [dbStations, dataset] = await Promise.all([
      getStationsWithLatestStatus().catch(() => []),
      _getSharedDatasetSnapshot().catch(() => null),
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
  });

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
  return cache.analytics(cacheKey, async () => {
    const [rankings, dataset] = await Promise.all([
      getStationRankings(type, limit),
      _getSharedDatasetSnapshot().catch(() => null),
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
    throw new Error('El limite del ranking debe ser un entero positivo.');
  }

  const cacheKey = `rankings:type=${type}:limit=${limit}`;
  const payload = await cache.analytics(cacheKey, async () => {
    const [rankings, stations, districtCollection, dataset] = await Promise.all([
      getStationRankings(type, limit),
      getStationsWithLatestStatus(),
      fetchDistrictCollection().catch(() => null),
      _getSharedDatasetSnapshot().catch(() => null),
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
    throw new Error('El limite de alertas debe ser un entero positivo.');
  }

  const cacheKey = `alerts:limit=${limit}`;
  const payload = await cache.analytics(cacheKey, async () => {
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
  const payload = await cache.live('status:current', async () => {
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

  const data = await cache.analytics(
    `patterns:stationId=${stationId}:month=${monthKey ?? 'all'}`,
    () => getStationPatterns(stationId, monthKey ?? undefined)
  );

  assertArray(data, 'patterns');
  return data;
}

export async function fetchHeatmap(stationId: string, monthKey?: string | null): Promise<HeatmapCell[]> {
  if (!stationId) {
    throw new Error('stationId es obligatorio para el heatmap.');
  }

  const data = await cache.analytics(
    `heatmap:stationId=${stationId}:month=${monthKey ?? 'all'}`,
    () => getHeatmap(stationId, monthKey ?? undefined)
  );

  assertArray(data, 'heatmap');
  return data;
}

export async function fetchAvailableDataMonths(): Promise<AvailableMonthsResponse> {
  const payload = await cache.analytics('data-months', async () => ({
    months: await getAvailableDataMonths(),
    generatedAt: new Date().toISOString(),
  }));

  assertArray(payload.months, 'months');
  return payload;
}

export async function fetchHistoryMetadata(): Promise<HistoryMetadata> {
  const payload = await cache.analytics('history:metadata', async () => {
    const [historyMetadata, status] = await Promise.all([
      _getHistoryMetadata(),
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
  const payload = await cache.live('shared-dataset:snapshot', async () => {
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

export class DataFetcher {
  private cache: DataCache;

  constructor(ttl?: { live?: number; analytics?: number }) {
    this.cache = new DataCache(ttl);
  }

  async fetchStations(): Promise<StationsResponse> {
    const payload = await this.cache.live('stations:current', async () => {
      const [dbStations, dataset] = await Promise.all([
        getStationsWithLatestStatus().catch(() => []),
        _getSharedDatasetSnapshot().catch(() => null),
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
    });

    assertArray(payload.stations, 'stations');
    return {
      ...payload,
      stations: normalizeStations(payload.stations),
    };
  }

  async fetchRankingsLite(
    type: LiteRankingsResponse['type'],
    limit = 20
  ): Promise<LiteRankingsResponse> {
    const cacheKey = `rankings-lite:type=${type}:limit=${limit}`;
    return this.cache.analytics(cacheKey, async () => {
      const [rankings, dataset] = await Promise.all([
        getStationRankings(type, limit),
        _getSharedDatasetSnapshot().catch(() => null),
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

  async fetchRankings(
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
    const payload = await this.cache.analytics(cacheKey, async () => {
      const [rankings, stations, districtCollection, dataset] = await Promise.all([
        getStationRankings(type, limit),
        getStationsWithLatestStatus(),
        fetchDistrictCollection().catch(() => null),
        _getSharedDatasetSnapshot().catch(() => null),
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

  async fetchAlerts(limit = 50): Promise<AlertsResponse> {
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new Error('El limite de alertas debe ser un entero positivo.');
    }

    const cacheKey = `alerts:limit=${limit}`;
    const payload = await this.cache.analytics(cacheKey, async () => {
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

  async fetchStatus(): Promise<StatusResponse> {
    const payload = await this.cache.live('status:current', async () => {
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

  async fetchPatterns(
    stationId: string,
    monthKey?: string | null
  ): Promise<StationPatternRow[]> {
    if (!stationId) {
      throw new Error('stationId es obligatorio para patrones.');
    }

    const data = await this.cache.analytics(
      `patterns:stationId=${stationId}:month=${monthKey ?? 'all'}`,
      () => getStationPatterns(stationId, monthKey ?? undefined)
    );

    assertArray(data, 'patterns');
    return data;
  }

  async fetchHeatmap(stationId: string, monthKey?: string | null): Promise<HeatmapCell[]> {
    if (!stationId) {
      throw new Error('stationId es obligatorio para el heatmap.');
    }

    const data = await this.cache.analytics(
      `heatmap:stationId=${stationId}:month=${monthKey ?? 'all'}`,
      () => getHeatmap(stationId, monthKey ?? undefined)
    );

    assertArray(data, 'heatmap');
    return data;
  }

  async fetchAvailableDataMonths(): Promise<AvailableMonthsResponse> {
    const payload = await this.cache.analytics('data-months', async () => ({
      months: await getAvailableDataMonths(),
      generatedAt: new Date().toISOString(),
    }));

    assertArray(payload.months, 'months');
    return payload;
  }

  async fetchHistoryMetadata(): Promise<HistoryMetadata> {
    const payload = await this.cache.analytics('history:metadata', async () => {
      const [historyMetadata, status] = await Promise.all([
        _getHistoryMetadata(),
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

  async fetchSharedDatasetSnapshot(): Promise<SharedDatasetSnapshot> {
    const payload = await this.cache.live('shared-dataset:snapshot', async () => {
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
}
