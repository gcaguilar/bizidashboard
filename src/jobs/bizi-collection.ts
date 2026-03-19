/**
 * Bizi Data Collection Job
 * 
 * Scheduled collection job that runs every 5 minutes to fetch,
 * validate, and store Bizi station data from the GBFS API.
 * Also provides manual trigger capability via runCollection().
 */

import { schedule, ScheduledTask } from 'node-cron';
import { fetchDiscovery, fetchStationInformation, fetchStationStatus } from '@/services/gbfs-client';
import { validateAndStore, GBFSStatusResponse } from '@/services/data-validator';
import { getStationMetadataCount, upsertStations } from '@/services/data-storage';
import { DataObservabilityMetrics } from '@/lib/observability';
import { recordCollection } from '@/lib/metrics';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { acquireJobLock } from '@/analytics/job-lock';

// Type augmentation for node-cron 4.x options
interface CronOptions {
  scheduled?: boolean;
  timezone?: string;
  runOnInit?: boolean;
  name?: string;
  recoverMissedExecutions?: boolean;
}

/**
 * Result of a collection run
 */
export interface CollectionResult {
  success: boolean;
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

// Module-level state
let cronJob: ScheduledTask | null = null;
let isScheduled = false;
const COLLECTION_LOCK_TTL_MS = 10 * 60 * 1000;
const COLLECTION_LOCK_NAME = 'gbfs-collection';
const COLLECTION_CRON_SCHEDULE = '*/5 * * * *';
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
export async function runCollection(): Promise<CollectionResult> {
  const startTime = Date.now();
  console.log('[Collection] Starting Bizi data collection...');

  const lock = await acquireJobLock(COLLECTION_LOCK_NAME, COLLECTION_LOCK_TTL_MS);
  if (!lock) {
    const skippedAt = new Date();
    console.log('[Collection] Skipped because another collection lock is active');
    return {
      success: true,
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
    stationCount: 0,
    recordedAt: null,
    quality: null,
    duration: 0,
    warnings: [],
    timestamp: new Date(),
  };

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

    const [stationStatusResponse, stationInformation] = await Promise.all([
      stationStatusPromise,
      stationInformationPromise,
    ]);

    // Step 3: Refresh station metadata sparingly. Station names/coords/capacity
    // change infrequently, so we only sync them on deploy/startup or bootstrap.
    if (stationInformation) {
      await upsertStations(stationInformation);
      hasSyncedStationInformationSinceStartup = true;
      console.log(
        `[Collection] Station metadata synced (${stationInformation.length} stations)`
      );
    }
    await lock.refresh();
    
    // Step 4: Validate and store data
    const validationResult = await validateAndStore(
      stationStatusResponse as GBFSStatusResponse,
      {
        sourceUrl: process.env.GBFS_URL ?? process.env.GBFS_DISCOVERY_URL ?? DEFAULT_GBFS_SOURCE_URL,
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
        console.log(`[Collection] ${duplicateOnlyWarning}`);
      } else {
        console.log(
          `[Collection] Successfully collected ${result.stationCount} stations`
        );
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
      console.warn(`[Collection] Collection completed with errors: ${result.error}`);
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
    console.error(`[Collection] Failed: ${errorMessage}`);

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
      console.warn(`[Collection] ${jobState.consecutiveFailures} consecutive failures`);
    }

    try {
      await lock.release();
    } catch (releaseError) {
      captureExceptionWithContext(releaseError, {
        area: 'jobs.collection',
        operation: 'release collection lock',
      });
      console.error('[Collection] Failed to release collection lock:', releaseError);
    }
  }

  return result;
}

/**
 * Start the scheduled collection job
 * Runs every 5 minutes in Europe/Madrid timezone
 */
export function startCollectionJob(): void {
  if (cronJob) {
    console.log('[Cron] Collection job already running');
    return;
  }

  // Schedule: every 5 minutes
  cronJob = schedule(
    COLLECTION_CRON_SCHEDULE,
    async () => {
      try {
        await runCollection();
      } catch (error) {
        // Error already logged in runCollection
        // Just prevent crash
        console.error('[Cron] Scheduled collection failed:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'Europe/Madrid',
      runOnInit: true, // Run immediately on startup
    } as CronOptions
  );

  isScheduled = true;
  console.log('[Cron] Bizi collection scheduled every 5 minutes');
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
    console.log('[Cron] Collection job stopped');
  }
}

/**
 * Check if the collection job is currently scheduled
 */
export function isCollectionScheduled(): boolean {
  return isScheduled;
}
