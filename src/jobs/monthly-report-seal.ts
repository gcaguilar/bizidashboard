/**
 * Monthly report seal job
 *
 * Precomputes and persists (no expiry) every closed month in the published
 * window, so historical report pages and downloads are served from cache
 * instead of being recomputed on each expiry. Runs daily: it catches the month
 * that just closed and recovers a missed run. Sealing is idempotent —
 * `buildMonthlyReport` is a cache read once the month is already sealed.
 */

import { acquireJobLock } from '@/analytics/job-lock';
import { logger } from '@/lib/logger';
import { previousMonthKey, REPORT_MONTHS_WINDOW } from '@/lib/months';
import { buildMonthlyReport } from '@/lib/monthly-report';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import * as Sentry from '@sentry/tanstackstart-react';
import { defineCronJob } from './cron-job';
import { ensureLockRefreshed } from './utils';

/**
 * Sellos de cada run: toda la ventana publicada de informes, igual que el
 * sitemap, para que ningún mes del archivo quede sin precalcular. Tras el
 * primer run cada mes ya esta sellado y el coste es solo de lectura.
 */
const SEAL_MONTHS = REPORT_MONTHS_WINDOW;

export function recentClosedMonths(nowIso: string, count: number): string[] {
  const months: string[] = [];
  let cursor = previousMonthKey(nowIso.slice(0, 7));

  while (cursor && months.length < count) {
    months.push(cursor);
    cursor = previousMonthKey(cursor);
  }

  return months;
}

export async function runMonthlyReportSeal(): Promise<void> {
  return Sentry.startSpan({ name: 'reports.seal', op: 'function' }, async () => {
    const lock = await acquireJobLock('monthly-report-seal');

    if (!lock) {
      logger.info('reports.seal_skipped_existing_lock');
      return;
    }

    const runStart = Date.now();

    try {
      const nowIso = new Date().toISOString();

      for (const month of recentClosedMonths(nowIso, SEAL_MONTHS)) {
        // Sellar la ventana entera puede tardar mas que el TTL del lock: se
        // renueva antes de cada mes y, si se ha perdido, se aborta el run.
        await ensureLockRefreshed(lock, `before-month-${month}`, 'reports');

        try {
          const report = await buildMonthlyReport(month, nowIso);
          logger.info('reports.sealed', { month, hasReport: report.hasReport });
        } catch (error) {
          captureExceptionWithContext(error, {
            area: 'jobs.reports',
            operation: 'sealMonth',
            extra: { month },
          });
          logger.warn('reports.seal_month_failed', { month, error });
        }
      }
    } catch (error) {
      captureExceptionWithContext(error, {
        area: 'jobs.reports',
        operation: 'runMonthlyReportSeal',
      });
      logger.error('reports.run_failed', { error });
    } finally {
      try {
        await lock.release();
      } catch (releaseError) {
        captureExceptionWithContext(releaseError, {
          area: 'jobs.reports',
          operation: 'release report seal lock',
        });
        logger.error('reports.lock_release_failed', { error: releaseError });
      }

      logger.info('reports.seal_finished', { durationMs: Date.now() - runStart });
    }
  });
}

const monthlyReportSealJob = defineCronJob({
  monitor: 'monthly-report-seal',
  logPrefix: 'reports',
  schedule: '0 5 * * *',
  timezone: 'UTC',
  run: () => runMonthlyReportSeal(),
});

/** Start the monthly report seal job (daily at 05:00 UTC). */
export function startMonthlyReportSealJob(): void {
  monthlyReportSealJob.start();
}

/** Stop the monthly report seal job. */
export function stopMonthlyReportSealJob(): void {
  monthlyReportSealJob.stop();
}

/** Check if the monthly report seal job is currently scheduled. */
export function isMonthlyReportSealScheduled(): boolean {
  return monthlyReportSealJob.isScheduled();
}
