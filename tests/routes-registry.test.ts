import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SITE_URL = 'https://datosbizi.com';
const { fetchStationsMock, fetchAvailableDataMonthsMock, getDistrictSeoRowsMock, getDistrictSlugsFromGeoJsonMock } = vi.hoisted(
  () => ({
    fetchStationsMock: vi.fn(),
    fetchAvailableDataMonthsMock: vi.fn(),
    getDistrictSeoRowsMock: vi.fn(),
    getDistrictSlugsFromGeoJsonMock: vi.fn(),
  })
);

vi.mock('@/lib/api', () => ({
  fetchStations: fetchStationsMock,
  fetchAvailableDataMonths: fetchAvailableDataMonthsMock,
}));

vi.mock('@/lib/seo-districts', () => ({
  getDistrictSeoRows: getDistrictSeoRowsMock,
  getDistrictSlugsFromGeoJson: getDistrictSlugsFromGeoJsonMock,
}));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('APP_URL', SITE_URL);
  vi.stubEnv('ROBOTS_BASE_URL', SITE_URL);
  fetchStationsMock.mockReset();
  fetchAvailableDataMonthsMock.mockReset();
  getDistrictSeoRowsMock.mockReset();
  getDistrictSlugsFromGeoJsonMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('route registry', () => {
  it('keeps static routes and redirect sources unique and canonical', async () => {
    const {
      CITY_SEGMENTS,
      STATIC_PUBLIC_ROUTE_REGISTRY,
      appRoutes,
      getExactRedirectEntries,
      resolveRedirectTarget,
    } = await import('@/lib/routes');

    const staticHrefs = STATIC_PUBLIC_ROUTE_REGISTRY.map((entry) => entry.href);
    const redirectEntries = getExactRedirectEntries();
    const redirectSources = redirectEntries.map((entry) => entry.source);

    expect(new Set(staticHrefs).size).toBe(staticHrefs.length);
    expect(new Set(redirectSources).size).toBe(redirectSources.length);

    for (const href of staticHrefs) {
      expect(resolveRedirectTarget(href)).toBeNull();
    }

    for (const entry of redirectEntries) {
      expect(resolveRedirectTarget(entry.source)).toBe(entry.destination);
      expect(resolveRedirectTarget(entry.destination)).toBeNull();
    }

    for (const city of CITY_SEGMENTS) {
      expect(resolveRedirectTarget(appRoutes.cityRootAlias(city))).toBe(appRoutes.dashboard());
      expect(resolveRedirectTarget(appRoutes.cityDashboardAlias(city))).toBe(appRoutes.dashboard());
      expect(resolveRedirectTarget(appRoutes.cityExploreAlias(city))).toBe(appRoutes.explore());
      expect(resolveRedirectTarget(appRoutes.cityReportsAlias(city))).toBe(appRoutes.reports());
      expect(resolveRedirectTarget(appRoutes.cityStatusAlias(city))).toBe(appRoutes.status());
      expect(resolveRedirectTarget(appRoutes.cityHelpAlias(city))).toBe(appRoutes.dashboardHelp());
      expect(resolveRedirectTarget(appRoutes.cityFlowAlias(city))).toBe(appRoutes.dashboardFlow());
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
    getDistrictSlugsFromGeoJsonMock.mockResolvedValue(['centro']);

    const { DASHBOARD_VIEW_MODES } = await import('@/lib/dashboard-modes');
    const { appRoutes, STATIC_PUBLIC_ROUTE_REGISTRY } = await import('@/lib/routes');
    const { SEO_PAGE_SLUGS } = await import('@/lib/seo-pages');
    const { default: sitemap } = await import('@/app/sitemap');

    const entries = await sitemap();
    const urls = new Set(entries.map((entry) => entry.url));

    for (const entry of STATIC_PUBLIC_ROUTE_REGISTRY) {
      expect(urls.has(`${SITE_URL}${entry.href}`)).toBe(true);
    }

    for (const mode of DASHBOARD_VIEW_MODES) {
      expect(urls.has(`${SITE_URL}${appRoutes.dashboardView(mode)}`)).toBe(true);
    }

    for (const slug of SEO_PAGE_SLUGS) {
      expect(urls.has(`${SITE_URL}${appRoutes.seoPage(slug)}`)).toBe(true);
    }

    expect(urls.has(`${SITE_URL}${appRoutes.dashboardStation('101')}`)).toBe(true);
    expect(urls.has(`${SITE_URL}${appRoutes.reportMonth('2026-03')}`)).toBe(true);
    expect(urls.has(`${SITE_URL}${appRoutes.districtDetail('centro')}`)).toBe(true);

    expect(urls.has(`${SITE_URL}${appRoutes.homeAlias()}`)).toBe(false);
    expect(urls.has(`${SITE_URL}${appRoutes.cityDashboardAlias('zaragoza')}`)).toBe(false);
    expect(urls.has(`${SITE_URL}${appRoutes.helpAlias()}`)).toBe(false);
  });
});
