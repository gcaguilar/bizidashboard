import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getHourlyMobilitySignalsMock,
  getDailyDemandCurveMock,
  getSystemHourlyProfileMock,
  withCacheMock,
} = vi.hoisted(() => ({
  getHourlyMobilitySignalsMock: vi.fn(),
  getDailyDemandCurveMock: vi.fn(),
  getSystemHourlyProfileMock: vi.fn(),
  withCacheMock: vi.fn(),
}));

vi.mock('@/analytics/queries/read', () => ({
  getHourlyMobilitySignals: getHourlyMobilitySignalsMock,
  getDailyDemandCurve: getDailyDemandCurveMock,
  getSystemHourlyProfile: getSystemHourlyProfileMock,
}));

vi.mock('@/lib/cache/cache', () => ({
  withCache: withCacheMock,
}));

vi.mock('@/services/shared-data', () => ({
  getSharedDatasetSnapshot: vi.fn().mockResolvedValue(null),
  getPipelineStatusSummary: vi.fn().mockResolvedValue(null),
}));

import { getMobilityData, quantizeMobilityDays } from '@/lib/mobility-read-model';

describe('mobility read model', () => {
  beforeEach(() => {
    getHourlyMobilitySignalsMock.mockReset().mockResolvedValue([]);
    getDailyDemandCurveMock.mockReset().mockResolvedValue([]);
    getSystemHourlyProfileMock.mockReset().mockResolvedValue([]);
    withCacheMock.mockReset();
    withCacheMock.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()
    );
  });

  describe('quantizeMobilityDays', () => {
    it('rounds down to the preset that fits the requested window', () => {
      expect(quantizeMobilityDays(8)).toBe(7);
      expect(quantizeMobilityDays(45)).toBe(30);
      expect(quantizeMobilityDays(364)).toBe(180);
    });

    it('keeps exact presets untouched', () => {
      expect(quantizeMobilityDays(1)).toBe(1);
      expect(quantizeMobilityDays(14)).toBe(14);
      expect(quantizeMobilityDays(30)).toBe(30);
      expect(quantizeMobilityDays(365)).toBe(365);
    });

    it('clamps out-of-range values to the first/last preset', () => {
      expect(quantizeMobilityDays(0)).toBe(1);
      expect(quantizeMobilityDays(-10)).toBe(1);
      expect(quantizeMobilityDays(400)).toBe(365);
    });
  });

  it('queries and reports the quantized window', async () => {
    const payload = await getMobilityData({ mobilityDays: 45, demandDays: 8 });

    expect(withCacheMock).toHaveBeenCalledWith(
      'mobility:mobilityDays=30:demandDays=7:month=all',
      300,
      expect.any(Function)
    );
    expect(payload.mobilityDays).toBe(30);
    expect(payload.demandDays).toBe(7);
    expect(getHourlyMobilitySignalsMock).toHaveBeenCalledWith(30, undefined);
    expect(getDailyDemandCurveMock).toHaveBeenCalledWith(7, undefined);
    expect(getSystemHourlyProfileMock).toHaveBeenCalledWith(30, undefined);
  });

  it('keeps the default presets when no window is requested', async () => {
    const payload = await getMobilityData();

    expect(withCacheMock).toHaveBeenCalledWith(
      'mobility:mobilityDays=14:demandDays=30:month=all',
      300,
      expect.any(Function)
    );
    expect(payload.mobilityDays).toBe(14);
    expect(payload.demandDays).toBe(30);
  });
});
