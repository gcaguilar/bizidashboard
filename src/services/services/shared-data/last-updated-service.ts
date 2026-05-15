import { getCoverageSummary } from './coverage-service';
import type { LastUpdatedSummary } from './types';

export async function getLastUpdatedSummary(): Promise<LastUpdatedSummary> {
  const coverage = await getCoverageSummary();

  return {
    lastSampleAt: coverage.lastRecordedAt,
    generatedAt: coverage.generatedAt,
  };
}
