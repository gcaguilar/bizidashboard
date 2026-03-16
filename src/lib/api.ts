import 'server-only';

import { AlertType, DayType } from '@/analytics/types';
import {
  getActiveAlerts,
  getAvailableDataMonths,
  getHeatmap,
  getStationPatterns,
  getStationRankings,
  getStationsWithLatestStatus,
} from '@/analytics/queries/read';
import { withCache } from '@/lib/cache/cache';
import { getStatus } from '@/lib/metrics';

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
};

export type RankingRow = {
  id: number;
  stationId: string;
  turnoverScore: number;
  emptyHours: number;
  fullHours: number;
  totalHours: number;
  windowStart: string;
  windowEnd: string;
};

export type RankingsResponse = {
  type: 'turnover' | 'availability';
  limit: number;
  rankings: RankingRow[];
  generatedAt: string;
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

export type StatusResponse = {
  pipeline: {
    lastSuccessfulPoll: string | null;
    totalRowsCollected: number;
    pollsLast24Hours: number;
    validationErrors: number;
    consecutiveFailures: number;
    lastDataFreshness: boolean;
    lastStationCount: number;
    averageStationsPerPoll: number;
    healthStatus: string;
    healthReason: string | null;
  };
  quality: {
    freshness: {
      isFresh: boolean;
      lastUpdated: string | null;
      maxAgeSeconds: number;
    };
    volume: {
      recentStationCount: number;
      averageStationsPerPoll: number;
      expectedRange: { min: number; max: number };
    };
    lastCheck: string | null;
  };
  system: {
    uptime: string;
    version: string;
    environment: string;
  };
  timestamp: string;
};

const CACHE_TTL_SECONDS = 300;

function assertArray(value: unknown, label: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Respuesta invalida: ${label} no es una lista.`);
  }
}

export async function fetchStations(): Promise<StationsResponse> {
  const payload = await withCache('stations:current', CACHE_TTL_SECONDS, async () => {
    const stations = await getStationsWithLatestStatus();
    return {
      stations,
      generatedAt: new Date().toISOString(),
    };
  });

  assertArray(payload.stations, 'stations');
  return payload;
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
  const payload = await withCache(cacheKey, CACHE_TTL_SECONDS, async () => {
    const rankings = await getStationRankings(type, limit);
    return {
      type,
      limit,
      rankings,
      generatedAt: new Date().toISOString(),
    };
  });

  assertArray(payload.rankings, 'rankings');
  return payload;
}

export async function fetchAlerts(limit = 50): Promise<AlertsResponse> {
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error('El limite de alertas debe ser un entero positivo.');
  }

  const cacheKey = `alerts:limit=${limit}`;
  const payload = await withCache(cacheKey, CACHE_TTL_SECONDS, async () => {
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
  const payload = await withCache('status:current', CACHE_TTL_SECONDS, async () => {
    const rawStatus = await getStatus();
    const data = JSON.parse(JSON.stringify(rawStatus)) as StatusResponse;

    if (!data || typeof data !== 'object') {
      throw new Error('Respuesta invalida al consultar el estado del sistema.');
    }

    return data;
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
    CACHE_TTL_SECONDS,
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
    CACHE_TTL_SECONDS,
    () => getHeatmap(stationId, monthKey ?? undefined)
  );

  assertArray(data, 'heatmap');
  return data;
}

export async function fetchAvailableDataMonths(): Promise<AvailableMonthsResponse> {
  const payload = await withCache('data-months', CACHE_TTL_SECONDS, async () => ({
    months: await getAvailableDataMonths(),
    generatedAt: new Date().toISOString(),
  }));

  assertArray(payload.months, 'months');
  return payload;
}
