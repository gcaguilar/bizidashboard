/**
 * Analytics aggregation job
 *
 * Runs hourly rollups and triggers daily rollups + retention after UTC day completion.
 */

import { ANALYTICS_WINDOWS } from '@/analytics/types';
import { acquireJobLock } from '@/analytics/job-lock';
import { getWatermark } from '@/analytics/watermarks';
import { runAlertRollup } from '@/analytics/queries/alerts';
import { runDailyRollup } from '@/analytics/queries/daily';
import { runHeatmapRollup } from '@/analytics/queries/heatmap';
import { runHourlyRollup } from '@/analytics/queries/hourly';
import { runPatternRollup } from '@/analytics/queries/patterns';
import { runRankingRollup } from '@/analytics/queries/rankings';
import { runRetentionCleanup, runVacuumIfDue } from '@/analytics/retention';
import { syncDailySystemStats } from '@/analytics/queries/daily-system';
import { refreshMonthlyCriticalEpisodes } from '@/analytics/queries/monthly-report';
import { setCachedJson } from '@/lib/cache/cache';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import * as Sentry from '@sentry/tanstackstart-react';
import { logger } from '@/lib/logger';
import { CacheTTL } from '@/lib/cache/config';
import { ensureLockRefreshed } from './utils';
import { defineCronJob } from './cron-job';
import { buildStationsPayload, STATIONS_CACHE_KEY } from '@/lib/data-fetcher';
import { getHistorySeries } from '@/lib/history-read-model';
import { getMobilityData } from '@/lib/mobility-read-model';
import { buildMonthlyReport } from '@/lib/monthly-report';

const LIVE_CACHE_TTL_SECONDS = CacheTTL.LIVE;

async function warmCache(): Promise<void> {
  logger.info('analytics.cache_warming_started');
  const start = Date.now();

  try {
    // 1. Warm stations:current
    await setCachedJson(STATIONS_CACHE_KEY, await buildStationsPayload(), LIVE_CACHE_TTL_SECONDS);

    // 2. Warm mobility (default dashboard window)
    await getMobilityData({ mobilityDays: 14, demandDays: 30 });

    // 3. Warm the daily history series, which aggregates raw snapshots.
    await getHistorySeries();

    // 4. Warm the current-month report. Es la pagina mas cara y la unica que
    // no esta sellada; dejarla caliente evita el primer fallo en frio.
    try {
      const nowIso = new Date().toISOString();
      await buildMonthlyReport(nowIso.slice(0, 7), nowIso);
    } catch (error) {
      // Un fallo del prewarm no debe tumbar el job de rollups.
      captureExceptionWithContext(error, {
        area: 'jobs.analytics',
        operation: 'warmMonthlyReport',
      });
      logger.warn('analytics.monthly_report_warm_failed', { error });
    }

    const duration = Date.now() - start;
    logger.info('analytics.cache_warming_completed', { durationMs: duration });
  } catch (error) {
    captureExceptionWithContext(error, {
      area: 'jobs.analytics',
      operation: 'warmCache',
    });
    logger.warn('analytics.cache_warming_failed', { error });
  }
}

function getHourlyCutoff(now: Date): Date {  const delayMs = ANALYTICS_WINDOWS.rollupHourlyDelayMinutes * 60 * 1000;
  const delayed = new Date(now.getTime() - delayMs);
  const hourStartUtc = Date.UTC(
    delayed.getUTCFullYear(),
    delayed.getUTCMonth(),
    delayed.getUTCDate(),
    delayed.getUTCHours(),
    0,
    0,
    0
  );

  return new Date(hourStartUtc);
}

function getDailyCutoff(now: Date): Date {
  const delayMs = ANALYTICS_WINDOWS.rollupDailyDelayMinutes * 60 * 1000;
  const delayed = new Date(now.getTime() - delayMs);
  const dayStartUtc = Date.UTC(
    delayed.getUTCFullYear(),
    delayed.getUTCMonth(),
    delayed.getUTCDate(),
    0,
    0,
    0,
    0
  );

  return new Date(dayStartUtc);
}

async function runAnalyticsAggregation(): Promise<void> {
  return Sentry.startSpan({ name: 'analytics.aggregation', op: 'function' }, () =>
    runAnalyticsAggregationInner()
  );
}

async function runAnalyticsAggregationInner(): Promise<void> {
  const runStart = Date.now();
  const lock = await acquireJobLock('analytics-rollup');

  if (!lock) {
    logger.info('analytics.rollup_skipped_existing_lock');
    return;
  }

  try {
    const now = new Date();
    const hourlyCutoff = getHourlyCutoff(now);

    await ensureLockRefreshed(lock, 'before-hourly-rollup', 'analytics');
    const hourlyStart = Date.now();
    const hourlyResult = await runHourlyRollup(hourlyCutoff);
    const hourlyDuration = Date.now() - hourlyStart;

    logger.info('analytics.hourly_rollup_completed', {
      processedCount: hourlyResult.processedCount,
      upsertedCount: hourlyResult.upsertedCount,
      durationMs: hourlyDuration,
      cutoff: hourlyCutoff.toISOString(),
    });

    if (hourlyResult.processedCount > 0) {
      await ensureLockRefreshed(lock, 'before-ranking-rollup', 'analytics');
      const rankingStart = Date.now();
      const rankingResult = await runRankingRollup(hourlyCutoff);
      const rankingDuration = Date.now() - rankingStart;

      logger.info('analytics.ranking_rollup_completed', {
        upsertedCount: rankingResult.upsertedCount,
        durationMs: rankingDuration,
        cutoff: hourlyCutoff.toISOString(),
      });

      await ensureLockRefreshed(lock, 'before-pattern-rollup', 'analytics');
      const patternStart = Date.now();
      const patternResult = await runPatternRollup(hourlyCutoff);
      const patternDuration = Date.now() - patternStart;

      logger.info('analytics.pattern_rollup_completed', {
        upsertedCount: patternResult.upsertedCount,
        durationMs: patternDuration,
        cutoff: hourlyCutoff.toISOString(),
      });

      await ensureLockRefreshed(lock, 'before-heatmap-rollup', 'analytics');
      const heatmapStart = Date.now();
      const heatmapResult = await runHeatmapRollup(hourlyCutoff);
      const heatmapDuration = Date.now() - heatmapStart;

      logger.info('analytics.heatmap_rollup_completed', {
        upsertedCount: heatmapResult.upsertedCount,
        durationMs: heatmapDuration,
        cutoff: hourlyCutoff.toISOString(),
      });
    }

    await ensureLockRefreshed(lock, 'before-alert-rollup', 'analytics');
    const alertStart = Date.now();
    const alertResult = await runAlertRollup(hourlyCutoff);
    const alertDuration = Date.now() - alertStart;

    logger.info('analytics.alert_rollup_completed', {
      upsertedCount: alertResult.upsertedCount,
      durationMs: alertDuration,
      cutoff: hourlyCutoff.toISOString(),
    });

    await ensureLockRefreshed(lock, 'before-daily-rollup', 'analytics');
    const dailyCutoff = getDailyCutoff(now);
    const dailyWatermark = await getWatermark('daily-rollup', new Date(0));

    if (dailyCutoff > dailyWatermark) {
      const dailyStart = Date.now();
      const dailyResult = await runDailyRollup(dailyCutoff);
      const dailyDuration = Date.now() - dailyStart;

      logger.info('analytics.daily_rollup_completed', {
        processedCount: dailyResult.processedCount,
        upsertedCount: dailyResult.upsertedCount,
        durationMs: dailyDuration,
        cutoff: dailyCutoff.toISOString(),
      });

      await ensureLockRefreshed(lock, 'before-retention-cleanup', 'analytics');
      await runRetentionCleanup();
      const vacuumed = await runVacuumIfDue();

      if (vacuumed) {
        logger.info('analytics.retention_maintenance_completed');
      }
    }

    // Serie diaria de red para /api/history. La primera vez siembra todo el
    // historico (aproximado desde el rollup y exacto en la ventana reciente);
    // despues solo rellena los dias que falten. Incluye recuperacion
    // automatica si el job ha estado caido.
    await ensureLockRefreshed(lock, 'before-daily-system-stats', 'analytics');
    try {
      const startedAt = Date.now();
      const result = await syncDailySystemStats(dailyCutoff);

      logger.info('analytics.daily_system_stats_completed', {
        ...result,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      captureExceptionWithContext(error, {
        area: 'jobs.analytics',
        operation: 'syncDailySystemStats',
      });
      logger.warn('analytics.daily_system_stats_failed', { error });
    }

    // Los episodios exactos del mes en curso se refrescan tras los rollups.
    // Si falla, el informe cae a la consulta cruda; no se bloquea el job.
    await ensureLockRefreshed(lock, 'before-critical-episodes', 'analytics');
    try {
      const currentMonth = now.toISOString().slice(0, 7);
      const episodesStart = Date.now();
      const episodeResult = await refreshMonthlyCriticalEpisodes(currentMonth);
      logger.info('analytics.critical_episodes_completed', {
        ...episodeResult,
        durationMs: Date.now() - episodesStart,
      });
    } catch (error) {
      captureExceptionWithContext(error, {
        area: 'jobs.analytics',
        operation: 'refreshMonthlyCriticalEpisodes',
      });
      logger.warn('analytics.critical_episodes_failed', { error });
    }

    // Warm cache for high-traffic endpoints after rollups complete
    await warmCache();
  } catch (error) {
    captureExceptionWithContext(error, {
      area: 'jobs.analytics',
      operation: 'runAnalyticsAggregation',
    });
    logger.error('analytics.run_failed', { error });
  } finally {
    try {
      await lock.release();
    } catch (releaseError) {
      captureExceptionWithContext(releaseError, {
        area: 'jobs.analytics',
        operation: 'release analytics lock',
      });
      logger.error('analytics.lock_release_failed', { error: releaseError });
    }
    const duration = Date.now() - runStart;
    logger.info('analytics.run_finished', { durationMs: duration });
  }
}

const analyticsJob = defineCronJob({
  monitor: 'analytics-aggregation',
  logPrefix: 'analytics',
  schedule: '10 * * * *',
  timezone: 'UTC',
  run: () => runAnalyticsAggregation(),
});

/**
 * Start the scheduled analytics aggregation job (hourly at minute 10, UTC).
 */
export function startAnalyticsAggregationJob(): void {
  analyticsJob.start();
}

/**
 * Stop the scheduled analytics aggregation job.
 */
export function stopAnalyticsAggregationJob(): void {
  analyticsJob.stop();
}

/**
 * Check if the analytics aggregation job is currently scheduled.
 */
export function isAnalyticsAggregationScheduled(): boolean {
  return analyticsJob.isScheduled();
}
