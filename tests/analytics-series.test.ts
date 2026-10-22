import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const {
  getDailyDemandCurveMock,
  getHourlyMobilitySignalsMock,
  getMonthlyDemandCurveMock,
  getStationsWithLatestStatusMock,
  getSystemHourlyProfileMock,
  withCacheMock,
} = vi.hoisted(() => ({
  getDailyDemandCurveMock: vi.fn(),
  getHourlyMobilitySignalsMock: vi.fn(),
  getMonthlyDemandCurveMock: vi.fn(),
  getStationsWithLatestStatusMock: vi.fn(),
  getSystemHourlyProfileMock: vi.fn(),
  withCacheMock: vi.fn(),
}));

vi.mock('@/analytics/queries/read', () => ({
  getDailyDemandCurve: getDailyDemandCurveMock,
  getHourlyMobilitySignals: getHourlyMobilitySignalsMock,
  getMonthlyDemandCurve: getMonthlyDemandCurveMock,
  getStationsWithLatestStatus: getStationsWithLatestStatusMock,
  getSystemHourlyProfile: getSystemHourlyProfileMock,
}));

vi.mock('@/lib/cache/cache', () => ({
  withCache: withCacheMock,
}));

vi.mock('@/lib/cache/rollup-version', () => ({
  getRollupVersion: vi.fn().mockResolvedValue('v1'),
  ROLLUP_SERIES_TTL_SECONDS: 7200,
}));

import {
  fetchCachedDailyDemandCurve,
  fetchCachedHourlyMobilitySignals,
  fetchCachedMonthlyDemandCurve,
  fetchCachedStationsWithLatestStatus,
  fetchCachedSystemHourlyProfile,
} from '@/lib/analytics-series';

describe('analytics series cache wrappers', () => {
  beforeEach(() => {
    getDailyDemandCurveMock.mockReset();
    getHourlyMobilitySignalsMock.mockReset();
    getMonthlyDemandCurveMock.mockReset();
    getStationsWithLatestStatusMock.mockReset();
    getSystemHourlyProfileMock.mockReset();
    withCacheMock.mockReset();

    withCacheMock.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()
    );
  });

  it('caches daily demand and hourly mobility by days and month', async () => {
    getDailyDemandCurveMock.mockResolvedValue([]);
    getHourlyMobilitySignalsMock.mockResolvedValue([]);

    await fetchCachedDailyDemandCurve(30, '2026-03');
    await fetchCachedHourlyMobilitySignals(14, null);

    expect(withCacheMock).toHaveBeenNthCalledWith(
      1,
      // Un mes cerrado es inmutable: sin version de rollup y un dia de TTL.
      'analytics:daily-demand:days=30:month=2026-03',
      86_400,
      expect.any(Function)
    );
    expect(withCacheMock).toHaveBeenNthCalledWith(
      2,
      'analytics:hourly-mobility-signals:days=14:month=all:rollup=v1',
      7200,
      expect.any(Function)
    );
    expect(getDailyDemandCurveMock).toHaveBeenCalledWith(30, '2026-03');
    expect(getHourlyMobilitySignalsMock).toHaveBeenCalledWith(14, undefined);
  });

  it('caches monthly and hourly profile series with normalized parameters', async () => {
    getMonthlyDemandCurveMock.mockResolvedValue([]);
    getSystemHourlyProfileMock.mockResolvedValue([]);

    await fetchCachedMonthlyDemandCurve(99);
    await fetchCachedSystemHourlyProfile(0, 'invalid-month');

    expect(withCacheMock).toHaveBeenNthCalledWith(
      1,
      'analytics:monthly-demand:limit=99',
      1800,
      expect.any(Function)
    );
    expect(withCacheMock).toHaveBeenNthCalledWith(
      2,
      'analytics:system-hourly-profile:days=1:month=all:rollup=v1',
      7200,
      expect.any(Function)
    );
    expect(getMonthlyDemandCurveMock).toHaveBeenCalledWith(99);
    expect(getSystemHourlyProfileMock).toHaveBeenCalledWith(1, undefined);
  });

  it('caps monthly limit to hard maximum', async () => {
    getMonthlyDemandCurveMock.mockResolvedValue([]);

    await fetchCachedMonthlyDemandCurve(999);

    expect(withCacheMock).toHaveBeenCalledWith(
      'analytics:monthly-demand:limit=240',
      1800,
      expect.any(Function)
    );
    expect(getMonthlyDemandCurveMock).toHaveBeenCalledWith(240);
  });

  it('caches the station network with its latest snapshot', async () => {
    getStationsWithLatestStatusMock.mockResolvedValue([]);

    await fetchCachedStationsWithLatestStatus();

    expect(withCacheMock).toHaveBeenCalledWith(
      'analytics:stations-latest',
      60,
      expect.any(Function)
    );
    expect(getStationsWithLatestStatusMock).toHaveBeenCalledWith();
  });
});
