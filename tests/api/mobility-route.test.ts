import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  fetchCachedDailyDemandCurveMock,
  getSharedDatasetSnapshotMock,
  fetchCachedHourlyMobilitySignalsMock,
  fetchCachedSystemHourlyProfileMock,
  withCacheMock,
} = vi.hoisted(() => ({
  fetchCachedDailyDemandCurveMock: vi.fn(),
  getSharedDatasetSnapshotMock: vi.fn(),
  fetchCachedHourlyMobilitySignalsMock: vi.fn(),
  fetchCachedSystemHourlyProfileMock: vi.fn(),
  withCacheMock: vi.fn(),
}));

vi.mock('@/lib/analytics-series', () => ({
  fetchCachedDailyDemandCurve: fetchCachedDailyDemandCurveMock,
  fetchCachedHourlyMobilitySignals: fetchCachedHourlyMobilitySignalsMock,
  fetchCachedSystemHourlyProfile: fetchCachedSystemHourlyProfileMock,
}));

vi.mock('@/lib/cache/cache', () => ({
  withCache: withCacheMock,
}));

vi.mock('@/services/shared-data', () => ({
  getSharedDatasetSnapshot: getSharedDatasetSnapshotMock,
}));

import { GET } from '@/app/api/mobility/route';

describe('GET /api/mobility', () => {
  beforeEach(() => {
    fetchCachedDailyDemandCurveMock.mockReset();
    getSharedDatasetSnapshotMock.mockReset();
    fetchCachedHourlyMobilitySignalsMock.mockReset();
    fetchCachedSystemHourlyProfileMock.mockReset();
    withCacheMock.mockReset();

    getSharedDatasetSnapshotMock.mockResolvedValue({
      coverage: {
        generatedAt: '2026-03-08T00:00:00.000Z',
        lastRecordedAt: '2026-03-08T00:00:00.000Z',
        totalDays: 90,
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
  });

  it('returns mobility payload with hourly signals', async () => {
    fetchCachedHourlyMobilitySignalsMock.mockResolvedValue([
      {
        stationId: '101',
        hour: 8,
        departures: 12,
        arrivals: 8,
        sampleCount: 4,
      },
    ]);
    fetchCachedDailyDemandCurveMock.mockResolvedValue([
      {
        day: '2026-03-08',
        demandScore: 120,
        avgOccupancy: 0.41,
        sampleCount: 320,
      },
    ]);
    fetchCachedSystemHourlyProfileMock.mockResolvedValue([
      {
        hour: 8,
        avgOccupancy: 0.41,
        bikesInCirculation: 12.5,
        sampleCount: 320,
      },
    ]);
    withCacheMock.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()
    );

    const response = await GET(
      new Request('http://localhost/api/mobility?mobilityDays=14&demandDays=30') as never
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(withCacheMock).toHaveBeenCalledWith(
      'mobility:mobilityDays=14:demandDays=30:month=all',
      300,
      expect.any(Function)
    );
    expect(fetchCachedHourlyMobilitySignalsMock).toHaveBeenCalledWith(14, null);
    expect(fetchCachedDailyDemandCurveMock).toHaveBeenCalledWith(30, null);
    expect(fetchCachedSystemHourlyProfileMock).toHaveBeenCalledWith(14, null);
    expect(payload.hourlySignals).toHaveLength(1);
    expect(payload.dailyDemand).toHaveLength(1);
    expect(payload.systemHourlyProfile).toHaveLength(1);
    expect(payload.dataState).toBe('partial');
  });

  it('passes selected month through cache key and query calls', async () => {
    fetchCachedHourlyMobilitySignalsMock.mockResolvedValue([]);
    fetchCachedDailyDemandCurveMock.mockResolvedValue([]);
    fetchCachedSystemHourlyProfileMock.mockResolvedValue([]);
    withCacheMock.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()
    );

    const response = await GET(
      new Request('http://localhost/api/mobility?mobilityDays=14&demandDays=30&month=2026-03') as never
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(withCacheMock).toHaveBeenCalledWith(
      'mobility:mobilityDays=14:demandDays=30:month=2026-03',
      300,
      expect.any(Function)
    );
    expect(fetchCachedHourlyMobilitySignalsMock).toHaveBeenCalledWith(14, '2026-03');
    expect(fetchCachedDailyDemandCurveMock).toHaveBeenCalledWith(30, '2026-03');
    expect(fetchCachedSystemHourlyProfileMock).toHaveBeenCalledWith(14, '2026-03');
    expect(payload.selectedMonth).toBe('2026-03');
    expect(payload.dataState).toBe('empty');
  });

  it('returns 400 on invalid days query params', async () => {
    const response = await GET(
      new Request('http://localhost/api/mobility?mobilityDays=0&demandDays=400') as never
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('Invalid days parameters');
    expect(payload.dataState).toBe('error');
    expect(withCacheMock).not.toHaveBeenCalled();
  });

  it('returns 500 when data retrieval fails', async () => {
    withCacheMock.mockRejectedValue(new Error('redis unavailable'));

    const response = await GET(new Request('http://localhost/api/mobility') as never);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('Failed to fetch mobility insights');
    expect(payload.dataState).toBe('error');
  });
});
