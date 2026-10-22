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
import { refreshMonthlyCriticalEpisodes } from '@/analytics/queries/monthly-report';
import { getWatermark } from '@/analytics/watermarks';
import { logger } from '@/lib/logger';
import { getMonthBounds, previousMonthKey, REPORT_MONTHS_WINDOW } from '@/lib/months';
import { buildMonthlyReport } from '@/lib/monthly-report';
import { appRoutes } from '@/lib/routes';
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

/**
 * PDFs que se precalientan en cada run: el mes recien cerrado y el anterior
 * (por si un run se perdio). Los meses mas antiguos se generan bajo demanda la
 * primera vez que alguien los descarga y quedan guardados.
 */
const PDF_WARM_MONTHS = 2;

/**
 * Pide a la web el PDF del mes para que lo genere y lo guarde. El job no
 * renderiza: el unico proceso con navegador es el servidor web. Requiere
 * `REPORT_PDF_BASE_URL`; sin el se omite (el PDF se generara en la primera
 * descarga), y asi un despliegue de desarrollo con `ENABLE_INTERNAL_JOBS=1`
 * nunca dispara trabajo contra `APP_URL`.
 */
async function warmMonthlyReportPdf(month: string): Promise<void> {
  const baseUrl = process.env.REPORT_PDF_BASE_URL?.trim()?.replace(/\/+$/u, '');

  if (!baseUrl) {
    logger.warn('reports.pdf_warm_skipped', { month, reason: 'missing_base_url' });
    return;
  }

  const response = await fetch(`${baseUrl}${appRoutes.api.reports({ month, format: 'pdf' })}`, {
    headers: { 'User-Agent': 'DatosBizi-report-seal' },
  });

  if (!response.ok) {
    throw new Error(`PDF warm request failed with ${response.status}`);
  }

  await response.arrayBuffer();
}

export function recentClosedMonths(nowIso: string, count: number): string[] {
  const months: string[] = [];
  let cursor = previousMonthKey(nowIso.slice(0, 7));

  while (cursor && months.length < count) {
    months.push(cursor);
    cursor = previousMonthKey(cursor);
  }

  return months;
}

async function hasEpisodesRefreshedAfterClose(month: string): Promise<boolean> {
  const refreshedAt = await getWatermark(`critical-episodes:${month}`, new Date(0));
  return refreshedAt >= new Date(getMonthBounds(month).endExclusive);
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

      for (const [index, month] of recentClosedMonths(nowIso, SEAL_MONTHS).entries()) {
        // Sellar la ventana entera puede tardar mas que el TTL del lock: se
        // renueva antes de cada mes y, si se ha perdido, se aborta el run.
        await ensureLockRefreshed(lock, `before-month-${month}`, 'reports');

        try {
          // Solo el mes recien cerrado necesita recalcular sus episodios desde
          // el crudo. El anterior ya se sello en el run previo y su crudo puede
          // estar fuera de la retencion de 40 dias: recalcularlo borraria
          // episodios buenos y los sustituiria por un mes incompleto. Por lo
          // mismo, el mes recien cerrado solo se recalcula una vez: el job es
          // diario y sin esta guarda lo repetiria todo el mes siguiente.
          if (index === 0 && !(await hasEpisodesRefreshedAfterClose(month))) {
            try {
              const episodes = await refreshMonthlyCriticalEpisodes(month);
              logger.info('reports.critical_episodes_warmed', { ...episodes });
            } catch (error) {
              captureExceptionWithContext(error, {
                area: 'jobs.reports',
                operation: 'refreshCriticalEpisodes',
                extra: { month },
              });
              logger.warn('reports.critical_episodes_failed', { month, error });
            }
          }

          const report = await buildMonthlyReport(month, nowIso);
          logger.info('reports.sealed', { month, hasReport: report.hasReport });

          if (index < PDF_WARM_MONTHS && report.hasReport) {
            try {
              await warmMonthlyReportPdf(month);
              logger.info('reports.pdf_warmed', { month });
            } catch (error) {
              captureExceptionWithContext(error, {
                area: 'jobs.reports',
                operation: 'warmPdf',
                extra: { month },
              });
              logger.warn('reports.pdf_warm_failed', { month, error });
            }
          }
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
