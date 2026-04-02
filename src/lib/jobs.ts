import { startCollectionJob, stopCollectionJob } from '@/jobs/bizi-collection';
import {
  startAnalyticsAggregationJob,
  stopAnalyticsAggregationJob,
} from '@/jobs/analytics-aggregation';
import { logger } from '@/lib/logger';

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
    return false;
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
    logger.info('jobs.internal_disabled');
    return;
  }

  logger.info('jobs.initializing');
  startCollectionJob();

  analyticsStartTimer = setTimeout(() => {
    startAnalyticsAggregationJob();
    analyticsStartTimer = null;
    logger.info('jobs.analytics_started_after_delay');
  }, ANALYTICS_START_DELAY_MS);

  if (typeof analyticsStartTimer.unref === 'function') {
    analyticsStartTimer.unref();
  }

  jobsInitialized = true;
  logger.info('jobs.collection_started');
  logger.info('jobs.analytics_scheduled', { delayMs: ANALYTICS_START_DELAY_MS });
}

/**
 * Gracefully shut down background jobs.
 */
export function shutdownJobs(): void {
  if (!jobsInitialized) {
    return;
  }

  logger.info('jobs.shutting_down');

  if (analyticsStartTimer) {
    clearTimeout(analyticsStartTimer);
    analyticsStartTimer = null;
  }

  stopCollectionJob();
  stopAnalyticsAggregationJob();
  jobsInitialized = false;
}
