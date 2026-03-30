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
import { 
  getStationsWithLatestStatus, 
  getDailyDemandCurve, 
  getHourlyMobilitySignals, 
  getSystemHourlyProfile 
} from '@/analytics/queries/read';

const LIVE_CACHE_TTL_SECONDS = 60;

async function warmCache(): Promise<void> {
  console.log('[Analytics] Starting proactive cache warming...');
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
        bikesInCirculation: Number(row.bikesInCirculation),
        sampleCount: Number(row.sampleCount),
      })),
      generatedAt: new Date().toISOString(),
    };

    await setCachedJson('mobility:mobilityDays=14:demandDays=30:month=all', mobilityPayload, 300);

    const duration = Date.now() - start;
    console.log(`[Analytics] Cache warming completed in ${duration}ms`);
  } catch (error) {
    captureExceptionWithContext(error, {
      area: 'jobs.analytics',
      operation: 'warmCache',
    });
    console.warn('[Analytics] Cache warming failed:', error);
  }
}

// Type augmentation for node-cron 4.x options
interface CronOptions {
  scheduled?: boolean;
  timezone?: string;
  runOnInit?: boolean;
  name?: string;
  recoverMissedExecutions?: boolean;
}

let cronJob: ScheduledTask | null = null;
let isScheduled = false;

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
    console.log('[Analytics] Rollup skipped - existing lock is active');
    return;
  }

  try {
    const now = new Date();
    const hourlyCutoff = getHourlyCutoff(now);

    await lock.refresh();
    const hourlyStart = Date.now();
    const hourlyResult = await runHourlyRollup(hourlyCutoff);
    const hourlyDuration = Date.now() - hourlyStart;

    console.log(
      `[Analytics] Hourly rollup processed ${hourlyResult.processedCount} rows into ${hourlyResult.upsertedCount} buckets in ${hourlyDuration}ms (cutoff ${hourlyCutoff.toISOString()})`
    );

    if (hourlyResult.processedCount > 0) {
      await lock.refresh();
      const rankingStart = Date.now();
      const rankingResult = await runRankingRollup(hourlyCutoff);
      const rankingDuration = Date.now() - rankingStart;

      console.log(
        `[Analytics] Ranking rollup upserted ${rankingResult.upsertedCount} stations in ${rankingDuration}ms (window end ${hourlyCutoff.toISOString()})`
      );

      await lock.refresh();
      const patternStart = Date.now();
      const patternResult = await runPatternRollup(hourlyCutoff);
      const patternDuration = Date.now() - patternStart;

      console.log(
        `[Analytics] Pattern rollup upserted ${patternResult.upsertedCount} buckets in ${patternDuration}ms (window end ${hourlyCutoff.toISOString()})`
      );

      await lock.refresh();
      const heatmapStart = Date.now();
      const heatmapResult = await runHeatmapRollup(hourlyCutoff);
      const heatmapDuration = Date.now() - heatmapStart;

      console.log(
        `[Analytics] Heatmap rollup upserted ${heatmapResult.upsertedCount} cells in ${heatmapDuration}ms (window end ${hourlyCutoff.toISOString()})`
      );
    }

    await lock.refresh();
    const alertStart = Date.now();
    const alertResult = await runAlertRollup(hourlyCutoff);
    const alertDuration = Date.now() - alertStart;

    console.log(
      `[Analytics] Alert rollup upserted ${alertResult.upsertedCount} alerts in ${alertDuration}ms (window end ${hourlyCutoff.toISOString()})`
    );

    await lock.refresh();
    const dailyCutoff = getDailyCutoff(now);
    const dailyWatermark = await getWatermark('daily-rollup', new Date(0));

    if (dailyCutoff > dailyWatermark) {
      const dailyStart = Date.now();
      const dailyResult = await runDailyRollup(dailyCutoff);
      const dailyDuration = Date.now() - dailyStart;

      console.log(
        `[Analytics] Daily rollup processed ${dailyResult.processedCount} rows into ${dailyResult.upsertedCount} buckets in ${dailyDuration}ms (cutoff ${dailyCutoff.toISOString()})`
      );

      await lock.refresh();
      await runRetentionCleanup();
      const vacuumed = await runVacuumIfDue();

      if (vacuumed) {
        console.log('[Analytics] VACUUM completed after retention cleanup');
      }
    }

    // Warm cache for high-traffic endpoints after rollups complete
    await warmCache();
  } catch (error) {
    captureExceptionWithContext(error, {
      area: 'jobs.analytics',
      operation: 'runAnalyticsAggregation',
    });
    console.error('[Analytics] Aggregation run failed:', error);
  } finally {
    try {
      await lock.release();
    } catch (releaseError) {
      captureExceptionWithContext(releaseError, {
        area: 'jobs.analytics',
        operation: 'release analytics lock',
      });
      console.error('[Analytics] Failed to release lock:', releaseError);
    }
    const duration = Date.now() - runStart;
    console.log(`[Analytics] Aggregation run finished in ${duration}ms`);
  }
}

/**
 * Start the scheduled analytics aggregation job
 * Runs hourly at minute 10 in UTC
 */
export function startAnalyticsAggregationJob(): void {
  if (cronJob) {
    console.log('[Cron] Analytics job already running');
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

  isScheduled = true;
  console.log('[Cron] Analytics aggregation scheduled (hourly, UTC)');
}

/**
 * Stop the scheduled analytics aggregation job
 */
export function stopAnalyticsAggregationJob(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    isScheduled = false;
    console.log('[Cron] Analytics aggregation stopped');
  }
}

/**
 * Check if the analytics aggregation job is currently scheduled
 */
export function isAnalyticsAggregationScheduled(): boolean {
  return isScheduled;
}
