import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getDailyDemandCurveMock,
  getHourlyMobilitySignalsMock,
  getHourlyTransitImpactMock,
  withCacheMock,
} = vi.hoisted(() => ({
  getDailyDemandCurveMock: vi.fn(),
  getHourlyMobilitySignalsMock: vi.fn(),
  getHourlyTransitImpactMock: vi.fn(),
  withCacheMock: vi.fn(),
}));

vi.mock('@/analytics/queries/read', () => ({
  getDailyDemandCurve: getDailyDemandCurveMock,
  getHourlyMobilitySignals: getHourlyMobilitySignalsMock,
  getHourlyTransitImpact: getHourlyTransitImpactMock,
}));

vi.mock('@/lib/cache/cache', () => ({
  withCache: withCacheMock,
}));

import { GET } from '@/app/api/mobility/route';

describe('GET /api/mobility', () => {
  beforeEach(() => {
    getDailyDemandCurveMock.mockReset();
    getHourlyMobilitySignalsMock.mockReset();
    getHourlyTransitImpactMock.mockReset();
    withCacheMock.mockReset();
  });

  it('returns mobility payload with hourly transit impact', async () => {
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
    getHourlyTransitImpactMock.mockResolvedValue([
      {
        provider: 'TRAM',
        hour: 8,
        avgDeparturesWithTransit: 13.5,
        avgDeparturesWithoutTransit: 11,
        uplift: 2.5,
        upliftRatio: 0.227,
        avgArrivalPressure: 0.32,
        totalArrivalEvents: 24,
        samplesWithTransit: 16,
        samplesWithoutTransit: 12,
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
    expect(getHourlyTransitImpactMock).toHaveBeenCalledWith(14, undefined);
    expect(payload.hourlySignals).toHaveLength(1);
    expect(payload.dailyDemand).toHaveLength(1);
    expect(payload.transitImpact.hourly).toHaveLength(1);
    expect(payload.transitImpact.hourly[0].provider).toBe('tram');
  });

  it('passes selected month through cache key and query calls', async () => {
    getHourlyMobilitySignalsMock.mockResolvedValue([]);
    getDailyDemandCurveMock.mockResolvedValue([]);
    getHourlyTransitImpactMock.mockResolvedValue([]);
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
    expect(getHourlyTransitImpactMock).toHaveBeenCalledWith(14, '2026-03');
    expect(payload.selectedMonth).toBe('2026-03');
  });

  it('falls back when transit tables are missing', async () => {
    getHourlyMobilitySignalsMock.mockResolvedValue([]);
    getDailyDemandCurveMock.mockResolvedValue([]);
    getHourlyTransitImpactMock.mockRejectedValue(new Error('no such table: TransitSnapshot'));
    withCacheMock.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()
    );

    const response = await GET(new Request('http://localhost/api/mobility') as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.transitImpact.hourly).toEqual([]);
    expect(payload.transitImpact.warning).toContain('Transit impact unavailable');
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
