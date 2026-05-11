import 'server-only';

import type { LastUpdatedSummary } from './types';
import { getCoverageSummary } from './coverage-service';

export async function getLastUpdatedSummary(): Promise<LastUpdatedSummary> {
  const coverage = await getCoverageSummary();

  return {
    lastSampleAt: coverage.lastRecordedAt,
    generatedAt: coverage.generatedAt,
  };
}
