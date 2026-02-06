import 'server-only';

import { headers } from 'next/headers';
import { AlertType, DayType } from '@/analytics/types';

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

async function getBaseUrl(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get('host');
  const proto = headerList.get('x-forwarded-proto') ?? 'http';

  if (!host) {
    throw new Error('No se encontro el host para construir la URL del dashboard.');
  }

  return `${proto}://${host}`;
}

async function fetchJson<T>(path: string): Promise<T> {
  const baseUrl = await getBaseUrl();
  const response = await fetch(new URL(path, baseUrl), {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    const suffix = details ? ` Detalle: ${details}` : '';
    throw new Error(`Error al consultar ${path} (${response.status}).${suffix}`);
  }

  return (await response.json()) as T;
}

function assertArray(value: unknown, label: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Respuesta invalida: ${label} no es una lista.`);
  }
}

export async function fetchStations(): Promise<StationsResponse> {
  const data = await fetchJson<StationsResponse>('/api/stations');
  assertArray(data.stations, 'stations');
  return data;
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

  const searchParams = new URLSearchParams({
    type,
    limit: String(limit),
  });
  const data = await fetchJson<RankingsResponse>(`/api/rankings?${searchParams}`);
  assertArray(data.rankings, 'rankings');
  return data;
}

export async function fetchAlerts(limit = 50): Promise<AlertsResponse> {
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error('El limite de alertas debe ser un entero positivo.');
  }

  const searchParams = new URLSearchParams({ limit: String(limit) });
  const data = await fetchJson<AlertsResponse>(`/api/alerts?${searchParams}`);
  assertArray(data.alerts, 'alerts');
  return data;
}

export async function fetchStatus(): Promise<StatusResponse> {
  const data = await fetchJson<StatusResponse>('/api/status');
  if (!data || typeof data !== 'object') {
    throw new Error('Respuesta invalida al consultar el estado del sistema.');
  }

  return data;
}

export async function fetchPatterns(
  stationId: string
): Promise<StationPatternRow[]> {
  if (!stationId) {
    throw new Error('stationId es obligatorio para patrones.');
  }

  const searchParams = new URLSearchParams({ stationId });
  const data = await fetchJson<StationPatternRow[]>(
    `/api/patterns?${searchParams}`
  );
  assertArray(data, 'patterns');
  return data;
}

export async function fetchHeatmap(stationId: string): Promise<HeatmapCell[]> {
  if (!stationId) {
    throw new Error('stationId es obligatorio para el heatmap.');
  }

  const searchParams = new URLSearchParams({ stationId });
  const data = await fetchJson<HeatmapCell[]>(`/api/heatmap?${searchParams}`);
  assertArray(data, 'heatmap');
  return data;
}
