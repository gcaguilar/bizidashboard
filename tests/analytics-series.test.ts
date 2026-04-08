import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const {
  getDailyDemandCurveMock,
  getHourlyMobilitySignalsMock,
  getMonthlyDemandCurveMock,
  getSystemHourlyProfileMock,
  withCacheMock,
} = vi.hoisted(() => ({
  getDailyDemandCurveMock: vi.fn(),
  getHourlyMobilitySignalsMock: vi.fn(),
  getMonthlyDemandCurveMock: vi.fn(),
  getSystemHourlyProfileMock: vi.fn(),
  withCacheMock: vi.fn(),
}));

vi.mock('@/analytics/queries/read', () => ({
  getDailyDemandCurve: getDailyDemandCurveMock,
  getHourlyMobilitySignals: getHourlyMobilitySignalsMock,
  getMonthlyDemandCurve: getMonthlyDemandCurveMock,
  getSystemHourlyProfile: getSystemHourlyProfileMock,
}));

vi.mock('@/lib/cache/cache', () => ({
  withCache: withCacheMock,
}));

import {
  fetchCachedDailyDemandCurve,
  fetchCachedHourlyMobilitySignals,
  fetchCachedMonthlyDemandCurve,
  fetchCachedSystemHourlyProfile,
} from '@/lib/analytics-series';

describe('analytics series cache wrappers', () => {
  beforeEach(() => {
    getDailyDemandCurveMock.mockReset();
    getHourlyMobilitySignalsMock.mockReset();
    getMonthlyDemandCurveMock.mockReset();
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
      'analytics:daily-demand:days=30:month=2026-03',
      300,
      expect.any(Function)
    );
    expect(withCacheMock).toHaveBeenNthCalledWith(
      2,
      'analytics:hourly-mobility-signals:days=14:month=all',
      300,
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
      'analytics:system-hourly-profile:days=1:month=all',
      300,
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
});
