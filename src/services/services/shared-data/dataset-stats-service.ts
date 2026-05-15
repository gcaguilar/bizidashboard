import { getCoverageSummary } from './coverage-service';
import type { DatasetStatsSummary } from './types';

export async function getDatasetStatsSummary(): Promise<DatasetStatsSummary> {
  const coverage = await getCoverageSummary();

  return {
    totalSamples: coverage.totalSamples,
    totalStations: coverage.totalStations,
    totalDays: coverage.totalDays,
    generatedAt: coverage.generatedAt,
  };
}
