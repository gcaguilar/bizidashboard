/**
 * Standalone jobs process
 *
 * Runs the GBFS collection and analytics aggregation cron jobs
 * as an independent process managed by pm2.
 *
 * Usage:
 *   bun run src/jobs/standalone.ts          # dev
 *   pm2 start ecosystem.config.js           # prod
 */

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
  logger.info('jobs.collection_started');

  analyticsStartTimer = setTimeout(() => {
    startAnalyticsAggregationJob();
    analyticsStartTimer = null;
    logger.info('jobs.analytics_started_after_delay');
  }, ANALYTICS_START_DELAY_MS);

  if (typeof analyticsStartTimer.unref === 'function') {
    analyticsStartTimer.unref();
  }

  jobsInitialized = true;
}

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

// ── Bootstrap ──────────────────────────────────────────────────────────────

initJobs();

process.on('SIGTERM', () => {
  shutdownJobs();
  process.exit(0);
});

process.on('SIGINT', () => {
  shutdownJobs();
  process.exit(0);
});
