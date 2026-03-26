import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SITE_URL = 'https://datosbizi.com';
const { fetchStationsMock, fetchAvailableDataMonthsMock, getDistrictSeoRowsMock } = vi.hoisted(
  () => ({
    fetchStationsMock: vi.fn(),
    fetchAvailableDataMonthsMock: vi.fn(),
    getDistrictSeoRowsMock: vi.fn(),
  })
);

vi.mock('@/lib/api', () => ({
  fetchStations: fetchStationsMock,
  fetchAvailableDataMonths: fetchAvailableDataMonthsMock,
}));

vi.mock('@/lib/seo-districts', () => ({
  getDistrictSeoRows: getDistrictSeoRowsMock,
}));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('APP_URL', SITE_URL);
  vi.stubEnv('ROBOTS_BASE_URL', SITE_URL);
  fetchStationsMock.mockReset();
  fetchAvailableDataMonthsMock.mockReset();
  getDistrictSeoRowsMock.mockReset();
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
    getDistrictSeoRowsMock.mockResolvedValue([{ slug: 'centro' }, { slug: 'delicias' }]);

    const { default: sitemap } = await import('@/app/sitemap');
    const { STATIC_PUBLIC_ROUTE_REGISTRY, resolveRedirectTarget } = await import('@/lib/routes');

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    const pathnames = urls.map((url) => new URL(url).pathname);

    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.every((url) => url.startsWith(SITE_URL))).toBe(true);

    for (const pathname of pathnames) {
      expect(resolveRedirectTarget(pathname)).toBeNull();
    }

    for (const entry of STATIC_PUBLIC_ROUTE_REGISTRY) {
      expect(pathnames).toContain(entry.href);
    }

    expect(pathnames).toContain('/dashboard/estaciones/101');
    expect(pathnames).toContain('/dashboard/estaciones/102');
    expect(pathnames).toContain('/informes/2026-03');
    expect(pathnames).toContain('/informes/2026-02');
    expect(pathnames).toContain('/barrios/centro');
    expect(pathnames).toContain('/barrios/delicias');
    expect(pathnames).not.toContain('/inicio');
    expect(pathnames).not.toContain('/zaragoza/dashboard');
    expect(pathnames).not.toContain('/api/docs');
  });
});
