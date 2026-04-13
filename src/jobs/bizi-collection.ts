/**
 * Bizi Data Collection Job
 * 
 * Scheduled collection job that runs every 2 minutes to fetch,
 * validate, and store Bizi station data from the GBFS API.
 * Also provides manual trigger capability via runCollection().
 */

import { schedule, ScheduledTask } from 'node-cron';
import { randomUUID } from 'node:crypto';
import { fetchDiscovery, fetchStationInformation, fetchStationStatus } from '@/services/gbfs-client';
import { validateAndStore } from '@/services/data-validator';
import {
  getMissingStationIds,
  getSnapshotCount,
  getStationMetadataCount,
  upsertStations,
} from '@/services/data-storage';
import { DataObservabilityMetrics } from '@/lib/observability';
import { recordCollection } from '@/lib/metrics';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { acquireJobLock } from '@/analytics/job-lock';
import {
  createCollectionRun,
  updateCollectionRun,
  type CollectionRunTrigger,
} from '@/lib/collection-runs';
import { getCity } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  getExecutionContext,
  resolveRequestId,
  runWithExecutionContext,
  updateExecutionContext,
} from '@/lib/request-context';
import type { CronOptions } from './types';

async function ensureLockRefreshed(
  lock: { refresh: () => Promise<boolean> },
  stage: string
): Promise<void> {
  const refreshed = await lock.refresh();
  if (!refreshed) {
    throw new Error(`Collection lock refresh failed at stage: ${stage}`);
  }
}

/**
 * Result of a collection run
 */
export interface CollectionResult {
  success: boolean;
  collectionId: string;
  stationCount: number;
  recordedAt: Date | null;
  quality: DataObservabilityMetrics | null;
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
let hasSyncedStationInformationSinceStartup = false;

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

async function shouldSyncStationInformation(): Promise<boolean> {
  if (!hasSyncedStationInformationSinceStartup) {
    return true;
  }

  const stationCount = await getStationMetadataCount();
  return stationCount === 0;
}

/**
 * Run a single collection cycle
 * Orchestrates: fetch → validate → store
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

  try {
    // Step 1: Fetch discovery once and reuse for all feed requests
    const discovery = await fetchDiscovery();
    const syncStationInformation = await shouldSyncStationInformation();

    // Step 2: Fetch live station status, and station metadata only on the first run
    // after startup or when the station table is empty.
    const stationStatusPromise = fetchStationStatus(discovery);
    const stationInformationPromise = syncStationInformation
      ? fetchStationInformation(discovery)
      : Promise.resolve(null);

    const [stationStatusResponse, initialStationInformation] = await Promise.all([
      stationStatusPromise,
      stationInformationPromise,
    ]);

    let stationInformation = initialStationInformation;

    if (!stationInformation) {
      const missingStationIds = await getMissingStationIds(
        stationStatusResponse.data.stations.map((station) => station.station_id)
      );

      if (missingStationIds.length > 0) {
        logger.warn('collection.station_metadata_missing', {
          missingStationCount: missingStationIds.length,
          missingStationIdsSample: missingStationIds.slice(0, 10),
        });
        stationInformation = await fetchStationInformation(discovery);
      }
    }

    // Step 3: Refresh station metadata sparingly. Station names/coords/capacity
    // change infrequently, so we only sync them on deploy/startup or bootstrap.
    if (stationInformation) {
      await upsertStations(stationInformation);
      hasSyncedStationInformationSinceStartup = true;
      logger.info('collection.station_metadata_synced', {
        stationCount: stationInformation.length,
        reason: syncStationInformation ? 'startup_or_bootstrap' : 'missing_station_ids',
      });
    }
    await ensureLockRefreshed(lock, 'post-station-metadata-sync');

    const snapshotRecordedAt = new Date(stationStatusResponse.last_updated * 1000);
    const existingSnapshotCount = await getSnapshotCount(snapshotRecordedAt);
    const expectedStationCount = stationStatusResponse.data.stations.length;

    updateExecutionContext({
      gbfsVersion: stationStatusResponse.version,
    });

    if (existingSnapshotCount >= expectedStationCount && expectedStationCount > 0) {
      const skipMessage = `Snapshot ${snapshotRecordedAt.toISOString()} already ingested; skipping duplicate trigger (${existingSnapshotCount} stations)`;
      result.success = true;
      result.stationCount = expectedStationCount;
      result.recordedAt = snapshotRecordedAt;
      result.warnings = [skipMessage];

      jobState.lastSuccess = new Date();
      jobState.totalSuccesses++;
      jobState.consecutiveFailures = 0;

      await updateCollectionRun(collectionId, {
        status: 'skipped',
        gbfsVersion: stationStatusResponse.version,
        snapshotRecordedAt,
        expectedStationCount,
        insertedCount: expectedStationCount,
        duplicateCount: 0,
        warningCount: 1,
        errorCount: 0,
        warnings: [skipMessage],
        errors: [],
        durationMs: Date.now() - startTime,
        finishedAt: new Date(),
      });

      logger.info('collection.snapshot_already_ingested', {
        snapshotRecordedAt: snapshotRecordedAt.toISOString(),
        expectedStationCount,
      });
      return result;
    }

    if (existingSnapshotCount > 0 && existingSnapshotCount < expectedStationCount) {
      logger.warn('collection.partial_snapshot_resume', {
        snapshotRecordedAt: snapshotRecordedAt.toISOString(),
        existingSnapshotCount,
        expectedStationCount,
      });
    }
    
    // Step 4: Validate and store data
    const validationResult = await validateAndStore(
      stationStatusResponse,
      {
        sourceUrl,
        collectionId,
      }
    );

    // Build result from validation
    result.success = validationResult.success;
    result.stationCount = validationResult.storageResult?.count ?? 0;
    result.recordedAt = validationResult.metrics?.freshness.lastUpdated ?? new Date();
    result.quality = validationResult.metrics;
    result.warnings = validationResult.warnings;

    if (validationResult.errors.length > 0) {
      result.warnings.push(...validationResult.errors);
    }

    if (result.success) {
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
          duplicateCount: validationResult.storageResult?.duplicateCount ?? 0,
        });
      }
    } else {
      jobState.consecutiveFailures++;
      result.error = validationResult.errors.join(', ');
      captureExceptionWithContext(
        new Error(result.error || 'Collection completed with validation or storage errors'),
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
            errors: validationResult.errors,
          },
        }
      );
      logger.warn('collection.completed_with_errors', {
        error: result.error,
        warnings: result.warnings,
      });
    }

  } catch (error) {
    jobState.consecutiveFailures++;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.error = errorMessage;
    result.success = false;
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

    // Re-throw for upstream handling while still updating state
    throw error;
  } finally {
    result.duration = Date.now() - startTime;
    result.timestamp = new Date();

    // Record metrics for observability dashboard
    recordCollection({
      success: result.success,
      stationsCollected: result.stationCount,
      timestamp: result.timestamp,
      error: result.error
    });

    // Warn on consecutive failures
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
    } catch (releaseError) {
      captureExceptionWithContext(releaseError, {
        area: 'jobs.collection',
        operation: 'release collection lock',
      });
      logger.error('collection.lock_release_failed', { error: releaseError });
    }
  }

  return result;
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
    cronJob.stop();
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
