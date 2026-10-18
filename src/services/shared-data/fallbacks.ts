import type {
  SharedDatasetSnapshot as SharedDatasetSnapshotResponse,
  StatusResponse,
} from '@/lib/api-types';
import { resolveDatasetDataState, resolveStatusDataState } from '@/lib/data-state';
import { getSharedDataSource } from './coverage-service';
import type {
  CoverageSummary,
  HistoryMetadata,
  PipelineStatusSummary,
  SharedDatasetSnapshot,
  SharedDataSource,
} from './types';

/**
 * Formas degradadas de la capa shared-data. Viven aqui, junto al modulo que es
 * dueño de la forma (types.ts), para que ni los loaders ni los fallbacks de
 * informes vuelvan a escribir el literal del pipeline vacio.
 */

/** Cobertura vacia: la comparten el snapshot vacio y la metadata vacia. */
export function buildFallbackCoverage(nowIso: string): CoverageSummary {
  return {
    firstRecordedAt: null,
    lastRecordedAt: null,
    totalSamples: 0,
    totalStations: 0,
    totalDays: 0,
    generatedAt: nowIso,
  };
}

/** Pipeline degradado sin `dataState`; base de `buildFallbackStatus` y del snapshot. */
export function buildFallbackPipelineStatus(nowIso: string): PipelineStatusSummary {
  return {
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
    operations: {
      cache: {
        configured: false,
        available: false,
        backend: 'disabled' as const,
      },
      recentCollections: [],
      security: {
        failedAuthLast24Hours: 0,
        rateLimitedLast24Hours: 0,
        refreshTokenReuseLast24Hours: 0,
      },
    },
    timestamp: nowIso,
  };
}

/** Status degradado completo, con `dataState`. */
export function buildFallbackStatus(nowIso: string): StatusResponse {
  const status = buildFallbackPipelineStatus(nowIso);

  return {
    ...status,
    dataState: resolveStatusDataState(status),
  };
}

/** Snapshot degradado sin `dataState` (el `dataState` lo añade `lib/data-fetcher`). */
export function structureFallback(nowIso: string): SharedDatasetSnapshot {
  const coverage = buildFallbackCoverage(nowIso);

  return {
    source: getSharedDataSource(),
    coverage,
    lastUpdated: {
      lastSampleAt: coverage.lastRecordedAt,
      generatedAt: coverage.generatedAt,
    },
    stats: {
      totalSamples: coverage.totalSamples,
      totalStations: coverage.totalStations,
      totalDays: coverage.totalDays,
      generatedAt: coverage.generatedAt,
    },
    pipeline: buildFallbackPipelineStatus(nowIso),
  };
}

/** Snapshot degradado con `dataState`, tal y como lo consume `@/lib/api`. */
export function buildFallbackDatasetSnapshot(nowIso: string): SharedDatasetSnapshotResponse {
  const snapshot = structureFallback(nowIso);

  return {
    ...snapshot,
    dataState: resolveDatasetDataState({
      coverage: snapshot.coverage,
      status: snapshot.pipeline,
    }),
  };
}

export function buildFallbackHistoryMetadata(
  nowIso: string,
  source: SharedDataSource
): HistoryMetadata {
  return {
    source,
    coverage: buildFallbackCoverage(nowIso),
    generatedAt: nowIso,
  };
}
