import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SITE_URL = 'https://datosbizi.com';
const {
  fetchAvailableDataMonthsMock,
  fetchHistoryMetadataMock,
  fetchSharedDatasetSnapshotMock,
  fetchStationsMock,
  fetchStatusMock,
  getDailyMobilityConclusionsMock,
  getDistrictSeoRowsMock,
  getDistrictSlugsFromGeoJsonMock,
  getInsightsLandingDataMock,
  getSeoLandingPageDataMock,
  getStationSeoRowsMock,
  getUtilityLandingDataMock,
} = vi.hoisted(() => ({
  fetchAvailableDataMonthsMock: vi.fn(),
  fetchHistoryMetadataMock: vi.fn(),
  fetchSharedDatasetSnapshotMock: vi.fn(),
  fetchStationsMock: vi.fn(),
  fetchStatusMock: vi.fn(),
  getDailyMobilityConclusionsMock: vi.fn(),
  getDistrictSeoRowsMock: vi.fn(),
  getDistrictSlugsFromGeoJsonMock: vi.fn(),
  getInsightsLandingDataMock: vi.fn(),
  getSeoLandingPageDataMock: vi.fn(),
  getStationSeoRowsMock: vi.fn(),
  getUtilityLandingDataMock: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  fetchAvailableDataMonths: fetchAvailableDataMonthsMock,
  fetchHistoryMetadata: fetchHistoryMetadataMock,
  fetchSharedDatasetSnapshot: fetchSharedDatasetSnapshotMock,
  fetchStations: fetchStationsMock,
  fetchStatus: fetchStatusMock,
}));

vi.mock('@/lib/seo-districts', () => ({
  getDistrictSeoRows: getDistrictSeoRowsMock,
  getDistrictSlugsFromGeoJson: getDistrictSlugsFromGeoJsonMock,
}));

vi.mock('@/app/_seo/SeoLandingPage', () => ({
  getSeoLandingPageData: getSeoLandingPageDataMock,
}));

vi.mock('@/lib/acquisition-landings', () => ({
  getInsightsLandingData: getInsightsLandingDataMock,
  getUtilityLandingData: getUtilityLandingDataMock,
}));

vi.mock('@/lib/seo-stations', () => ({
  getStationSeoRows: getStationSeoRowsMock,
}));

vi.mock('@/lib/mobility-conclusions', () => ({
  getDailyMobilityConclusions: getDailyMobilityConclusionsMock,
}));

vi.mock('server-only', () => ({}));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('APP_URL', SITE_URL);
  vi.stubEnv('ROBOTS_BASE_URL', SITE_URL);

  fetchAvailableDataMonthsMock.mockReset();
  fetchHistoryMetadataMock.mockReset();
  fetchSharedDatasetSnapshotMock.mockReset();
  fetchStationsMock.mockReset();
  fetchStatusMock.mockReset();
  getDailyMobilityConclusionsMock.mockReset();
  getDistrictSeoRowsMock.mockReset();
  getDistrictSlugsFromGeoJsonMock.mockReset();
  getInsightsLandingDataMock.mockReset();
  getSeoLandingPageDataMock.mockReset();
  getStationSeoRowsMock.mockReset();
  getUtilityLandingDataMock.mockReset();

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
      freshness: {
        isFresh: true,
        lastUpdated: '2026-03-25T10:00:00.000Z',
      },
      volume: {
        recentStationCount: 10,
        expectedRange: {
          min: 5,
          max: 300,
        },
      },
    },
    pipeline: {
      totalRowsCollected: 1200,
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
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('route registry', () => {
  it('keeps static routes and redirect sources unique and canonical', async () => {
    const {
      CITY_SEGMENTS,
      INDEXABLE_PUBLIC_ROUTE_REGISTRY,
      STATIC_PUBLIC_ROUTE_REGISTRY,
      TOOL_PUBLIC_ROUTE_REGISTRY,
      appRoutes,
      getExactRedirectEntries,
      resolveRedirectTarget,
    } = await import('@/lib/routes');

    const staticHrefs = STATIC_PUBLIC_ROUTE_REGISTRY.map((entry) => entry.href);
    const indexableHrefs = INDEXABLE_PUBLIC_ROUTE_REGISTRY.map((entry) => entry.href);
    const toolHrefs = TOOL_PUBLIC_ROUTE_REGISTRY.map((entry) => entry.href);
    const redirectEntries = getExactRedirectEntries();
    const redirectSources = redirectEntries.map((entry) => entry.source);

    expect(new Set(staticHrefs).size).toBe(staticHrefs.length);
    expect(new Set(redirectSources).size).toBe(redirectSources.length);

    for (const href of indexableHrefs) {
      expect(resolveRedirectTarget(href)).toBeNull();
    }

    expect(toolHrefs).toContain(appRoutes.beta());
    expect(resolveRedirectTarget(appRoutes.beta())).toBe(appRoutes.biciradar());

    for (const entry of redirectEntries) {
      expect(resolveRedirectTarget(entry.source)).toBe(entry.destination);
      expect(resolveRedirectTarget(entry.destination)).toBeNull();
    }

    for (const city of CITY_SEGMENTS) {
      expect(resolveRedirectTarget(appRoutes.cityRootAlias(city))).toBe(appRoutes.dashboard());
      expect(resolveRedirectTarget(appRoutes.cityDashboardAlias(city))).toBe(
        appRoutes.dashboard()
      );
      expect(resolveRedirectTarget(appRoutes.cityExploreAlias(city))).toBe(
        appRoutes.explore()
      );
      expect(resolveRedirectTarget(appRoutes.cityReportsAlias(city))).toBe(
        appRoutes.reports()
      );
      expect(resolveRedirectTarget(appRoutes.cityStatusAlias(city))).toBe(appRoutes.status());
      expect(resolveRedirectTarget(appRoutes.cityHelpAlias(city))).toBe(
        appRoutes.methodology()
      );
      expect(resolveRedirectTarget(appRoutes.cityFlowAlias(city))).toBe(
        appRoutes.dashboardFlow()
      );
    }
  });

  it('builds the sitemap from canonical routes only', async () => {
    fetchStationsMock.mockResolvedValue({
      stations: [
        {
          id: '101',
          recordedAt: '2026-03-25T10:00:00.000Z',
        },
      ],
    });
    fetchAvailableDataMonthsMock.mockResolvedValue({
      months: ['2026-03', '2026-02', 'bad-month'],
    });
    getDistrictSeoRowsMock.mockResolvedValue([
      {
        slug: 'centro',
        stationCount: 2,
        topStations: [{ id: '101' }, { id: '102' }],
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
    ]);

    const { PRIMARY_SEO_PAGE_SLUGS } = await import('@/lib/seo-pages');
    const { appRoutes, INDEXABLE_PUBLIC_ROUTE_REGISTRY } = await import('@/lib/routes');

    getSeoLandingPageDataMock.mockImplementation(async (requestedSlug: string) => ({
      config: {
        slug: requestedSlug,
      },
      content: {
        generatedAt: '2026-03-25T10:00:00.000Z',
      },
      indexability: {
        includeInSitemap: true,
        canonicalPath: appRoutes.seoPage(requestedSlug),
      },
    }));

    const { default: sitemap } = await import('@/app/sitemap');

    const entries = await sitemap();
    const urls = new Set(entries.map((entry) => entry.url));

    for (const entry of INDEXABLE_PUBLIC_ROUTE_REGISTRY) {
      expect(urls.has(`${SITE_URL}${entry.href}`)).toBe(true);
    }

    for (const slug of PRIMARY_SEO_PAGE_SLUGS) {
      expect(urls.has(`${SITE_URL}${appRoutes.seoPage(slug)}`)).toBe(true);
    }

    expect(urls.has(`${SITE_URL}${appRoutes.reportMonth('2026-03')}`)).toBe(true);
    expect(urls.has(`${SITE_URL}${appRoutes.districtDetail('centro')}`)).toBe(true);
    expect(urls.has(`${SITE_URL}${appRoutes.stationDetail('101')}`)).toBe(true);

    expect(urls.has(`${SITE_URL}${appRoutes.homeAlias()}`)).toBe(false);
    expect(urls.has(`${SITE_URL}${appRoutes.cityDashboardAlias('zaragoza')}`)).toBe(
      false
    );
    expect(urls.has(`${SITE_URL}${appRoutes.helpAlias()}`)).toBe(false);
    expect(urls.has(`${SITE_URL}${appRoutes.dashboardView('operations')}`)).toBe(false);
    expect(urls.has(`${SITE_URL}${appRoutes.dashboardStation('101')}`)).toBe(false);
    expect(urls.has(`${SITE_URL}${appRoutes.compare()}`)).toBe(false);
    expect(urls.has(`${SITE_URL}${appRoutes.explore()}`)).toBe(false);
    expect(urls.has(`${SITE_URL}${appRoutes.beta()}`)).toBe(false);
  });
});
