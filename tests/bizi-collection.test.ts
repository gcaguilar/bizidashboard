import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  fetchDiscoveryMock,
  fetchStationInformationMock,
  fetchStationStatusMock,
  validateAndStoreMock,
  getSnapshotCountMock,
  getStationMetadataCountMock,
  upsertStationsMock,
  recordCollectionMock,
  captureExceptionWithContextMock,
  acquireJobLockMock,
} = vi.hoisted(() => ({
  fetchDiscoveryMock: vi.fn(),
  fetchStationInformationMock: vi.fn(),
  fetchStationStatusMock: vi.fn(),
  validateAndStoreMock: vi.fn(),
  getSnapshotCountMock: vi.fn(),
  getStationMetadataCountMock: vi.fn(),
  upsertStationsMock: vi.fn(),
  recordCollectionMock: vi.fn(),
  captureExceptionWithContextMock: vi.fn(),
  acquireJobLockMock: vi.fn(),
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

import { runCollection } from '@/jobs/bizi-collection';

describe('runCollection', () => {
  beforeEach(() => {
    fetchDiscoveryMock.mockReset();
    fetchStationInformationMock.mockReset();
    fetchStationStatusMock.mockReset();
    validateAndStoreMock.mockReset();
    getSnapshotCountMock.mockReset();
    getStationMetadataCountMock.mockReset();
    upsertStationsMock.mockReset();
    recordCollectionMock.mockReset();
    captureExceptionWithContextMock.mockReset();
    acquireJobLockMock.mockReset();

    acquireJobLockMock.mockResolvedValue({
      refresh: vi.fn().mockResolvedValue(true),
      release: vi.fn().mockResolvedValue(undefined),
    });
    fetchDiscoveryMock.mockResolvedValue({ version: '2.3' });
    getStationMetadataCountMock.mockResolvedValue(275);
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
});
