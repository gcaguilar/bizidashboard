import 'server-only';

import type { TransitMode } from '@/analytics/queries/transit-read';
import {
  getTransitAlerts,
  getTransitHeatmap,
  getTransitPatterns,
  getTransitRankings,
  getTransitStatus,
  getTransitStopsWithLatestSnapshot,
} from '@/analytics/queries/transit-read';
import { withCache } from '@/lib/cache/cache';

export type TransitStopSnapshot = {
  id: string;
  externalId: string;
  name: string;
  lat: number;
  lon: number;
  provider: string;
  recordedAt: string | null;
  sourceUpdatedAt: string | null;
  etaMinutes: number | null;
  arrivalEvents: number;
  arrivalPressure: number;
  isStale: boolean;
};

export type TransitStopsResponse = {
  mode: TransitMode;
  stops: TransitStopSnapshot[];
  generatedAt: string;
};

export type TransitAlertRow = {
  id: number;
  transitStopId: string;
  stopName: string;
  alertType: string;
  severity: number;
  metricValue: number;
  windowHours: number;
  generatedAt: string;
  isActive: boolean;
};

export type TransitAlertsResponse = {
  mode: TransitMode;
  alerts: TransitAlertRow[];
  limit: number;
  generatedAt: string;
};

export type TransitRankingRow = {
  id: number;
  transitStopId: string;
  stopName: string;
  criticalityScore: number;
  staleRate: number;
  avgEta: number | null;
  noRealtimeHours: number;
  totalHours: number;
  windowStart: string;
  windowEnd: string;
};

export type TransitRankingsResponse = {
  mode: TransitMode;
  rankings: TransitRankingRow[];
  limit: number;
  generatedAt: string;
};

export type TransitPatternRow = {
  transitStopId: string;
  dayType: string;
  hour: number;
  etaAvg: number | null;
  arrivalPressureAvg: number;
  arrivalEventsAvg: number;
  staleRate: number;
  sampleCount: number;
};

export type TransitHeatmapCell = {
  transitStopId: string;
  dayOfWeek: number;
  hour: number;
  etaAvg: number | null;
  arrivalPressureAvg: number;
  arrivalEventsAvg: number;
  staleRate: number;
  sampleCount: number;
};

export type TransitStatusResponse = {
  mode: TransitMode;
  activeStops: number;
  stopsWithRecentSnapshot: number;
  snapshotsLast24Hours: number;
  staleSnapshotsLast24Hours: number;
  lastSnapshotAt: string | null;
  generatedAt: string;
};

const CACHE_TTL_SECONDS = 300;

export async function fetchTransitStops(mode: TransitMode): Promise<TransitStopsResponse> {
  return withCache(`transit:stops:${mode}`, CACHE_TTL_SECONDS, async () => ({
    mode,
    stops: await getTransitStopsWithLatestSnapshot(mode),
    generatedAt: new Date().toISOString(),
  }));
}

export async function fetchTransitAlerts(
  mode: TransitMode,
  limit = 50
): Promise<TransitAlertsResponse> {
  return withCache(`transit:alerts:${mode}:limit=${limit}`, CACHE_TTL_SECONDS, async () => ({
    mode,
    alerts: await getTransitAlerts(mode, limit),
    limit,
    generatedAt: new Date().toISOString(),
  }));
}

export async function fetchTransitRankings(
  mode: TransitMode,
  limit = 50
): Promise<TransitRankingsResponse> {
  return withCache(`transit:rankings:${mode}:limit=${limit}`, CACHE_TTL_SECONDS, async () => ({
    mode,
    rankings: await getTransitRankings(mode, limit),
    limit,
    generatedAt: new Date().toISOString(),
  }));
}

export async function fetchTransitPatterns(
  mode: TransitMode,
  transitStopId: string
): Promise<TransitPatternRow[]> {
  return withCache(`transit:patterns:${mode}:${transitStopId}`, CACHE_TTL_SECONDS, () =>
    getTransitPatterns(mode, transitStopId)
  );
}

export async function fetchTransitHeatmap(
  mode: TransitMode,
  transitStopId: string
): Promise<TransitHeatmapCell[]> {
  return withCache(`transit:heatmap:${mode}:${transitStopId}`, CACHE_TTL_SECONDS, () =>
    getTransitHeatmap(mode, transitStopId)
  );
}

export async function fetchTransitStatus(mode: TransitMode): Promise<TransitStatusResponse> {
  return withCache(`transit:status:${mode}`, 60, async () => ({
    mode,
    ...(await getTransitStatus(mode)),
    generatedAt: new Date().toISOString(),
  }));
}
