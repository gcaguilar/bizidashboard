import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const {
  buildComparisonHubViewModelMock,
  buildDistrictSeoRowsMock,
  fetchAvailableDataMonthsMock,
  fetchCachedDailyDemandCurveMock,
  fetchCachedMonthlyDemandCurveMock,
  fetchCachedSystemHourlyProfileMock,
  fetchDistrictCollectionMock,
  fetchRankingsLiteMock,
  fetchSharedDatasetSnapshotMock,
  fetchStationsMock,
  getDailyMobilityConclusionsMock,
  queryRawMock,
  withCacheMock,
} = vi.hoisted(() => ({
  buildComparisonHubViewModelMock: vi.fn(),
  buildDistrictSeoRowsMock: vi.fn(),
  fetchAvailableDataMonthsMock: vi.fn(),
  fetchCachedDailyDemandCurveMock: vi.fn(),
  fetchCachedMonthlyDemandCurveMock: vi.fn(),
  fetchCachedSystemHourlyProfileMock: vi.fn(),
  fetchDistrictCollectionMock: vi.fn(),
  fetchRankingsLiteMock: vi.fn(),
  fetchSharedDatasetSnapshotMock: vi.fn(),
  fetchStationsMock: vi.fn(),
  getDailyMobilityConclusionsMock: vi.fn(),
  queryRawMock: vi.fn(),
  withCacheMock: vi.fn(),
}));

vi.mock('@/lib/cache/cache', () => ({
  withCache: withCacheMock,
}));

vi.mock('@/lib/api', () => ({
  fetchAvailableDataMonths: fetchAvailableDataMonthsMock,
  fetchRankingsLite: fetchRankingsLiteMock,
  fetchSharedDatasetSnapshot: fetchSharedDatasetSnapshotMock,
  fetchStations: fetchStationsMock,
}));

vi.mock('@/lib/analytics-series', () => ({
  fetchCachedDailyDemandCurve: fetchCachedDailyDemandCurveMock,
  fetchCachedMonthlyDemandCurve: fetchCachedMonthlyDemandCurveMock,
  fetchCachedSystemHourlyProfile: fetchCachedSystemHourlyProfileMock,
}));

vi.mock('@/lib/districts', () => ({
  fetchDistrictCollection: fetchDistrictCollectionMock,
}));

vi.mock('@/lib/mobility-conclusions', () => ({
  getDailyMobilityConclusions: getDailyMobilityConclusionsMock,
}));

vi.mock('@/lib/seo-districts', () => ({
  buildDistrictSeoRows: buildDistrictSeoRowsMock,
}));

vi.mock('@/lib/comparison-hub-builders', () => ({
  buildFallbackComparisonSections: vi.fn(() => []),
  buildComparisonHubViewModel: buildComparisonHubViewModelMock,
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    $queryRaw: queryRawMock,
  },
}));

import { getComparisonHubData } from '@/lib/comparison-hub';

describe('getComparisonHubData', () => {
  beforeEach(() => {
    buildComparisonHubViewModelMock.mockReset();
    buildDistrictSeoRowsMock.mockReset();
    fetchAvailableDataMonthsMock.mockReset();
    fetchCachedDailyDemandCurveMock.mockReset();
    fetchCachedMonthlyDemandCurveMock.mockReset();
    fetchCachedSystemHourlyProfileMock.mockReset();
    fetchDistrictCollectionMock.mockReset();
    fetchRankingsLiteMock.mockReset();
    fetchSharedDatasetSnapshotMock.mockReset();
    fetchStationsMock.mockReset();
    getDailyMobilityConclusionsMock.mockReset();
    queryRawMock.mockReset();
    withCacheMock.mockReset();

    withCacheMock.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()
    );

    fetchStationsMock.mockResolvedValue({
      stations: [{ id: '101', name: 'Estacion 101', bikesAvailable: 10, capacity: 20, recordedAt: '2026-04-01T10:00:00.000Z' }],
      generatedAt: '2026-04-01T10:00:00.000Z',
      dataState: 'ok',
    });
    fetchRankingsLiteMock.mockResolvedValue({
      type: 'turnover',
      limit: 10,
      rankings: [{ stationId: '101', turnoverScore: 3.2, emptyHours: 1, fullHours: 0 }],
      generatedAt: '2026-04-01T10:00:00.000Z',
      dataState: 'ok',
    });
    fetchAvailableDataMonthsMock.mockResolvedValue({
      months: ['2026-03', '2026-02'],
      generatedAt: '2026-04-01T10:00:00.000Z',
    });
    fetchCachedMonthlyDemandCurveMock.mockResolvedValue([
      {
        monthKey: '2026-03',
        demandScore: 1000,
        avgOccupancy: 0.5,
        activeStations: 120,
        sampleCount: 200,
      },
    ]);
    fetchCachedDailyDemandCurveMock.mockResolvedValue([
      {
        day: '2026-04-01',
        demandScore: 120,
        avgOccupancy: 0.45,
        sampleCount: 50,
      },
    ]);
    fetchCachedSystemHourlyProfileMock.mockResolvedValue([
      {
        hour: 8,
        avgOccupancy: 0.45,
        avgBikesAvailable: 10,
        sampleCount: 50,
      },
    ]);
    fetchSharedDatasetSnapshotMock.mockResolvedValue({
      coverage: { totalDays: 30 },
      dataState: 'ok',
    });
    fetchDistrictCollectionMock.mockResolvedValue(null);
    getDailyMobilityConclusionsMock.mockResolvedValue({ payload: null });
    buildDistrictSeoRowsMock.mockReturnValue([]);
    buildComparisonHubViewModelMock.mockReturnValue({
      interactive: {
        defaultDimensionId: null,
        dimensions: [],
      },
      sections: [],
    });
    queryRawMock.mockResolvedValue([]);
  });

  it('caches the final snapshot and relies on lightweight rankings plus shared cached series', async () => {
    const payload = await getComparisonHubData();

    expect(withCacheMock).toHaveBeenCalledWith(
      'comparison-hub:snapshot',
      300,
      expect.any(Function)
    );
    expect(fetchRankingsLiteMock).toHaveBeenNthCalledWith(1, 'turnover', 10);
    expect(fetchRankingsLiteMock).toHaveBeenNthCalledWith(2, 'availability', 10);
    expect(fetchCachedMonthlyDemandCurveMock).toHaveBeenCalledWith(24);
    expect(fetchCachedDailyDemandCurveMock).toHaveBeenCalledWith(90);
    expect(fetchCachedSystemHourlyProfileMock).toHaveBeenCalledWith(30);
    expect(buildComparisonHubViewModelMock).toHaveBeenCalled();
    expect(payload.sections).toEqual([]);
  });
});
