import type {
  AvailableMonthsResponse,
  SharedDatasetSnapshot,
  StationsResponse,
  StatusResponse,
} from '@/lib/api';
import {
  resolveDataState,
  resolveDatasetDataState,
  resolveStatusDataState,
} from '@/lib/data-state';
import { getSharedDataSource } from '@/services/shared-data';

export function buildFallbackStatus(nowIso: string): StatusResponse {
  const fallback = {
    pipeline: {
      lastSuccessfulPoll: null,
      totalRowsCollected: 0,
      pollsLast24Hours: 0,
        validationErrors: 0,
        consecutiveFailures: 0,
        lastDataFreshness: false,
        lastStationCount: 0,
        averageStationsPerPoll: 0,
        healthStatus: 'down' as const,
        healthReason: 'No se pudieron consultar las tablas de datos.',
      },
    quality: {
      freshness: {
        isFresh: false,
        lastUpdated: null,
        maxAgeSeconds: 600,
      },
      volume: {
        recentStationCount: 0,
        averageStationsPerPoll: 0,
        expectedRange: { min: 200, max: 500 },
      },
      lastCheck: null,
    },
    system: {
      uptime: nowIso,
      version: process.env.npm_package_version ?? '0.1.0',
      environment: process.env.NODE_ENV ?? 'production',
    },
    timestamp: nowIso,
  };

  return {
    ...fallback,
    dataState: resolveStatusDataState(fallback),
  };
}

export function buildFallbackDatasetSnapshot(nowIso: string): SharedDatasetSnapshot {
  const fallback = {
    source: getSharedDataSource(),
    coverage: {
      firstRecordedAt: null,
      lastRecordedAt: null,
      totalSamples: 0,
      totalStations: 0,
      totalDays: 0,
      generatedAt: nowIso,
    },
    lastUpdated: {
      lastSampleAt: null,
      generatedAt: nowIso,
    },
    stats: {
      totalSamples: 0,
      totalStations: 0,
      totalDays: 0,
      generatedAt: nowIso,
    },
    pipeline: buildFallbackStatus(nowIso),
  };

  return {
    ...fallback,
    dataState: resolveDatasetDataState({
      coverage: fallback.coverage,
      status: fallback.pipeline,
    }),
  };
}

export function buildFallbackStations(nowIso: string): StationsResponse {
  return {
    stations: [],
    generatedAt: nowIso,
    dataState: resolveDataState({
      hasCoverage: false,
      hasData: false,
    }),
  };
}

export function buildFallbackAvailableMonths(nowIso: string): AvailableMonthsResponse {
  return {
    months: [],
    generatedAt: nowIso,
  };
}
