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

import '@/instrument.server'
import { acquireJobLock } from '@/analytics/job-lock';
import { startCollectionJob, stopCollectionJob } from '@/jobs/bizi-collection';
import {
  startAnalyticsAggregationJob,
  stopAnalyticsAggregationJob,
} from '@/jobs/analytics-aggregation';
import {
  startMonthlyReportSealJob,
  stopMonthlyReportSealJob,
} from '@/jobs/monthly-report-seal';
import {
  startMonthlyReportDigestJob,
  stopMonthlyReportDigestJob,
} from '@/jobs/monthly-report-digest';
import {
  startRebalancingPrewarmJob,
  stopRebalancingPrewarmJob,
} from '@/jobs/rebalancing-prewarm';
import {
  startOfUtcDay,
  syncDailySystemStats,
} from '@/analytics/queries/daily-system';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { logger } from '@/lib/logger';

const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on']);
const ANALYTICS_START_DELAY_MS = 2 * 60 * 1000;
const DAILY_SYSTEM_BOOTSTRAP_LOCK = 'daily-system-stat-bootstrap';
const DAILY_SYSTEM_BOOTSTRAP_LOCK_TTL_MS = 10 * 60 * 1000;

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
 * La serie diaria de /api/history se siembra al arrancar el proceso de jobs,
 * sin esperar a los 2 minutos de retraso del primer tick de analitica. Asi,
 * tras un despliegue, el endpoint deja de escanear StationStatus en cuanto
 * termina el backfill y no hace falta ningun comando manual.
 */
async function bootstrapDailySystemStats(): Promise<void> {
  const lock = await acquireJobLock(
    DAILY_SYSTEM_BOOTSTRAP_LOCK,
    DAILY_SYSTEM_BOOTSTRAP_LOCK_TTL_MS
  );

  if (!lock) {
    logger.info('analytics.daily_system_bootstrap_skipped', { reason: 'lock' });
    return;
  }

  try {
    const startedAt = Date.now();
    const result = await syncDailySystemStats(startOfUtcDay());

    logger.info('analytics.daily_system_bootstrap_completed', {
      ...result,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    // El primer tick de analitica lo reintenta; no impedimos que arranquen
    // los cron jobs por un fallo del backfill.
    captureExceptionWithContext(error, {
      area: 'jobs.analytics',
      operation: 'bootstrapDailySystemStats',
    });
    logger.warn('analytics.daily_system_bootstrap_failed', { error });
  } finally {
    await lock.release();
  }
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

  // Fire-and-forget: el health server y los cron jobs no esperan al backfill.
  void bootstrapDailySystemStats();

  // Calienta el informe de redistribucion en cuanto arranca el proceso (el job
  // corre tambien en `runOnInit`), para que un despliegue con Redis frio no
  // haga esperar a los primeros visitantes.
  startRebalancingPrewarmJob();
  logger.info('jobs.rebalancing_prewarm_started');

  analyticsStartTimer = setTimeout(() => {
    startAnalyticsAggregationJob();
    startMonthlyReportSealJob();
    // El envío del informe a suscriptores va justo después del sellado: el
    // sello corre a las 05:00 UTC y el envío a las 05:30.
    startMonthlyReportDigestJob();
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
  stopRebalancingPrewarmJob();
  stopMonthlyReportSealJob();
  stopMonthlyReportDigestJob();
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
