import { beforeEach, describe, expect, it, vi } from 'vitest';

const SITE_URL = 'https://datosbizi.com';
const {
  fetchAvailableDataMonthsMock,
  fetchHistoryMetadataMock,
  fetchSharedDatasetSnapshotMock,
  fetchStatusMock,
  getDistrictSeoRowsMock,
  getInsightsLandingDataMock,
  getSeoLandingPageDataMock,
  getStationSeoRowsMock,
  getUtilityLandingDataMock,
  withCacheMock,
} = vi.hoisted(() => ({
  fetchAvailableDataMonthsMock: vi.fn(),
  fetchHistoryMetadataMock: vi.fn(),
  fetchSharedDatasetSnapshotMock: vi.fn(),
  fetchStatusMock: vi.fn(),
  getDistrictSeoRowsMock: vi.fn(),
  getInsightsLandingDataMock: vi.fn(),
  getSeoLandingPageDataMock: vi.fn(),
  getStationSeoRowsMock: vi.fn(),
  getUtilityLandingDataMock: vi.fn(),
  withCacheMock: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  fetchAvailableDataMonths: fetchAvailableDataMonthsMock,
  fetchHistoryMetadata: fetchHistoryMetadataMock,
  fetchSharedDatasetSnapshot: fetchSharedDatasetSnapshotMock,
  fetchStatus: fetchStatusMock,
}));

vi.mock('@/lib/cache/cache', () => ({
  withCache: withCacheMock,
}));

vi.mock('@/lib/seo-districts', () => ({
  getDistrictSeoRows: getDistrictSeoRowsMock,
}));

vi.mock('@/lib/seo-stations', () => ({
  getStationSeoRows: getStationSeoRowsMock,
}));

vi.mock('@/lib/acquisition-landings', () => ({
  getInsightsLandingData: getInsightsLandingDataMock,
  getUtilityLandingData: getUtilityLandingDataMock,
}));

vi.mock('@/app/_seo/SeoLandingPage', () => ({
  getSeoLandingPageData: getSeoLandingPageDataMock,
}));

vi.mock('server-only', () => ({}));

describe('sitemap runtime cache', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('APP_URL', SITE_URL);
    vi.stubEnv('ROBOTS_BASE_URL', SITE_URL);

    fetchAvailableDataMonthsMock.mockReset();
    fetchHistoryMetadataMock.mockReset();
    fetchSharedDatasetSnapshotMock.mockReset();
    fetchStatusMock.mockReset();
    getDistrictSeoRowsMock.mockReset();
    getInsightsLandingDataMock.mockReset();
    getSeoLandingPageDataMock.mockReset();
    getStationSeoRowsMock.mockReset();
    getUtilityLandingDataMock.mockReset();
    withCacheMock.mockReset();

    withCacheMock.mockImplementation(async (_key, _ttl, fetcher) => fetcher());

    fetchAvailableDataMonthsMock.mockResolvedValue({
      months: [],
      generatedAt: '2026-03-25T10:00:00.000Z',
    });
    fetchSharedDatasetSnapshotMock.mockResolvedValue({
      coverage: {
        totalDays: 90,
        generatedAt: '2026-03-25T10:00:00.000Z',
      },
      lastUpdated: {
        lastSampleAt: '2026-03-25T10:00:00.000Z',
      },
      stats: {
        totalSamples: 1200,
      },
      dataState: 'fresh',
    });
    fetchStatusMock.mockResolvedValue({
      quality: {
        volume: {
          recentStationCount: 10,
        },
      },
      pipeline: {
        healthStatus: 'healthy',
      },
      dataState: 'fresh',
    });
    fetchHistoryMetadataMock.mockResolvedValue({
      coverage: {
        totalDays: 90,
      },
    });
    getDistrictSeoRowsMock.mockResolvedValue([]);
    getStationSeoRowsMock.mockResolvedValue([]);
    getUtilityLandingDataMock.mockResolvedValue({
      indexability: { includeInSitemap: true },
    });
    getInsightsLandingDataMock.mockResolvedValue({
      indexability: { includeInSitemap: true },
    });
    getSeoLandingPageDataMock.mockResolvedValue(null);
  });

  it('caches the generated sitemap payload behind the shared cache helper', async () => {
    const { default: sitemap } = await import('@/app/sitemap');

    await sitemap();

    expect(withCacheMock).toHaveBeenCalledWith(
      'sitemap:entries:siteUrl=https://datosbizi.com',
      300,
      expect.any(Function)
    );
  });
});
