import { startCollectionJob, stopCollectionJob } from '@/jobs/bizi-collection';
import {
  startAnalyticsAggregationJob,
  stopAnalyticsAggregationJob,
} from '@/jobs/analytics-aggregation';

const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on']);

let jobsInitialized = false;

function shouldEnableInternalJobs(): boolean {
  if (process.env.NODE_ENV === 'test') {
    return false;
  }

  const rawValue = process.env.ENABLE_INTERNAL_JOBS;

  if (!rawValue || rawValue.trim() === '') {
    return process.env.NODE_ENV === 'production';
  }

  return ENABLED_VALUES.has(rawValue.trim().toLowerCase());
}

/**
 * Initialize background jobs on application startup.
 * Called from src/instrumentation.ts on Node.js runtime startup.
 */
export function initJobs(): void {
  if (jobsInitialized) {
    return;
  }

  if (!shouldEnableInternalJobs()) {
    console.log('[Jobs] Internal jobs disabled (set ENABLE_INTERNAL_JOBS=true to enable)');
    return;
  }

  console.log('[Jobs] Initializing background jobs...');
  startCollectionJob();
  startAnalyticsAggregationJob();
  jobsInitialized = true;
  console.log('[Jobs] Collection job started');
}

/**
 * Gracefully shut down background jobs.
 */
export function shutdownJobs(): void {
  if (!jobsInitialized) {
    return;
  }

  console.log('[Jobs] Shutting down background jobs...');
  stopCollectionJob();
  stopAnalyticsAggregationJob();
  jobsInitialized = false;
}
