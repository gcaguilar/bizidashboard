/**
 * Collection Pipeline — GBFS fetch → validate → store
 *
 * This module owns the data-fetching, validation, and storage steps of a
 * single collection cycle. It is agnostic of scheduling, metrics, and job
 * state tracking — those live in `bizi-collection.ts`.
 */

import type { StationInformation } from '@/schemas/gbfs';
import type { DataObservabilityMetrics } from '@/lib/observability';
import { fetchDiscovery, fetchStationInformation, fetchStationStatus } from '@/services/gbfs-client';
import { validateAndStore } from '@/services/data-validator';
import type { ValidationResult } from '@/services/data-validator';
import {
  getMissingStationIds,
  getSnapshotCount,
  getStationMetadataCount,
  upsertStations,
} from '@/services/data-storage';
import { logger } from '@/lib/logger';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DiscoveryResponse {
  version: string;
  data: Record<string, { feeds: Array<{ name: string; url: string }> }>;
}

interface StationStatusResponse {
  last_updated: number;
  ttl: number;
  version: string;
  data: {
    stations: Array<{
      station_id: string;
      num_bikes_available: number;
      num_docks_available: number;
      num_bikes_disabled?: number;
      num_docks_disabled?: number;
      is_installed?: boolean;
      is_renting?: boolean;
      is_returning?: boolean;
      last_reported?: number;
    }>;
  };
}

/**
 * Adapter for fetching GBFS data.
 * At the seam, the default implementation delegates to `gbfs-client`.
 */
export interface GbfFetchAdapter {
  fetchDiscovery: () => Promise<DiscoveryResponse>;
  fetchStationStatus: (discovery: DiscoveryResponse) => Promise<StationStatusResponse>;
  fetchStationInformation: (discovery: DiscoveryResponse) => Promise<StationInformation[]> | null;
}

/**
 * Adapter for validation and storage.
 * At the seam, the default implementation delegates to `data-validator`.
 */
export interface ValidationAdapter {
  validateAndStore: (
    response: StationStatusResponse,
    options: { sourceUrl: string; collectionId: string }
  ) => Promise<ValidationResult>;
}

/**
 * Adapter for database storage operations.
 * At the seam, the default implementation delegates to `data-storage`.
 */
export interface StorageAdapter {
  upsertStations: (stations: StationInformation[]) => Promise<{ createdOrUpdated: number }>;
  getMissingStationIds: (stationIds: string[]) => Promise<string[]>;
  getSnapshotCount: (recordedAt: Date) => Promise<number>;
  getStationMetadataCount: () => Promise<number>;
}

/**
 * Result returned by the pipeline's execute method.
 */
export interface CollectionPipelineResult {
  success: boolean;
  collectionId: string;
  stationCount: number;
  recordedAt: Date | null;
  quality: DataObservabilityMetrics | null;
  duration: number;
  warnings: string[];
  error?: string;
}

export interface CollectionPipelineConfig {
  sourceUrl: string;
  lockName: string;
  lockTtlMs: number;
  /** Called after station metadata is synced (step 3). Used for lock refresh. */
  onStationMetadataSynced?: () => Promise<void>;
}

// ─── Default adapters ───────────────────────────────────────────────────────

function makeDefaultFetchAdapter(): GbfFetchAdapter {
  return {
    fetchDiscovery,
    fetchStationStatus: (discovery) =>
      fetchStationStatus(discovery as Parameters<typeof fetchStationStatus>[0]) as Promise<StationStatusResponse>,
    fetchStationInformation: (discovery) =>
      fetchStationInformation(discovery as Parameters<typeof fetchStationInformation>[0]) as Promise<StationInformation[]>,
  };
}

function makeDefaultValidationAdapter(): ValidationAdapter {
  return {
    validateAndStore: (response, options) =>
      validateAndStore(response as Parameters<typeof validateAndStore>[0], options) as Promise<ValidationResult>,
  };
}

function makeDefaultStorageAdapter(): StorageAdapter {
  return {
    upsertStations: (stations) => upsertStations(stations),
    getMissingStationIds,
    getSnapshotCount,
    getStationMetadataCount,
  };
}

// ─── Pipeline ───────────────────────────────────────────────────────────────

export class CollectionPipeline {
  private _fetch: GbfFetchAdapter;
  private _validation: ValidationAdapter;
  private _storage: StorageAdapter;
  private _syncedSinceStartup = false;

  constructor(
    gbf: GbfFetchAdapter,
    validation: ValidationAdapter,
    storage: StorageAdapter,
    private _config: CollectionPipelineConfig
  ) {
    this._fetch = gbf;
    this._validation = validation;
    this._storage = storage;
  }

  /**
   * Execute the full collection pipeline:
   *   1. Fetch discovery + station status (+ optional station info)
   *   2. Upsert station metadata if needed
   *   3. Check for duplicate snapshot
   *   4. Validate and store
   *
   * The caller is responsible for lock management (acquire/refresh/release).
   *
   * Returns `CollectionPipelineResult`. On fetch errors (steps 1-2) the
   * method throws; on validation/storage errors it returns `success: false`
   * with details in the result.
   */
  async execute(
    collectionId: string
  ): Promise<CollectionPipelineResult> {
    const startTime = Date.now();
    const result: CollectionPipelineResult = {
      success: false,
      collectionId,
      stationCount: 0,
      recordedAt: null,
      quality: null,
      duration: 0,
      warnings: [],
    };

    try {
      // ── Step 1: Fetch discovery once ──────────────────────────────────
      const discovery = await this._fetch.fetchDiscovery();
      const syncStationInformation = await this._shouldSyncStationInformation();

      // ── Step 2: Fetch live station status + optional station info ─────
      const stationStatusPromise = this._fetch.fetchStationStatus(discovery);
      const stationInformationPromise = syncStationInformation
        ? this._fetch.fetchStationInformation(discovery)
        : Promise.resolve(null);

      const [stationStatusResponse, initialStationInformation] = await Promise.all([
        stationStatusPromise,
        stationInformationPromise,
      ]);

      let stationInformation = initialStationInformation;

      // Bootstrap: if station info was not fetched at startup and some
      // stations from the status feed are missing from the DB, re-fetch.
      if (!stationInformation) {
        const missingStationIds = await this._storage.getMissingStationIds(
          stationStatusResponse.data.stations.map((s) => s.station_id)
        );

        if (missingStationIds.length > 0) {
          logger.warn('collection.station_metadata_missing', {
            missingStationCount: missingStationIds.length,
            missingStationIdsSample: missingStationIds.slice(0, 10),
          });
          stationInformation = await this._fetch.fetchStationInformation(discovery);
        }
      }

      // ── Step 3: Upsert station metadata ───────────────────────────────
      if (stationInformation) {
        await this._storage.upsertStations(stationInformation);
        this._syncedSinceStartup = true;
        logger.info('collection.station_metadata_synced', {
          stationCount: stationInformation.length,
          reason: syncStationInformation ? 'startup_or_bootstrap' : 'missing_station_ids',
        });
        // Notify caller so they can refresh the job lock after this I/O-heavy step.
        await this._config.onStationMetadataSynced?.();
      }

      const snapshotRecordedAt = new Date(stationStatusResponse.last_updated * 1000);
      const existingSnapshotCount = await this._storage.getSnapshotCount(snapshotRecordedAt);
      const expectedStationCount = stationStatusResponse.data.stations.length;

      // ── Step 4: Duplicate snapshot check ──────────────────────────────
      if (existingSnapshotCount >= expectedStationCount && expectedStationCount > 0) {
        const skipMessage = `Snapshot ${snapshotRecordedAt.toISOString()} already ingested; skipping duplicate trigger (${existingSnapshotCount} stations)`;
        result.success = true;
        result.stationCount = expectedStationCount;
        result.recordedAt = snapshotRecordedAt;
        result.warnings = [skipMessage];
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

      // ── Step 5: Validate and store ────────────────────────────────────
      const validationResult = await this._validation.validateAndStore(stationStatusResponse, {
        sourceUrl: this._config.sourceUrl,
        collectionId,
      });

      result.success = validationResult.success;
      result.stationCount = validationResult.storageResult?.count ?? 0;
      result.recordedAt = validationResult.metrics?.freshness.lastUpdated ?? new Date();
      result.quality = validationResult.metrics;
      result.warnings = [...validationResult.warnings];

      if (validationResult.errors.length > 0) {
        result.warnings.push(...validationResult.errors);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.error = errorMessage;
      result.success = false;
      throw error;
    } finally {
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  // ── Internal helpers ──────────────────────────────────────────────────

  private async _shouldSyncStationInformation(): Promise<boolean> {
    if (!this._syncedSinceStartup) {
      return true;
    }
    const stationCount = await this._storage.getStationMetadataCount();
    return stationCount === 0;
  }
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function createCollectionPipeline(
  config: CollectionPipelineConfig
): CollectionPipeline {
  return new CollectionPipeline(
    makeDefaultFetchAdapter(),
    makeDefaultValidationAdapter(),
    makeDefaultStorageAdapter(),
    config
  );
}
