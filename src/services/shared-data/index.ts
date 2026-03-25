import 'server-only';

import { getCoverageSummary, getSharedDataSource, getHistoryMetadata } from './coverage-service';
import { getDatasetStatsSummary } from './dataset-stats-service';
import { getLastUpdatedSummary } from './last-updated-service';
import { getPipelineStatusSummary } from './pipeline-status-service';
import type { SharedDatasetSnapshot } from './types';

export * from './types';
export { getCoverageSummary, getDatasetStatsSummary, getHistoryMetadata, getLastUpdatedSummary, getPipelineStatusSummary, getSharedDataSource };

export async function getSharedDatasetSnapshot(): Promise<SharedDatasetSnapshot> {
  const [coverage, lastUpdated, stats, pipeline] = await Promise.all([
    getCoverageSummary(),
    getLastUpdatedSummary(),
    getDatasetStatsSummary(),
    getPipelineStatusSummary(),
  ]);

  return {
    source: getSharedDataSource(),
    coverage,
    lastUpdated,
    stats,
    pipeline,
  };
}
