/**
 * Bizi Data Collection Job
 * 
 * Scheduled collection job that runs every 30 minutes to fetch,
 * validate, and store Bizi station data from the GBFS API.
 * Also provides manual trigger capability via runCollection().
 */

import { schedule, ScheduledTask } from 'node-cron';
import { fetchStationStatus } from '@/services/gbfs-client';
import { validateAndStore, GBFSStatusResponse } from '@/services/data-validator';
import { DataObservabilityMetrics } from '@/lib/observability';
import { recordCollection } from '@/lib/metrics';

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
 * Orchestrates: fetch → validate → store
 */
export async function runCollection(): Promise<CollectionResult> {
  const startTime = Date.now();
  console.log('[Collection] Starting Bizi data collection...');

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
    // Step 1: Fetch station status from GBFS API
    const stationStatusResponse = await fetchStationStatus();
    
    // Step 2: Validate and store data
    const validationResult = await validateAndStore(
      stationStatusResponse as GBFSStatusResponse,
      {
        sourceUrl: 'https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json',
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
      console.log(`[Collection] Successfully collected ${result.stationCount} stations`);
    } else {
      jobState.consecutiveFailures++;
      result.error = validationResult.errors.join(', ');
      console.warn(`[Collection] Collection completed with errors: ${result.error}`);
    }

  } catch (error) {
    jobState.consecutiveFailures++;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.error = errorMessage;
    result.success = false;
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
  }

  return result;
}

/**
 * Start the scheduled collection job
 * Runs every 30 minutes in Europe/Madrid timezone
 */
export function startCollectionJob(): void {
  if (cronJob) {
    console.log('[Cron] Collection job already running');
    return;
  }

  // Schedule: every 30 minutes
  // */30 * * * * = every 30th minute
  cronJob = schedule(
    '*/30 * * * *',
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
  console.log('[Cron] Bizi collection scheduled every 30 minutes');
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
