import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataObservabilityMetrics } from '@/lib/observability';

const {
  storeStationStatusesMock,
  validateDataQualityMock,
  logObservabilityMetricsMock,
  shouldStoreDataMock,
  incrementValidationErrorsMock,
} = vi.hoisted(() => ({
  storeStationStatusesMock: vi.fn(),
  validateDataQualityMock: vi.fn(),
  logObservabilityMetricsMock: vi.fn(),
  shouldStoreDataMock: vi.fn(),
  incrementValidationErrorsMock: vi.fn(),
}));

vi.mock('@/services/data-storage', () => ({
  storeStationStatuses: storeStationStatusesMock,
}));

vi.mock('@/lib/observability', () => ({
  validateDataQuality: validateDataQualityMock,
  logObservabilityMetrics: logObservabilityMetricsMock,
  shouldStoreData: shouldStoreDataMock,
}));

vi.mock('@/lib/metrics', () => ({
  incrementValidationErrors: incrementValidationErrorsMock,
}));

import { validateAndStore, type GBFSStatusResponse } from '@/services/data-validator';

function buildMetrics(lastUpdated: string): DataObservabilityMetrics {
  return {
    timestamp: new Date(lastUpdated),
    collectionId: 'col-test',
    freshness: {
      lastUpdated: new Date(lastUpdated),
      ageSeconds: 0,
      maxAgeSeconds: 300,
      isFresh: true,
    },
    volume: {
      stationCount: 2,
      previousCount: 2,
      expectedRange: { min: 200, max: 500 },
      isValid: true,
    },
    schema: {
      isValid: true,
      errors: [],
    },
    distribution: {
      negativeBikesCount: 0,
      negativeDocksCount: 0,
      zeroCapacityCount: 0,
      isValid: true,
    },
    lineage: {
      gbfsVersion: '2.3',
      sourceUrl: 'https://example.com/gbfs.json',
      isValid: true,
    },
    allChecksPassed: true,
    warnings: [],
    errors: [],
  };
}

describe('validateAndStore', () => {
  beforeEach(() => {
    storeStationStatusesMock.mockReset();
    validateDataQualityMock.mockReset();
    logObservabilityMetricsMock.mockReset();
    shouldStoreDataMock.mockReset();
    incrementValidationErrorsMock.mockReset();

    validateDataQualityMock.mockResolvedValue(buildMetrics('2026-03-19T09:35:00.000Z'));
    shouldStoreDataMock.mockReturnValue(true);
    storeStationStatusesMock.mockResolvedValue({
      success: true,
      count: 2,
      duplicateCount: 0,
      skippedMissingStationIds: [],
      errors: [],
    });
  });

  it('stores station statuses using the feed snapshot timestamp', async () => {
    const response: GBFSStatusResponse = {
      last_updated: 1773912900,
      ttl: 0,
      version: '2.3',
      data: {
        stations: [
          {
            station_id: '1',
            num_bikes_available: 7,
            num_docks_available: 11,
            last_reported: 1773912800,
          },
          {
            station_id: '2',
            num_bikes_available: 3,
            num_docks_available: 9,
            last_reported: 1773912500,
          },
        ],
      },
    };

    await validateAndStore(response, {
      sourceUrl: 'https://example.com/gbfs.json',
    });

    expect(storeStationStatusesMock).toHaveBeenCalledWith([
      {
        station_id: '1',
        num_bikes_available: 7,
        num_docks_available: 11,
        recorded_at: 1773912900,
      },
      {
        station_id: '2',
        num_bikes_available: 3,
        num_docks_available: 9,
        recorded_at: 1773912900,
      },
    ]);
  });

  it('surfaces skipped missing stations as warnings instead of failing the batch', async () => {
    storeStationStatusesMock.mockResolvedValue({
      success: true,
      count: 1,
      duplicateCount: 0,
      skippedMissingStationIds: ['2'],
      errors: [],
    });

    const response: GBFSStatusResponse = {
      last_updated: 1773912900,
      ttl: 0,
      version: '2.3',
      data: {
        stations: [
          {
            station_id: '1',
            num_bikes_available: 7,
            num_docks_available: 11,
          },
          {
            station_id: '2',
            num_bikes_available: 3,
            num_docks_available: 9,
          },
        ],
      },
    };

    const result = await validateAndStore(response, {
      sourceUrl: 'https://example.com/gbfs.json',
    });

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toContain(
      'Skipped 1 station statuses because station metadata is still unavailable after refresh.'
    );
    expect(result.storageResult).toEqual({
      count: 1,
      duplicateCount: 0,
      errors: [],
    });
  });
});
