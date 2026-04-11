import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryRawMock } = vi.hoisted(() => ({
  queryRawMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    $queryRaw: queryRawMock,
  },
}));

import {
  getDailyDemandCurve,
  getHourlyMobilitySignals,
  getMonthlyDemandCurve,
  getSystemHourlyProfile,
} from '@/analytics/queries/read';

describe('analytics read-series normalization', () => {
  beforeEach(() => {
    queryRawMock.mockReset();
  });

  it('normalizes monthly demand rows from daily aggregates before caching', async () => {
    queryRawMock.mockResolvedValueOnce([
      {
        monthKey: '2026-04',
        demandScore: BigInt(123),
        avgOccupancy: '0.42',
        activeStations: BigInt(275),
        sampleCount: BigInt(3300),
      },
    ]);

    const rows = await getMonthlyDemandCurve(12);

    expect(rows).toEqual([
      {
        monthKey: '2026-04',
        demandScore: 123,
        avgOccupancy: 0.42,
        activeStations: 275,
        sampleCount: 3300,
      },
    ]);
    expect(() => JSON.stringify(rows)).not.toThrow();
  });

  it('normalizes monthly demand rows from hourly fallback aggregates', async () => {
    queryRawMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          monthKey: '2026-03',
demandScore: BigInt(456),
        avgOccupancy: '0.37',
        activeStations: BigInt(240),
        sampleCount: BigInt(7200),
        },
      ]);

    const rows = await getMonthlyDemandCurve(12);

    expect(rows).toEqual([
      {
        monthKey: '2026-03',
        demandScore: 456,
        avgOccupancy: 0.37,
        activeStations: 240,
        sampleCount: 7200,
      },
    ]);
    expect(() => JSON.stringify(rows)).not.toThrow();
  });

  it('normalizes cached daily and hourly analytics series rows', async () => {
    queryRawMock
      .mockResolvedValueOnce([
        {
          day: '2026-04-08',
          demandScore: BigInt(32),
          avgOccupancy: '0.61',
          sampleCount: BigInt(48),
        },
      ])
      .mockResolvedValueOnce([
        {
          stationId: 'station-1',
          hour: BigInt(7),
          departures: BigInt(12),
          arrivals: BigInt(15),
          sampleCount: BigInt(18),
        },
      ])
      .mockResolvedValueOnce([
        {
          hour: BigInt(9),
          avgOccupancy: '0.54',
          avgBikesAvailable: '6.5',
          sampleCount: BigInt(96),
        },
      ]);

    const daily = await getDailyDemandCurve(30);
    const hourly = await getHourlyMobilitySignals(14);
    const system = await getSystemHourlyProfile(14);

    expect(daily).toEqual([
      {
        day: '2026-04-08',
        demandScore: 32,
        avgOccupancy: 0.61,
        sampleCount: 48,
      },
    ]);
    expect(hourly).toEqual([
      {
        stationId: 'station-1',
        hour: 7,
        departures: 12,
        arrivals: 15,
        sampleCount: 18,
      },
    ]);
    expect(system).toEqual([
      {
        hour: 9,
        avgOccupancy: 0.54,
        avgBikesAvailable: 6.5,
        sampleCount: 96,
      },
    ]);
  });
});
