import type { Metadata } from 'next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SITE_URL = 'https://datosbizi.com';

vi.mock('server-only', () => ({}));

function resolveCanonical(metadata: Metadata): string | null {
  const canonical = metadata.alternates?.canonical;

  if (!canonical) {
    return null;
  }

  if (typeof canonical === 'string') {
    return canonical;
  }

  return canonical.toString();
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('APP_URL', SITE_URL);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('canonical metadata', () => {
  it('keeps canonical URLs aligned with route helpers on representative pages', async () => {
    const { appRoutes, toAbsoluteRouteUrl } = await import('@/lib/routes');
    const comparePage = await import('@/app/comparar/page');
    const dashboardPage = await import('@/app/dashboard/page');
    const developersPage = await import('@/app/developers/page');
    const explorePage = await import('@/app/explorar/page');
    const reportsPage = await import('@/app/informes/page');
    const helpPage = await import('@/app/dashboard/ayuda/page');
    const statusPage = await import('@/app/estado/page');
    const flowPage = await import('@/app/dashboard/flujo/page');
    const conclusionsPage = await import('@/app/dashboard/conclusiones/page');
    const alertsPage = await import('@/app/dashboard/alertas/page');
    const stationsPage = await import('@/app/dashboard/estaciones/page');
    const betaPage = await import('@/app/beta/page');
    const biciradarPage = await import('@/app/biciradar/page');

    expect(resolveCanonical(comparePage.metadata)).toBe(toAbsoluteRouteUrl(appRoutes.compare()));
    expect(resolveCanonical(dashboardPage.metadata)).toBe(toAbsoluteRouteUrl(appRoutes.dashboard()));
    expect(resolveCanonical(developersPage.metadata)).toBe(
      toAbsoluteRouteUrl(appRoutes.developers())
    );
    expect(resolveCanonical(explorePage.metadata)).toBe(toAbsoluteRouteUrl(appRoutes.explore()));
    expect(resolveCanonical(reportsPage.metadata)).toBe(toAbsoluteRouteUrl(appRoutes.reports()));
    expect(resolveCanonical(helpPage.metadata)).toBe(toAbsoluteRouteUrl(appRoutes.dashboardHelp()));
    expect(resolveCanonical(statusPage.metadata)).toBe(toAbsoluteRouteUrl(appRoutes.status()));
    expect(resolveCanonical(flowPage.metadata)).toBe(toAbsoluteRouteUrl(appRoutes.dashboardFlow()));
    expect(resolveCanonical(conclusionsPage.metadata)).toBe(
      toAbsoluteRouteUrl(appRoutes.dashboardConclusions())
    );
    expect(resolveCanonical(alertsPage.metadata)).toBe(
      toAbsoluteRouteUrl(appRoutes.dashboardAlerts())
    );
    expect(resolveCanonical(stationsPage.metadata)).toBe(
      toAbsoluteRouteUrl(appRoutes.dashboardStations())
    );
    expect(resolveCanonical(betaPage.metadata)).toBe(toAbsoluteRouteUrl(appRoutes.beta()));
    expect(resolveCanonical(biciradarPage.metadata)).toBe(
      toAbsoluteRouteUrl(appRoutes.biciradar())
    );
  });

  it('keeps canonical URLs aligned on dynamic pages', async () => {
    const { appRoutes, toAbsoluteRouteUrl } = await import('@/lib/routes');
    const seoPage = await import('@/app/_seo/SeoLandingPage');
    const reportMonthPage = await import('@/app/informes/[month]/page');
    const dashboardModePage = await import('@/app/dashboard/views/[mode]/page');
    const stationDetailPage = await import('@/app/dashboard/estaciones/[stationId]/page');

    const seoMetadata = await seoPage.generateSeoLandingMetadata('uso-bizi-por-hora');
    const reportMonthMetadata = await reportMonthPage.generateMetadata({
      params: Promise.resolve({ month: '2026-03' }),
    });
    const dashboardModeMetadata = await dashboardModePage.generateMetadata({
      params: Promise.resolve({ mode: 'operations' }),
    });
    const stationMetadata = await stationDetailPage.generateMetadata({
      params: Promise.resolve({ stationId: '101' }),
    });

    expect(resolveCanonical(seoMetadata)).toBe(
      toAbsoluteRouteUrl(appRoutes.seoPage('uso-bizi-por-hora'))
    );
    expect(resolveCanonical(reportMonthMetadata)).toBe(
      toAbsoluteRouteUrl(appRoutes.reportMonth('2026-03'))
    );
    expect(resolveCanonical(dashboardModeMetadata)).toBe(
      toAbsoluteRouteUrl(appRoutes.dashboardView('operations'))
    );
    expect(resolveCanonical(stationMetadata)).toBe(
      toAbsoluteRouteUrl(appRoutes.dashboardStation('101'))
    );
  });
});
