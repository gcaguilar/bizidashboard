/**
 * Analytics aggregation job
 *
 * Runs hourly rollups and triggers daily rollups + retention after UTC day completion.
 */

import { schedule, ScheduledTask } from 'node-cron';
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
import { setCachedJson } from '@/lib/cache/cache';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { logger } from '@/lib/logger';
import { CacheTTL } from '@/lib/cache/config';
import { ensureLockRefreshed } from './utils';
import type { CronOptions } from './types';
import {
  getStationsWithLatestStatus,
  getDailyDemandCurve,
  getHourlyMobilitySignals,
  getSystemHourlyProfile
} from '@/analytics/queries/read';

const LIVE_CACHE_TTL_SECONDS = CacheTTL.LIVE;

async function warmCache(): Promise<void> {
  logger.info('analytics.cache_warming_started');
  const start = Date.now();

  try {
    // 1. Warm stations:current
    const stations = await getStationsWithLatestStatus();
    await setCachedJson('stations:current', {
      stations,
      generatedAt: new Date().toISOString(),
    }, LIVE_CACHE_TTL_SECONDS);

    // 2. Warm mobility:all
    const [hourlySignals, dailyDemand, systemHourlyProfile] = await Promise.all([
      getHourlyMobilitySignals(14),
      getDailyDemandCurve(30),
      getSystemHourlyProfile(14),
    ]);

    const mobilityPayload = {
      mobilityDays: 14,
      demandDays: 30,
      selectedMonth: null,
      methodology: 'Matriz O-D estimada con variaciones netas horarias de bicis por estacion; no representa viajes individuales observados.',
      hourlySignals: hourlySignals.map((row) => ({
        stationId: row.stationId,
        hour: Number(row.hour),
        departures: Number(row.departures),
        arrivals: Number(row.arrivals),
        sampleCount: Number(row.sampleCount),
      })),
      dailyDemand: dailyDemand.map((row) => ({
        day: row.day,
        demandScore: Number(row.demandScore),
        avgOccupancy: Number(row.avgOccupancy),
        sampleCount: Number(row.sampleCount),
      })),
      systemHourlyProfile: systemHourlyProfile.map((row) => ({
        hour: Number(row.hour),
        avgOccupancy: Number(row.avgOccupancy),
        avgBikesAvailable: Number(row.avgBikesAvailable),
        sampleCount: Number(row.sampleCount),
      })),
      generatedAt: new Date().toISOString(),
    };

    await setCachedJson('mobility:mobilityDays=14:demandDays=30:month=all', mobilityPayload, 300);

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

let cronJob: ScheduledTask | null = null;

function getHourlyCutoff(now: Date): Date {
  const delayMs = ANALYTICS_WINDOWS.rollupHourlyDelayMinutes * 60 * 1000;
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

/**
 * Start the scheduled analytics aggregation job
 * Runs hourly at minute 10 in UTC
 */
export function startAnalyticsAggregationJob(): void {
  if (cronJob) {
    logger.info('analytics.cron_already_running');
    return;
  }

  cronJob = schedule(
    '10 * * * *',
    async () => {
      await runAnalyticsAggregation();
    },
    {
      scheduled: true,
      timezone: 'UTC',
      runOnInit: true,
    } as CronOptions
  );

  logger.info('analytics.cron_started');
}

/**
 * Stop the scheduled analytics aggregation job
 */
export function stopAnalyticsAggregationJob(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    logger.info('analytics.cron_stopped');
  }
}

/**
 * Check if the analytics aggregation job is currently scheduled
 */
export function isAnalyticsAggregationScheduled(): boolean {
  return cronJob !== null;
}
