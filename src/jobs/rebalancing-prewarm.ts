/**
 * Rebalancing prewarm job
 *
 * Mantiene caliente el informe base de redistribucion (15 dias), que es el
 * agregado mas caro del producto: recorre millones de snapshots y tarda
 * decenas de segundos en frio. `buildRebalancingReport` ya usa
 * stale-while-revalidate, asi que este tick solo paga el computo cuando la
 * entrada ha caducado; si un visitante acaba de refrescarla, no hace nada.
 *
 * Gracias al tick cada 15 minutos (y al `runOnInit`), la cache sobrevive a
 * despliegues siempre que Redis conserve los datos, y ningun usuario paga el
 * computo en su request.
 */

import { acquireJobLock } from '@/analytics/job-lock';
import { buildRebalancingReport } from '@/lib/rebalancing-report';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { logger } from '@/lib/logger';
import { defineCronJob } from './cron-job';

const PREWARM_DAYS = 15;
const PREWARM_LOCK = 'rebalancing-prewarm';
const PREWARM_LOCK_TTL_MS = 5 * 60 * 1000;

export async function prewarmRebalancingReport(): Promise<void> {
  const startedAt = Date.now();

  try {
    const report = await buildRebalancingReport({ days: PREWARM_DAYS });

    logger.info('rebalancing.prewarm_completed', {
      days: PREWARM_DAYS,
      stations: report.summary.totalStations,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    captureExceptionWithContext(error, {
      area: 'jobs.rebalancing',
      operation: 'prewarmRebalancingReport',
    });
    logger.warn('rebalancing.prewarm_failed', { error });
  }
}

export async function runRebalancingPrewarm(): Promise<void> {
  const lock = await acquireJobLock(PREWARM_LOCK, PREWARM_LOCK_TTL_MS);

  if (!lock) {
    logger.info('rebalancing.prewarm_skipped_existing_lock');
    return;
  }

  try {
    await prewarmRebalancingReport();
  } finally {
    try {
      await lock.release();
    } catch (releaseError) {
      captureExceptionWithContext(releaseError, {
        area: 'jobs.rebalancing',
        operation: 'release prewarm lock',
      });
      logger.error('rebalancing.prewarm_lock_release_failed', { error: releaseError });
    }
  }
}

const prewarmJob = defineCronJob({
  monitor: 'rebalancing-prewarm',
  logPrefix: 'rebalancing',
  schedule: '*/15 * * * *',
  timezone: 'UTC',
  run: () => runRebalancingPrewarm(),
});

export function startRebalancingPrewarmJob(): void {
  prewarmJob.start();
}

export function stopRebalancingPrewarmJob(): void {
  prewarmJob.stop();
}

export function isRebalancingPrewarmScheduled(): boolean {
  return prewarmJob.isScheduled();
}
