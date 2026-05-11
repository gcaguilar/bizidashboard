import 'server-only';

import type { DatasetStatsSummary } from './types';
import { getCoverageSummary } from './coverage-service';

export async function getDatasetStatsSummary(): Promise<DatasetStatsSummary> {
  const coverage = await getCoverageSummary();

  return {
    totalSamples: coverage.totalSamples,
    totalStations: coverage.totalStations,
    totalDays: coverage.totalDays,
    generatedAt: coverage.generatedAt,
  };
}
