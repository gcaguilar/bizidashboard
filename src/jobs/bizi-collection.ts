/**
 * Bizi Data Collection Job
 *
 * Scheduled collection job that runs every 2 minutes to fetch,
 * validate, and store Bizi station data from the GBFS API.
 * Also provides manual trigger capability via runCollection().
 *
 * Responsibility: scheduling, lock acquisition, job state tracking,
 * metrics recording, and DB persistence of collection runs.
 */

import { schedule } from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { randomUUID } from 'node:crypto';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { acquireJobLock } from '@/analytics/job-lock';
import {
  createCollectionRun,
  updateCollectionRun,
  type CollectionRunTrigger,
} from '@/lib/collection-runs';
import { getCity } from '@/lib/db';
import { recordCollection } from '@/lib/metrics';
import { logger } from '@/lib/logger';
import {
  getExecutionContext,
  resolveRequestId,
  runWithExecutionContext,
  updateExecutionContext,
} from '@/lib/request-context';
import { createCollectionPipeline, type CollectionPipelineResult } from '@/lib/collection-pipeline';
import type { CronOptions } from './types';

/**
 * Result of a collection run
 */
export interface CollectionResult {
  success: boolean;
  collectionId: string;
  stationCount: number;
  recordedAt: Date | null;
  quality: import('@/lib/observability').DataObservabilityMetrics | null;
  duration: number;
  warnings: string[];
  error?: string;
  timestamp: Date;
}

/**
 * Current state of the collection job
 */
export interface JobState {
  lastRun: Date | null;
  lastSuccess: Date | null;
  consecutiveFailures: number;
  totalRuns: number;
  totalSuccesses: number;
}

type RunCollectionOptions = {
  trigger?: CollectionRunTrigger;
  requestId?: string;
};

// Module-level state
let cronJob: ScheduledTask | null = null;
let isScheduled = false;
const COLLECTION_LOCK_TTL_MS = 10 * 60 * 1000;
const COLLECTION_LOCK_NAME = 'gbfs-collection';
const COLLECTION_CRON_SCHEDULE = '*/2 * * * *';
const DEFAULT_GBFS_SOURCE_URL = 'https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json';

// Job state tracking
const jobState: JobState = {
  lastRun: null,
  lastSuccess: null,
  consecutiveFailures: 0,
  totalRuns: 0,
  totalSuccesses: 0,
};

/**
 * Get current job state for observability
 */
export function getJobState(): JobState {
  return { ...jobState };
}

/**
 * Run a single collection cycle
 * Orchestrates: lock → pipeline → metrics → DB update
 */
async function executeCollection(
  requestId: string,
  trigger: CollectionRunTrigger
): Promise<CollectionResult> {
  const startTime = Date.now();
  const collectionId = `col-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const sourceUrl =
    process.env.GBFS_URL ?? process.env.GBFS_DISCOVERY_URL ?? DEFAULT_GBFS_SOURCE_URL;

  updateExecutionContext({
    requestId,
    collectionId,
    trigger,
    sourceUrl,
  });

  logger.info('collection.started', {
    trigger,
    sourceUrl,
  });

  const lock = await acquireJobLock(COLLECTION_LOCK_NAME, COLLECTION_LOCK_TTL_MS);
  let lockReleased = false;
  if (!lock) {
    const skippedAt = new Date();
    logger.info('collection.lock_skipped');
    return {
      success: true,
      collectionId,
      stationCount: 0,
      recordedAt: null,
      quality: null,
      duration: Date.now() - startTime,
      warnings: ['Skipped collection because another collector is already running.'],
      timestamp: skippedAt,
    };
  }

  // Update job state
  jobState.lastRun = new Date();
  jobState.totalRuns++;

  const result: CollectionResult = {
    success: false,
    collectionId,
    stationCount: 0,
    recordedAt: null,
    quality: null,
    duration: 0,
    warnings: [],
    timestamp: new Date(),
  };

  await createCollectionRun({
    collectionId,
    requestId,
    city: getCity(),
    trigger,
    sourceUrl,
  });

  // Build pipeline with lock-refresh callback injected at the metadata-sync boundary
  const pipeline = createCollectionPipeline({
    sourceUrl,
    lockName: COLLECTION_LOCK_NAME,
    lockTtlMs: COLLECTION_LOCK_TTL_MS,
    onStationMetadataSynced: async () => {
      const refreshed = await lock.refresh();
      if (!refreshed) {
        throw new Error('collection lock refresh failed at stage: post-station-metadata-sync');
      }
    },
  });

  let pipelineResult: CollectionPipelineResult | null = null;
  let pipelineError: Error | null = null;

  try {
    pipelineResult = await pipeline.execute(collectionId);

    // Handle duplicate-snapshot skip from pipeline (success + warning)
    if (pipelineResult.success && pipelineResult.warnings.some((w) => w.includes('already ingested'))) {
      result.success = true;
      result.stationCount = pipelineResult.stationCount;
      result.recordedAt = pipelineResult.recordedAt;
      result.warnings = [...pipelineResult.warnings];
      result.duration = pipelineResult.duration;

      jobState.lastSuccess = new Date();
      jobState.totalSuccesses++;
      jobState.consecutiveFailures = 0;

      await updateCollectionRun(collectionId, {
        status: 'skipped',
        gbfsVersion: pipelineResult.quality?.lineage.gbfsVersion,
        snapshotRecordedAt: pipelineResult.recordedAt,
        expectedStationCount: pipelineResult.stationCount,
        insertedCount: pipelineResult.stationCount,
        duplicateCount: 0,
        warningCount: 1,
        errorCount: 0,
        warnings: pipelineResult.warnings,
        errors: [],
        durationMs: Date.now() - startTime,
        finishedAt: new Date(),
      });

      // Metrics & DB update must run before early return
      recordCollection({
        success: result.success,
        stationsCollected: result.stationCount,
        timestamp: result.timestamp,
        error: result.error,
      });

      return result;
    }

    // Handle errors that occurred in pipeline (validation/storage)
    if (pipelineResult && !pipelineResult.success) {
      result.success = false;
      result.stationCount = pipelineResult.stationCount;
      result.recordedAt = pipelineResult.recordedAt;
      result.quality = pipelineResult.quality;
      result.warnings = [...pipelineResult.warnings];
      result.duration = pipelineResult.duration;
      jobState.consecutiveFailures++;

      const errorMsg = pipelineResult.error ?? 'Collection completed with validation or storage errors';
      result.error = errorMsg;

      captureExceptionWithContext(
        new Error(errorMsg),
        {
          area: 'jobs.collection',
          operation: 'runCollection',
          tags: {
            phase: 'validate-store',
            handled: true,
          },
          extra: {
            stationCount: result.stationCount,
            warnings: result.warnings,
            errors: pipelineResult.error ? [pipelineResult.error] : [],
          },
        }
      );
      logger.warn('collection.completed_with_errors', {
        error: errorMsg,
        warnings: result.warnings,
      });
    }

    // Handle clean success from pipeline
    if (pipelineResult && pipelineResult.success) {
      result.success = true;
      result.stationCount = pipelineResult.stationCount;
      result.recordedAt = pipelineResult.recordedAt;
      result.quality = pipelineResult.quality;
      result.warnings = [...pipelineResult.warnings];
      result.duration = pipelineResult.duration;

      jobState.lastSuccess = new Date();
      jobState.totalSuccesses++;
      jobState.consecutiveFailures = 0;

      const duplicateOnlyWarning = result.warnings.find((warning) =>
        warning.startsWith('Snapshot already stored;')
      );
      if (duplicateOnlyWarning) {
        logger.info('collection.snapshot_duplicate', {
          warning: duplicateOnlyWarning,
        });
      } else {
        logger.info('collection.succeeded', {
          stationCount: result.stationCount,
        });
      }
    }

  } catch (error) {
    // Fetch errors (discovery / station_status throw from pipeline)
    jobState.consecutiveFailures++;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.error = errorMessage;
    result.success = false;
    result.duration = Date.now() - startTime;
    pipelineError = error instanceof Error ? error : new Error(errorMessage);
    void pipelineError;

    captureExceptionWithContext(error, {
      area: 'jobs.collection',
      operation: 'runCollection',
      extra: {
        warnings: result.warnings,
      },
    });
    logger.error('collection.failed', {
      error,
      errorMessage,
      warnings: result.warnings,
    });

    throw error;
  } finally {
    // ── Metrics & DB update (runs regardless of success/fetch-error) ──
    // ── Lock release (always runs, even on error) ─────────────────────

    recordCollection({
      success: result.success,
      stationsCollected: result.stationCount,
      timestamp: result.timestamp,
      error: result.error,
    });

    if (jobState.consecutiveFailures >= 3) {
      logger.warn('collection.consecutive_failures', {
        consecutiveFailures: jobState.consecutiveFailures,
      });
    }

    await updateCollectionRun(collectionId, {
      status: result.success ? 'succeeded' : result.error ? 'failed' : 'skipped',
      snapshotRecordedAt: result.recordedAt,
      gbfsVersion: result.quality?.lineage.gbfsVersion ?? null,
      expectedStationCount: result.quality?.volume.stationCount ?? null,
      insertedCount: result.stationCount,
      duplicateCount: result.quality ? result.quality.volume.stationCount - result.stationCount : 0,
      warningCount: result.warnings.length,
      errorCount: result.error ? 1 : 0,
      warnings: result.warnings,
      errors: result.error ? [result.error] : [],
      durationMs: result.duration,
      finishedAt: result.timestamp,
    });

    try {
      await lock.release();
      lockReleased = true;
    } catch (releaseError) {
      captureExceptionWithContext(releaseError, {
        area: 'jobs.collection',
        operation: 'release collection lock',
      });
      logger.error('collection.lock_release_failed', { error: releaseError });
    }
  }

  if (lockReleased) {
    return result;
  }

  // If we reach here, an error was thrown and re-thrown above
  throw new Error('unreachable');
}

export async function runCollection(
  options: RunCollectionOptions = {}
): Promise<CollectionResult> {
  const existingContext = getExecutionContext();
  const requestId = options.requestId ?? existingContext?.requestId ?? resolveRequestId(null);
  const trigger = options.trigger ?? 'manual';

  if (existingContext) {
    updateExecutionContext({
      requestId,
      trigger,
    });
    return executeCollection(requestId, trigger);
  }

  return runWithExecutionContext(
    {
      requestId,
      trigger,
      city: getCity(),
    },
    () => executeCollection(requestId, trigger)
  );
}

/**
 * Start the scheduled collection job
 * Runs every 2 minutes in Europe/Madrid timezone
 */
export function startCollectionJob(): void {
  if (cronJob) {
    logger.info('collection.cron_already_running');
    return;
  }

  // Schedule: every 2 minutes
  cronJob = schedule(
    COLLECTION_CRON_SCHEDULE,
    async () => {
      try {
        await runCollection({ trigger: 'cron' });
      } catch (error) {
        // Error already logged in runCollection
        // Just prevent crash
        logger.error('collection.cron_failed', { error });
      }
    },
    {
      scheduled: true,
      timezone: 'Europe/Madrid',
      runOnInit: true, // Run immediately on startup
    } as CronOptions
  );

  isScheduled = true;
  logger.info('collection.cron_started', {
    schedule: COLLECTION_CRON_SCHEDULE,
  });
}

/**
 * Stop the scheduled collection job
 * Useful for testing and graceful shutdown
 */
export function stopCollectionJob(): void {
  if (cronJob) {
    void cronJob.stop();
    cronJob = null;
    isScheduled = false;
    logger.info('collection.cron_stopped');
  }
}

/**
 * Check if the collection job is currently scheduled
 */
export function isCollectionScheduled(): boolean {
  return isScheduled;
}
