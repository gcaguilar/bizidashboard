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

async function getResolvedMetadata(modulePath: string): Promise<Metadata> {
  const pageModule = await import(modulePath);

  if ('metadata' in pageModule && pageModule.metadata) {
    return pageModule.metadata as Metadata;
  }

  if ('generateMetadata' in pageModule && typeof pageModule.generateMetadata === 'function') {
    return pageModule.generateMetadata();
  }

  throw new Error(`No metadata export found for ${modulePath}`);
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
  it(
    'keeps canonical URLs aligned with route helpers on representative pages',
    async () => {
    const { appRoutes, toAbsoluteRouteUrl } = await import('@/lib/routes');
    const compareMetadata = await getResolvedMetadata('@/app/comparar/page');
    const dashboardMetadata = await getResolvedMetadata('@/app/dashboard/page');
    const developersMetadata = await getResolvedMetadata('@/app/developers/page');
    const exploreMetadata = await getResolvedMetadata('@/app/explorar/page');
    const reportsMetadata = await getResolvedMetadata('@/app/informes/page');
    const helpMetadata = await getResolvedMetadata('@/app/dashboard/ayuda/page');
    const statusMetadata = await getResolvedMetadata('@/app/estado/page');
    const flowMetadata = await getResolvedMetadata('@/app/dashboard/flujo/page');
    const conclusionsMetadata = await getResolvedMetadata('@/app/dashboard/conclusiones/page');
    const alertsMetadata = await getResolvedMetadata('@/app/dashboard/alertas/page');
    const stationsMetadata = await getResolvedMetadata('@/app/dashboard/estaciones/page');
    const betaMetadata = await getResolvedMetadata('@/app/beta/page');
    const biciradarMetadata = await getResolvedMetadata('@/app/biciradar/page');

    expect(resolveCanonical(compareMetadata)).toBe(toAbsoluteRouteUrl(appRoutes.compare()));
    expect(resolveCanonical(dashboardMetadata)).toBe(toAbsoluteRouteUrl(appRoutes.dashboard()));
    expect(resolveCanonical(developersMetadata)).toBe(
      toAbsoluteRouteUrl(appRoutes.developers())
    );
    expect(resolveCanonical(exploreMetadata)).toBe(toAbsoluteRouteUrl(appRoutes.explore()));
    expect(resolveCanonical(reportsMetadata)).toBe(toAbsoluteRouteUrl(appRoutes.reports()));
    expect(resolveCanonical(helpMetadata)).toBe(toAbsoluteRouteUrl(appRoutes.dashboardHelp()));
    expect(resolveCanonical(statusMetadata)).toBe(toAbsoluteRouteUrl(appRoutes.status()));
    expect(resolveCanonical(flowMetadata)).toBe(toAbsoluteRouteUrl(appRoutes.dashboardFlow()));
    expect(resolveCanonical(conclusionsMetadata)).toBe(
      toAbsoluteRouteUrl(appRoutes.dashboardConclusions())
    );
    expect(resolveCanonical(alertsMetadata)).toBe(
      toAbsoluteRouteUrl(appRoutes.dashboardAlerts())
    );
    expect(resolveCanonical(stationsMetadata)).toBe(
      toAbsoluteRouteUrl(appRoutes.dashboardStations())
    );
    expect(resolveCanonical(betaMetadata)).toBe(toAbsoluteRouteUrl(appRoutes.biciradar()));
    expect(resolveCanonical(biciradarMetadata)).toBe(
      toAbsoluteRouteUrl(appRoutes.biciradar())
    );
    },
    10_000
  );

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
