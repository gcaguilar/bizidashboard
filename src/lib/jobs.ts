import { startCollectionJob, stopCollectionJob } from '@/jobs/bizi-collection';
import {
  startAnalyticsAggregationJob,
  stopAnalyticsAggregationJob,
} from '@/jobs/analytics-aggregation';

/**
 * Initialize background jobs on application startup.
 * Preferred usage: call initJobs() from app/layout.tsx (server component).
 */
export function initJobs(): void {
  if (process.env.NODE_ENV === 'test') {
    // Prevent cron jobs from starting during tests
    return;
  }

  console.log('[Jobs] Initializing background jobs...');
  startCollectionJob();
  startAnalyticsAggregationJob();
  console.log('[Jobs] Collection job started');
}

/**
 * Gracefully shut down background jobs.
 */
export function shutdownJobs(): void {
  console.log('[Jobs] Shutting down background jobs...');
  stopCollectionJob();
  stopAnalyticsAggregationJob();
}
