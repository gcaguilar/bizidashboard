import { vi, beforeEach, describe, expect, it } from 'vitest';

const { fetchDiscoveryMock, fetchStationInformationMock, fetchStationStatusMock } = vi.hoisted(() => ({
  fetchDiscoveryMock: vi.fn(),
  fetchStationInformationMock: vi.fn(),
  fetchStationStatusMock: vi.fn(),
}));

const { validateAndStoreMock } = vi.hoisted(() => ({
  validateAndStoreMock: vi.fn(),
}));

const { getMissingStationIdsMock, getSnapshotCountMock, getStationMetadataCountMock, upsertStationsMock } = vi.hoisted(() => ({
  getMissingStationIdsMock: vi.fn(),
  getSnapshotCountMock: vi.fn(),
  getStationMetadataCountMock: vi.fn(),
  upsertStationsMock: vi.fn(),
}));

const { recordCollectionMock } = vi.hoisted(() => ({
  recordCollectionMock: vi.fn(),
}));

const { captureExceptionWithContextMock } = vi.hoisted(() => ({
  captureExceptionWithContextMock: vi.fn(),
}));

const { acquireJobLockMock } = vi.hoisted(() => ({
  acquireJobLockMock: vi.fn(),
}));

const { createCollectionRunMock, updateCollectionRunMock, completeCollectionRunMock, failCollectionRunMock } = vi.hoisted(() => ({
  createCollectionRunMock: vi.fn().mockResolvedValue({ id: 'test-id' }),
  updateCollectionRunMock: vi.fn().mockResolvedValue(undefined),
  completeCollectionRunMock: vi.fn().mockResolvedValue(undefined),
  failCollectionRunMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/services/gbfs-client', () => ({
  fetchDiscovery: fetchDiscoveryMock,
  fetchStationInformation: fetchStationInformationMock,
  fetchStationStatus: fetchStationStatusMock,
}));

vi.mock('@/services/data-validator', () => ({
  validateAndStore: validateAndStoreMock,
}));

vi.mock('@/services/data-storage', () => ({
  getMissingStationIds: getMissingStationIdsMock,
  getSnapshotCount: getSnapshotCountMock,
  getStationMetadataCount: getStationMetadataCountMock,
  upsertStations: upsertStationsMock,
}));

vi.mock('@/lib/metrics', () => ({
  recordCollection: recordCollectionMock,
}));

vi.mock('@/lib/sentry-reporting', () => ({
  captureExceptionWithContext: captureExceptionWithContextMock,
}));

vi.mock('@/analytics/job-lock', () => ({
  acquireJobLock: acquireJobLockMock,
}));

vi.mock('@/lib/collection-runs', async () => {
  const actual: typeof import('@/lib/collection-runs') = await vi.importActual('@/lib/collection-runs');
  return {
    ...actual,
    createCollectionRun: createCollectionRunMock,
    updateCollectionRun: updateCollectionRunMock,
    completeCollectionRun: completeCollectionRunMock,
    failCollectionRun: failCollectionRunMock,
  };
});

import { runCollection } from '@/jobs/bizi-collection';

describe('runCollection', () => {
  beforeEach(() => {
    fetchDiscoveryMock.mockReset();
    fetchStationInformationMock.mockReset();
    fetchStationStatusMock.mockReset();
    validateAndStoreMock.mockReset();
    getMissingStationIdsMock.mockReset();
    getSnapshotCountMock.mockReset();
    getStationMetadataCountMock.mockReset();
    upsertStationsMock.mockReset();
    recordCollectionMock.mockReset();
    captureExceptionWithContextMock.mockReset();
    acquireJobLockMock.mockReset();
    createCollectionRunMock.mockReset();
    updateCollectionRunMock.mockReset();
    completeCollectionRunMock.mockReset();
    failCollectionRunMock.mockReset();

    acquireJobLockMock.mockResolvedValue({
      refresh: vi.fn().mockResolvedValue(true),
      release: vi.fn().mockResolvedValue(undefined),
    });
    fetchDiscoveryMock.mockResolvedValue({ version: '2.3' });
    fetchStationInformationMock.mockResolvedValue([
      {
        station_id: '1',
        name: 'Station 1',
        lat: 41.6488,
        lon: -0.8891,
        capacity: 18,
      },
      {
        station_id: '2',
        name: 'Station 2',
        lat: 41.6491,
        lon: -0.8884,
        capacity: 20,
      },
    ]);
    getStationMetadataCountMock.mockResolvedValue(275);
    getMissingStationIdsMock.mockResolvedValue([]);
    fetchStationStatusMock.mockResolvedValue({
      last_updated: 1773915600,
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
    });
  });

  it('skips validation when the upstream snapshot is already ingested', async () => {
    getSnapshotCountMock.mockResolvedValue(2);

    const result = await runCollection();

    expect(result.success).toBe(true);
    expect(result.stationCount).toBe(2);
    expect(result.recordedAt?.toISOString()).toBe('2026-03-19T10:20:00.000Z');
    expect(result.warnings).toEqual([
      'Snapshot 2026-03-19T10:20:00.000Z already ingested; skipping duplicate trigger (2 stations)',
    ]);
    expect(validateAndStoreMock).not.toHaveBeenCalled();
    expect(recordCollectionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        stationsCollected: 2,
      })
    );
  });

  it('fails when lock refresh is not extended', async () => {
    const releaseMock = vi.fn().mockResolvedValue(undefined);
    acquireJobLockMock.mockResolvedValue({
      refresh: vi.fn().mockResolvedValue(false),
      release: releaseMock,
    });
    getSnapshotCountMock.mockResolvedValue(0);
    validateAndStoreMock.mockResolvedValue({
      success: true,
      warnings: [],
      errors: [],
      storageResult: { count: 2, duplicateCount: 0 },
      metrics: {
        freshness: { lastUpdated: new Date('2026-03-19T10:20:00.000Z') },
        lineage: { gbfsVersion: '2.3' },
        volume: { stationCount: 2 },
      },
    });

    await expect(runCollection()).rejects.toThrow(
      'collection lock refresh failed at stage: post-station-metadata-sync'
    );
    expect(releaseMock).toHaveBeenCalled();
  });

  it('refreshes station metadata when the status feed references missing station ids', async () => {
    getSnapshotCountMock.mockResolvedValue(0);
    getMissingStationIdsMock.mockResolvedValue(['2']);
    validateAndStoreMock.mockResolvedValue({
      success: true,
      warnings: [],
      errors: [],
      storageResult: { count: 2, duplicateCount: 0 },
      metrics: {
        freshness: { lastUpdated: new Date('2026-03-19T10:20:00.000Z') },
        lineage: { gbfsVersion: '2.3' },
        volume: { stationCount: 2 },
      },
    });

    const result = await runCollection();

    expect(result.success).toBe(true);
    expect(getMissingStationIdsMock).toHaveBeenCalledWith(['1', '2']);
    expect(fetchStationInformationMock).toHaveBeenCalledTimes(1);
    expect(upsertStationsMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ station_id: '2' }),
      ])
    );
    expect(validateAndStoreMock).toHaveBeenCalledTimes(1);
  });
});