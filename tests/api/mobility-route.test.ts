import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getDailyDemandCurveMock,
  getHourlyMobilitySignalsMock,
  getSystemHourlyProfileMock,
  withCacheMock,
} = vi.hoisted(() => ({
  getDailyDemandCurveMock: vi.fn(),
  getHourlyMobilitySignalsMock: vi.fn(),
  getSystemHourlyProfileMock: vi.fn(),
  withCacheMock: vi.fn(),
}));

vi.mock('@/analytics/queries/read', () => ({
  getDailyDemandCurve: getDailyDemandCurveMock,
  getHourlyMobilitySignals: getHourlyMobilitySignalsMock,
  getSystemHourlyProfile: getSystemHourlyProfileMock,
}));

vi.mock('@/lib/cache/cache', () => ({
  withCache: withCacheMock,
}));

import { GET } from '@/app/api/mobility/route';

describe('GET /api/mobility', () => {
  beforeEach(() => {
    getDailyDemandCurveMock.mockReset();
    getHourlyMobilitySignalsMock.mockReset();
    getSystemHourlyProfileMock.mockReset();
    withCacheMock.mockReset();
  });

  it('returns mobility payload with hourly signals', async () => {
    getHourlyMobilitySignalsMock.mockResolvedValue([
      {
        stationId: '101',
        hour: 8,
        departures: 12,
        arrivals: 8,
        sampleCount: 4,
      },
    ]);
    getDailyDemandCurveMock.mockResolvedValue([
      {
        day: '2026-03-08',
        demandScore: 120,
        avgOccupancy: 0.41,
        sampleCount: 320,
      },
    ]);
    getSystemHourlyProfileMock.mockResolvedValue([
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
    expect(getHourlyMobilitySignalsMock).toHaveBeenCalledWith(14, undefined);
    expect(getDailyDemandCurveMock).toHaveBeenCalledWith(30, undefined);
    expect(getSystemHourlyProfileMock).toHaveBeenCalledWith(14, undefined);
    expect(payload.hourlySignals).toHaveLength(1);
    expect(payload.dailyDemand).toHaveLength(1);
    expect(payload.systemHourlyProfile).toHaveLength(1);
  });

  it('passes selected month through cache key and query calls', async () => {
    getHourlyMobilitySignalsMock.mockResolvedValue([]);
    getDailyDemandCurveMock.mockResolvedValue([]);
    getSystemHourlyProfileMock.mockResolvedValue([]);
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
    expect(getHourlyMobilitySignalsMock).toHaveBeenCalledWith(14, '2026-03');
    expect(getDailyDemandCurveMock).toHaveBeenCalledWith(30, '2026-03');
    expect(getSystemHourlyProfileMock).toHaveBeenCalledWith(14, '2026-03');
    expect(payload.selectedMonth).toBe('2026-03');
  });

  it('returns 400 on invalid days query params', async () => {
    const response = await GET(
      new Request('http://localhost/api/mobility?mobilityDays=0&demandDays=400') as never
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('Invalid days parameters');
    expect(withCacheMock).not.toHaveBeenCalled();
  });

  it('returns 500 when data retrieval fails', async () => {
    withCacheMock.mockRejectedValue(new Error('redis unavailable'));

    const response = await GET(new Request('http://localhost/api/mobility') as never);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('Failed to fetch mobility insights');
  });
});
