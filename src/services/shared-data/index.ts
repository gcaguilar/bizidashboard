import { cache } from 'react';
import { getCoverageSummary, getSharedDataSource, getHistoryMetadata } from './coverage-service';
import { getPipelineStatusSummary } from './pipeline-status-service';
import { captureWarningWithContext } from '@/lib/sentry-reporting';
import { buildFallbackCoverage, buildFallbackPipelineStatus } from './fallbacks';
import type { SharedDatasetSnapshot } from './types';

export * from './types';
export * from './fallbacks';
export { getCoverageSummary, getHistoryMetadata, getPipelineStatusSummary, getSharedDataSource };

export const getSharedDatasetSnapshot = cache(async (): Promise<SharedDatasetSnapshot> => {
  const nowIso = new Date().toISOString();
  const [coverageResult, pipelineResult] = await Promise.allSettled([
    getCoverageSummary(),
    getPipelineStatusSummary(),
  ]);

  const coverage =
    coverageResult.status === 'fulfilled'
      ? coverageResult.value
      : buildFallbackCoverage(nowIso);
  const pipeline =
    pipelineResult.status === 'fulfilled'
      ? pipelineResult.value
      : buildFallbackPipelineStatus(nowIso);

  if (coverageResult.status === 'rejected') {
    captureWarningWithContext('Shared dataset snapshot degraded: coverage fallback applied.', {
      area: 'shared-data.snapshot',
      operation: 'getSharedDatasetSnapshot',
      dedupeKey: 'shared-data.snapshot.coverage-fallback',
      extra: { reason: String(coverageResult.reason) },
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
    pipeline,
  };
});
