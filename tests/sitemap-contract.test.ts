import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SITE_URL = 'https://datosbizi.com';
const {
  fetchStationsMock,
  fetchAvailableDataMonthsMock,
  fetchSharedDatasetSnapshotMock,
  fetchStatusMock,
  fetchHistoryMetadataMock,
  getDistrictSeoRowsMock,
  getDistrictSlugsFromGeoJsonMock,
  getStationSeoRowsMock,
  getUtilityLandingDataMock,
  getInsightsLandingDataMock,
  getDailyMobilityConclusionsMock,
  getSeoLandingPageDataMock,
} = vi.hoisted(() => ({
  fetchStationsMock: vi.fn(),
  fetchAvailableDataMonthsMock: vi.fn(),
  fetchSharedDatasetSnapshotMock: vi.fn(),
  fetchStatusMock: vi.fn(),
  fetchHistoryMetadataMock: vi.fn(),
  getDistrictSeoRowsMock: vi.fn(),
  getDistrictSlugsFromGeoJsonMock: vi.fn(),
  getStationSeoRowsMock: vi.fn(),
  getUtilityLandingDataMock: vi.fn(),
  getInsightsLandingDataMock: vi.fn(),
  getDailyMobilityConclusionsMock: vi.fn(),
  getSeoLandingPageDataMock: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  fetchStations: fetchStationsMock,
  fetchAvailableDataMonths: fetchAvailableDataMonthsMock,
  fetchSharedDatasetSnapshot: fetchSharedDatasetSnapshotMock,
  fetchStatus: fetchStatusMock,
  fetchHistoryMetadata: fetchHistoryMetadataMock,
}));

vi.mock('@/lib/seo-districts', () => ({
  getDistrictSeoRows: getDistrictSeoRowsMock,
  getDistrictSlugsFromGeoJson: getDistrictSlugsFromGeoJsonMock,
}));

vi.mock('@/lib/seo-stations', () => ({
  getStationSeoRows: getStationSeoRowsMock,
}));

vi.mock('@/lib/acquisition-landings', () => ({
  getUtilityLandingData: getUtilityLandingDataMock,
  getInsightsLandingData: getInsightsLandingDataMock,
}));

vi.mock('@/lib/mobility-conclusions', () => ({
  getDailyMobilityConclusions: getDailyMobilityConclusionsMock,
}));

vi.mock('@/app/_seo/SeoLandingPage', () => ({
  getSeoLandingPageData: getSeoLandingPageDataMock,
}));

vi.mock('server-only', () => ({}));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('APP_URL', SITE_URL);
  vi.stubEnv('ROBOTS_BASE_URL', SITE_URL);

  fetchStationsMock.mockReset();
  fetchAvailableDataMonthsMock.mockReset();
  fetchSharedDatasetSnapshotMock.mockReset();
  fetchStatusMock.mockReset();
  fetchHistoryMetadataMock.mockReset();
  getDistrictSeoRowsMock.mockReset();
  getDistrictSlugsFromGeoJsonMock.mockReset();
  getStationSeoRowsMock.mockReset();
  getUtilityLandingDataMock.mockReset();
  getInsightsLandingDataMock.mockReset();
  getDailyMobilityConclusionsMock.mockReset();
  getSeoLandingPageDataMock.mockReset();

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
  getUtilityLandingDataMock.mockResolvedValue({
    indexability: { includeInSitemap: true },
  });
  getInsightsLandingDataMock.mockResolvedValue({
    indexability: { includeInSitemap: true },
  });
  getDailyMobilityConclusionsMock.mockResolvedValue({
    payload: {
      generatedAt: '2026-03-31T10:00:00.000Z',
      sourceFirstDay: '2026-03-01',
      sourceLastDay: '2026-03-31',
      totalHistoricalDays: 31,
      activeStations: 10,
      topStationsByDemand: [{}],
      topDistrictsByDemand: [{}],
      highlights: [{}],
    },
  });
  getSeoLandingPageDataMock.mockImplementation(async (slug: string) => ({
    config: { slug },
    content: {
      generatedAt: '2026-03-25T10:00:00.000Z',
    },
    indexability: {
      includeInSitemap: true,
      canonicalPath: `/${slug}`,
    },
  }));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('sitemap contract', () => {
  it('keeps sitemap entries unique, canonical and aligned with route helpers', async () => {
    fetchStationsMock.mockResolvedValue({
      stations: [
        { id: '101', recordedAt: '2026-03-25T10:00:00.000Z' },
        { id: '102', recordedAt: '2026-03-25T10:05:00.000Z' },
      ],
    });
    fetchAvailableDataMonthsMock.mockResolvedValue({
      months: ['2026-03', '2026-02'],
    });
    getDistrictSeoRowsMock.mockResolvedValue([
      {
        slug: 'centro',
        stationCount: 3,
        topStations: [{ id: '101' }, { id: '102' }],
      },
      {
        slug: 'delicias',
        stationCount: 2,
        topStations: [{ id: '201' }, { id: '202' }],
      },
    ]);
    getStationSeoRowsMock.mockResolvedValue([
      {
        indexability: {
          includeInSitemap: true,
          canonicalPath: '/estaciones/101',
        },
        station: {
          recordedAt: '2026-03-25T10:00:00.000Z',
        },
      },
      {
        indexability: {
          includeInSitemap: true,
          canonicalPath: '/estaciones/102',
        },
        station: {
          recordedAt: '2026-03-25T10:05:00.000Z',
        },
      },
    ]);

    const { default: sitemap } = await import('@/app/sitemap');
    const { INDEXABLE_PUBLIC_ROUTE_REGISTRY, resolveRedirectTarget } = await import('@/lib/routes');

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    const pathnames = urls.map((url) => new URL(url).pathname);

    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.every((url) => url.startsWith(SITE_URL))).toBe(true);

    for (const pathname of pathnames) {
      expect(resolveRedirectTarget(pathname)).toBeNull();
    }

    for (const entry of INDEXABLE_PUBLIC_ROUTE_REGISTRY) {
      expect(pathnames).toContain(entry.href);
    }

    expect(pathnames).toContain('/estaciones/101');
    expect(pathnames).toContain('/estaciones/102');
    expect(pathnames).toContain('/informes/2026-03');
    expect(pathnames).toContain('/informes/2026-02');
    expect(pathnames).toContain('/barrios/centro');
    expect(pathnames).toContain('/barrios/delicias');
    expect(pathnames).not.toContain('/inicio');
    expect(pathnames).not.toContain('/zaragoza/dashboard');
    expect(pathnames).not.toContain('/api/docs');
    expect(pathnames).not.toContain('/dashboard/estaciones/101');
    expect(pathnames).not.toContain('/comparar');
    expect(pathnames).not.toContain('/explorar');
  });
});
