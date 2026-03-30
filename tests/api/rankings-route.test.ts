import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getSharedDatasetSnapshotMock,
  getStationPatternsBulkMock,
  getStationRankingsMock,
  getStationsWithLatestStatusMock,
  withCacheMock,
} = vi.hoisted(() => ({
  getSharedDatasetSnapshotMock: vi.fn(),
  getStationPatternsBulkMock: vi.fn(),
  getStationRankingsMock: vi.fn(),
  getStationsWithLatestStatusMock: vi.fn(),
  withCacheMock: vi.fn(),
}));

vi.mock('@/analytics/queries/read', () => ({
  getStationRankings: getStationRankingsMock,
  getStationsWithLatestStatus: getStationsWithLatestStatusMock,
  getStationPatternsBulk: getStationPatternsBulkMock,
}));

vi.mock('@/lib/districts', () => ({
  fetchDistrictCollection: vi.fn().mockResolvedValue(null),
  buildStationDistrictMap: vi.fn(() => new Map<string, string>()),
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
    getStationPatternsBulkMock.mockReset();
    getStationRankingsMock.mockReset();
    getStationsWithLatestStatusMock.mockReset();
    withCacheMock.mockReset();

    getStationPatternsBulkMock.mockResolvedValue([]);

    getStationsWithLatestStatusMock.mockResolvedValue([
      {
        id: '101',
        name: 'Estación prueba',
        lat: 41.65,
        lon: -0.88,
        capacity: 20,
        bikesAvailable: 10,
        anchorsFree: 10,
        recordedAt: '2026-03-02T00:00:00.000Z',
      },
    ]);

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
    expect(payload.rankings[0].stationName).toBe('Estación prueba');
    expect(payload.rankings[0].peakFullHours).toEqual([]);
    expect(payload.districtSpotlight).toBeDefined();
    expect(Array.isArray(payload.districtSpotlight)).toBe(true);
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
