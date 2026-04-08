import 'server-only';

import { getCoverageSummary, getSharedDataSource, getHistoryMetadata } from './coverage-service';
import { getDatasetStatsSummary } from './dataset-stats-service';
import { getLastUpdatedSummary } from './last-updated-service';
import { getPipelineStatusSummary } from './pipeline-status-service';
import { captureWarningWithContext } from '@/lib/sentry-reporting';
import type { SharedDatasetSnapshot } from './types';

export * from './types';
export { getCoverageSummary, getDatasetStatsSummary, getHistoryMetadata, getLastUpdatedSummary, getPipelineStatusSummary, getSharedDataSource };

export async function getSharedDatasetSnapshot(): Promise<SharedDatasetSnapshot> {
  const nowIso = new Date().toISOString();
  const [coverageResult, lastUpdatedResult, statsResult, pipelineResult] = await Promise.allSettled([
    getCoverageSummary(),
    getLastUpdatedSummary(),
    getDatasetStatsSummary(),
    getPipelineStatusSummary(),
  ]);

  const coverage =
    coverageResult.status === 'fulfilled'
      ? coverageResult.value
      : {
          firstRecordedAt: null,
          lastRecordedAt: null,
          totalSamples: 0,
          totalStations: 0,
          totalDays: 0,
          generatedAt: nowIso,
        };
  const lastUpdated =
    lastUpdatedResult.status === 'fulfilled'
      ? lastUpdatedResult.value
      : {
          lastSampleAt: null,
          generatedAt: nowIso,
        };
  const stats =
    statsResult.status === 'fulfilled'
      ? statsResult.value
      : {
          totalSamples: 0,
          totalStations: 0,
          totalDays: 0,
          generatedAt: nowIso,
        };
  const pipeline =
    pipelineResult.status === 'fulfilled'
      ? pipelineResult.value
      : {
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
            healthReason: 'Partial shared snapshot fallback due to upstream failure.',
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
            lastCheck: nowIso,
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

  if (coverageResult.status === 'rejected') {
    captureWarningWithContext('Shared dataset snapshot degraded: coverage fallback applied.', {
      area: 'shared-data.snapshot',
      operation: 'getSharedDatasetSnapshot',
      dedupeKey: 'shared-data.snapshot.coverage-fallback',
      extra: { reason: String(coverageResult.reason) },
    });
  }
  if (lastUpdatedResult.status === 'rejected') {
    captureWarningWithContext('Shared dataset snapshot degraded: lastUpdated fallback applied.', {
      area: 'shared-data.snapshot',
      operation: 'getSharedDatasetSnapshot',
      dedupeKey: 'shared-data.snapshot.lastUpdated-fallback',
      extra: { reason: String(lastUpdatedResult.reason) },
    });
  }
  if (statsResult.status === 'rejected') {
    captureWarningWithContext('Shared dataset snapshot degraded: stats fallback applied.', {
      area: 'shared-data.snapshot',
      operation: 'getSharedDatasetSnapshot',
      dedupeKey: 'shared-data.snapshot.stats-fallback',
      extra: { reason: String(statsResult.reason) },
    });
  }
  if (pipelineResult.status === 'rejected') {
    captureWarningWithContext('Shared dataset snapshot degraded: pipeline fallback applied.', {
      area: 'shared-data.snapshot',
      operation: 'getSharedDatasetSnapshot',
      dedupeKey: 'shared-data.snapshot.pipeline-fallback',
      extra: { reason: String(pipelineResult.reason) },
    });
  }

  return {
    source: getSharedDataSource(),
    coverage,
    lastUpdated,
    stats,
    pipeline,
  };
}
