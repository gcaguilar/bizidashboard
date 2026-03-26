import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getStationsWithLatestStatusMock,
  getSharedDatasetSnapshotMock,
  withCacheMock,
} = vi.hoisted(() => ({
  getStationsWithLatestStatusMock: vi.fn(),
  getSharedDatasetSnapshotMock: vi.fn(),
  withCacheMock: vi.fn(),
}));

vi.mock('@/analytics/queries/read', () => ({
  getStationsWithLatestStatus: getStationsWithLatestStatusMock,
}));

vi.mock('@/lib/cache/cache', () => ({
  withCache: withCacheMock,
}));

vi.mock('@/services/shared-data', () => ({
  getSharedDatasetSnapshot: getSharedDatasetSnapshotMock,
}));

import { GET } from '@/app/api/stations/route';

describe('GET /api/stations', () => {
  beforeEach(() => {
    getStationsWithLatestStatusMock.mockReset();
    getSharedDatasetSnapshotMock.mockReset();
    withCacheMock.mockReset();

    getSharedDatasetSnapshotMock.mockResolvedValue({
      coverage: {
        generatedAt: '2026-01-01T00:00:00.000Z',
        lastRecordedAt: '2026-01-01T00:00:00.000Z',
        totalDays: 9,
        totalSamples: 144,
      },
      pipeline: {
        pipeline: {
          healthStatus: 'healthy',
        },
        quality: {
          freshness: {
            isFresh: true,
          },
          volume: {
            expectedRange: { min: 1, max: 400 },
          },
        },
      },
    });
  });

  it('returns stations payload through cache wrapper', async () => {
    getStationsWithLatestStatusMock.mockResolvedValue([
      {
        id: '101',
        name: 'Plaza Espana',
        lat: 41.6488,
        lon: -0.8891,
        capacity: 20,
        bikesAvailable: 9,
        anchorsFree: 11,
        recordedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    withCacheMock.mockImplementation(async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
      return fetcher();
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(withCacheMock).toHaveBeenCalledWith('stations:current', 60, expect.any(Function));
    expect(payload.stations).toHaveLength(1);
    expect(payload.generatedAt).toBeTypeOf('string');
    expect(payload.dataState).toBe('ok');
  });

  it('returns 500 when station retrieval fails', async () => {
    withCacheMock.mockRejectedValue(new Error('redis unavailable'));

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('Failed to fetch stations');
    expect(payload.dataState).toBe('error');
  });
});
