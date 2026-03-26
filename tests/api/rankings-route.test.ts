import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getSharedDatasetSnapshotMock,
  getStationRankingsMock,
  withCacheMock,
} = vi.hoisted(() => ({
  getSharedDatasetSnapshotMock: vi.fn(),
  getStationRankingsMock: vi.fn(),
  withCacheMock: vi.fn(),
}));

vi.mock('@/analytics/queries/read', () => ({
  getStationRankings: getStationRankingsMock,
}));

vi.mock('@/lib/cache/cache', () => ({
  withCache: withCacheMock,
}));

vi.mock('@/services/shared-data', () => ({
  getSharedDatasetSnapshot: getSharedDatasetSnapshotMock,
}));

import { GET } from '@/app/api/rankings/route';

describe('GET /api/rankings', () => {
  beforeEach(() => {
    getSharedDatasetSnapshotMock.mockReset();
    getStationRankingsMock.mockReset();
    withCacheMock.mockReset();

    getSharedDatasetSnapshotMock.mockResolvedValue({
      coverage: {
        generatedAt: '2026-03-09T10:35:00.000Z',
        lastRecordedAt: '2026-03-09T10:30:00.000Z',
        totalDays: 30,
        totalSamples: 1440,
      },
      pipeline: {
        pipeline: {
          healthStatus: 'healthy',
        },
        quality: {
          freshness: {
            isFresh: true,
          },
        },
      },
    });

    withCacheMock.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()
    );
  });

  it('returns ranking payload with dataState metadata', async () => {
    getStationRankingsMock.mockResolvedValue([
      {
        id: 1,
        stationId: '101',
        turnoverScore: 2.4,
        emptyHours: 1,
        fullHours: 0,
        totalHours: 24,
        windowStart: '2026-03-01T00:00:00.000Z',
        windowEnd: '2026-03-02T00:00:00.000Z',
      },
    ]);

    const response = await GET(
      new Request('http://localhost/api/rankings?type=turnover&limit=1') as never
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.rankings).toHaveLength(1);
    expect(payload.dataState).toBe('ok');
  });

  it('returns dataState error for invalid params', async () => {
    const response = await GET(
      new Request('http://localhost/api/rankings?type=invalid&limit=1') as never
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.dataState).toBe('error');
  });
});
