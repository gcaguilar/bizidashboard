import { startCollectionJob, stopCollectionJob } from '@/jobs/bizi-collection';
import {
  startTransitCollectionJob,
  stopTransitCollectionJob,
} from '@/jobs/transit-collection';
import {
  startAnalyticsAggregationJob,
  stopAnalyticsAggregationJob,
} from '@/jobs/analytics-aggregation';

const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on']);
const ANALYTICS_START_DELAY_MS = 2 * 60 * 1000;

let jobsInitialized = false;
let analyticsStartTimer: ReturnType<typeof setTimeout> | null = null;

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
  startTransitCollectionJob();

  analyticsStartTimer = setTimeout(() => {
    startAnalyticsAggregationJob();
    analyticsStartTimer = null;
    console.log('[Jobs] Analytics job started after startup delay');
  }, ANALYTICS_START_DELAY_MS);

  if (typeof analyticsStartTimer.unref === 'function') {
    analyticsStartTimer.unref();
  }

  jobsInitialized = true;
  console.log('[Jobs] Collection job started');
  console.log('[Jobs] Transit job started');
  console.log('[Jobs] Analytics job scheduled to start in 120 seconds');
}

/**
 * Gracefully shut down background jobs.
 */
export function shutdownJobs(): void {
  if (!jobsInitialized) {
    return;
  }

  console.log('[Jobs] Shutting down background jobs...');

  if (analyticsStartTimer) {
    clearTimeout(analyticsStartTimer);
    analyticsStartTimer = null;
  }

  stopCollectionJob();
  stopTransitCollectionJob();
  stopAnalyticsAggregationJob();
  jobsInitialized = false;
}
