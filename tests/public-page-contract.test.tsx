import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const SITE_URL = 'https://datosbizi.com';

const {
  publicSectionNavSpy,
  trackedLinkSpy,
  getStationSeoPageDataMock,
  getDistrictSeoRowBySlugMock,
  getDistrictSeoRowsMock,
  fetchAvailableDataMonthsMock,
  fetchSharedDatasetSnapshotMock,
  fetchHistoryMetadataMock,
  fetchStatusMock,
  fetchCachedMonthlyDemandCurveMock,
  getDailyMobilityConclusionsMock,
} = vi.hoisted(() => ({
  publicSectionNavSpy: vi.fn(),
  trackedLinkSpy: vi.fn(),
  getStationSeoPageDataMock: vi.fn(),
  getDistrictSeoRowBySlugMock: vi.fn(),
  getDistrictSeoRowsMock: vi.fn(),
  fetchAvailableDataMonthsMock: vi.fn(),
  fetchSharedDatasetSnapshotMock: vi.fn(),
  fetchHistoryMetadataMock: vi.fn(),
  fetchStatusMock: vi.fn(),
  fetchCachedMonthlyDemandCurveMock: vi.fn(),
  getDailyMobilityConclusionsMock: vi.fn(),
}));

vi.mock('server-only', () => ({}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/explorar',
  notFound: () => {
    throw new Error('notFound');
  },
}));

vi.mock('@/app/_components/PublicSectionNav', () => ({
  PublicSectionNav: ({
    activeItemId,
    className,
  }: {
    activeItemId: string;
    className?: string;
  }) => {
    publicSectionNavSpy({ activeItemId, className });
    return <div data-active-item-id={activeItemId} data-class-name={className ?? ''} />;
  },
}));

vi.mock('@/app/_components/TrackedLink', () => ({
  TrackedLink: ({
    children,
    href,
    ctaEvent,
    navigationEvent,
    entitySelectEvent,
    eventName,
    eventData,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    ctaEvent?: unknown;
    navigationEvent?: unknown;
    entitySelectEvent?: unknown;
    eventName?: string;
    eventData?: Record<string, unknown>;
    className?: string;
  }) => {
    trackedLinkSpy({
      href,
      ctaEvent,
      navigationEvent,
      entitySelectEvent,
      eventName,
      eventData,
      className,
    });
    return <a href={href}>{children}</a>;
  },
}));

vi.mock('@/app/_components/PublicPageViewTracker', () => ({
  PublicPageViewTracker: () => null,
}));

vi.mock('@/app/_components/SiteBreadcrumbs', () => ({
  SiteBreadcrumbs: () => null,
}));

vi.mock('@/app/_components/DataStateNotice', () => ({
  DataStateNotice: () => null,
}));

vi.mock('@/lib/seo-stations', () => ({
  getStationSeoPageData: getStationSeoPageDataMock,
}));

vi.mock('@/lib/seo-districts', async () => {
  const actual = await vi.importActual<typeof import('@/lib/seo-districts')>('@/lib/seo-districts');

  return {
    ...actual,
    getDistrictSeoRowBySlug: getDistrictSeoRowBySlugMock,
    getDistrictSeoRows: getDistrictSeoRowsMock,
    getDistrictSlugsFromGeoJson: vi.fn().mockResolvedValue(['centro']),
  };
});

vi.mock('@/lib/api', () => ({
  fetchAvailableDataMonths: fetchAvailableDataMonthsMock,
  fetchSharedDatasetSnapshot: fetchSharedDatasetSnapshotMock,
  fetchHistoryMetadata: fetchHistoryMetadataMock,
  fetchStatus: fetchStatusMock,
  fetchStations: vi.fn(),
  fetchRankings: vi.fn(),
}));

vi.mock('@/lib/analytics-series', () => ({
  fetchCachedMonthlyDemandCurve: fetchCachedMonthlyDemandCurveMock,
  fetchCachedDailyDemandCurve: vi.fn(),
  fetchCachedSystemHourlyProfile: vi.fn(),
}));

vi.mock('@/lib/mobility-conclusions', () => ({
  getDailyMobilityConclusions: getDailyMobilityConclusionsMock,
}));

function getTrackedLinkCallByHref(href: string) {
  const call = trackedLinkSpy.mock.calls.find(([props]) => {
    return props.href === href;
  });

  return call?.[0] as Record<string, unknown> | undefined;
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('APP_URL', SITE_URL);

  publicSectionNavSpy.mockClear();
  trackedLinkSpy.mockClear();
  getStationSeoPageDataMock.mockReset();
  getDistrictSeoRowBySlugMock.mockReset();
  getDistrictSeoRowsMock.mockReset();
  fetchAvailableDataMonthsMock.mockReset();
  fetchSharedDatasetSnapshotMock.mockReset();
  fetchHistoryMetadataMock.mockReset();
  fetchStatusMock.mockReset();
  fetchCachedMonthlyDemandCurveMock.mockReset();
  getDailyMobilityConclusionsMock.mockReset();

  fetchAvailableDataMonthsMock.mockResolvedValue({
    months: ['2026-03', '2026-02'],
    generatedAt: '2026-03-31T10:00:00.000Z',
  });
  fetchSharedDatasetSnapshotMock.mockResolvedValue({
    coverage: { totalDays: 90 },
    lastUpdated: { lastSampleAt: '2026-03-31T10:00:00.000Z' },
    dataState: 'fresh',
  });
  fetchHistoryMetadataMock.mockResolvedValue({
    coverage: { lastRecordedAt: '2026-03-31T10:00:00.000Z' },
  });
  fetchStatusMock.mockResolvedValue({
    pipeline: { lastSuccessfulPoll: '2026-03-31T10:00:00.000Z' },
  });
  fetchCachedMonthlyDemandCurveMock.mockResolvedValue([
    { monthKey: '2026-03', activeStations: 42, estimatedTrips: 1200 },
    { monthKey: '2026-02', activeStations: 40, estimatedTrips: 1100 },
  ]);
  getDailyMobilityConclusionsMock.mockResolvedValue({
    payload: {
      dateKey: '2026-03-31',
      generatedAt: '2026-03-31T10:00:00.000Z',
      selectedMonth: '2026-03',
      sourceFirstDay: '2026-03-01',
      sourceLastDay: '2026-03-31',
      totalHistoricalDays: 31,
      stationsWithData: 42,
      activeStations: 42,
      metrics: {
        demandLast7Days: 1200,
        demandPrevious7Days: 1000,
        demandDeltaRatio: 0.2,
        occupancyLast7Days: 0.61,
        occupancyPrevious7Days: 0.56,
        occupancyDeltaRatio: 0.05,
      },
      summary: 'Resumen mensual de prueba.',
      highlights: [],
      recommendations: [],
      peakDemandHours: [],
      topDistrictsByDemand: [],
      topStationsByDemand: [],
      leastUsedStations: [],
      weekdayWeekendProfile: {
        weekday: { avgDemand: 20.4, avgOccupancy: 0.63, daysCount: 22 },
        weekend: { avgDemand: 14.2, avgOccupancy: 0.52, daysCount: 9 },
        demandGapRatio: 0.12,
        dominantPeriod: 'weekday',
      },
    },
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('public page contract', () => {
  it('keeps explore active on station and district detail pages', async () => {
    getStationSeoPageDataMock.mockResolvedValue({
      summary: {
        station: {
          id: '101',
          name: 'Plaza Espana',
          bikesAvailable: 7,
          anchorsFree: 5,
          capacity: 12,
        },
        districtName: 'Centro',
        districtSlug: 'centro',
        currentOccupancy: 0.58,
        cityAverageOccupancy: 0.5,
        turnover: { totalHours: 120, turnoverScore: 1.9 },
        availability: { totalHours: 120, problemHours: 2.1 },
      },
      predictions: {
        predictions: [
          { horizonMinutes: 15, predictedBikesAvailable: 6, confidence: 0.82 },
        ],
      },
      relatedStations: [],
      highOccupancySlots: [{ dayType: 'WEEKDAY', hour: 8, occupancyAvg: 0.76, sampleCount: 12 }],
      lowOccupancySlots: [{ dayType: 'WEEKEND', hour: 20, occupancyAvg: 0.22, sampleCount: 8 }],
    });
    getDistrictSeoRowBySlugMock.mockResolvedValue({
      slug: 'centro',
      name: 'Centro',
      stationCount: 4,
      bikesAvailable: 18,
      avgTurnover: 1.7,
      avgAvailabilityRisk: 0.8,
      capacity: 40,
      topStations: [
        {
          stationId: '101',
          stationName: 'Plaza Espana',
          bikesAvailable: 7,
          anchorsFree: 5,
          capacity: 12,
          turnoverScore: 1.9,
        },
      ],
    });
    getDistrictSeoRowsMock.mockResolvedValue([
      {
        slug: 'centro',
        name: 'Centro',
        stationCount: 4,
        bikesAvailable: 18,
        avgTurnover: 1.7,
        avgAvailabilityRisk: 0.8,
        capacity: 40,
        topStations: [],
      },
      {
        slug: 'delicias',
        name: 'Delicias',
        stationCount: 3,
        bikesAvailable: 11,
        avgTurnover: 1.3,
        avgAvailabilityRisk: 0.6,
        capacity: 28,
        topStations: [],
      },
    ]);

    const stationPage = await import('@/app/estaciones/[stationId]/page');
    const districtPage = await import('@/app/barrios/[districtSlug]/page');

    renderToStaticMarkup(
      await stationPage.default({ params: Promise.resolve({ stationId: '101' }) })
    );
    renderToStaticMarkup(
      await districtPage.default({ params: Promise.resolve({ districtSlug: 'centro' }) })
    );

    expect(publicSectionNavSpy).toHaveBeenCalledWith(
      expect.objectContaining({ activeItemId: 'explore' })
    );
    expect(publicSectionNavSpy).toHaveBeenCalledTimes(2);
    expect(trackedLinkSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        href: '/estaciones/101',
        entitySelectEvent: {
          source: 'district_top_stations',
          entityType: 'station',
        },
      })
    );
  });

  it('keeps reports active on report archive and monthly report pages', async () => {
    const reportsPage = await import('@/app/informes/page');
    const monthlyReportPage = await import('@/app/informes/[month]/page');

    renderToStaticMarkup(await reportsPage.default());
    renderToStaticMarkup(
      await monthlyReportPage.default({ params: Promise.resolve({ month: '2026-03' }) })
    );

    expect(publicSectionNavSpy).toHaveBeenCalledWith(
      expect.objectContaining({ activeItemId: 'reports' })
    );
    expect(publicSectionNavSpy).toHaveBeenCalledTimes(2);
  });

  it('aligns seo landing hero CTA telemetry for dashboard transitions', async () => {
    getDistrictSeoRowsMock.mockResolvedValue([
      {
        slug: 'centro',
        name: 'Centro',
        stationCount: 4,
        bikesAvailable: 18,
        avgTurnover: 1.7,
      },
    ]);

    const { renderSeoLandingPage } = await import('@/app/_seo/SeoLandingPage');
    const { appRoutes } = await import('@/lib/routes');

    renderToStaticMarkup(await renderSeoLandingPage('barrios-bizi-zaragoza'));

    const heroCta = getTrackedLinkCallByHref(appRoutes.dashboardFlow());

    expect(heroCta?.ctaEvent).toEqual({
      source: 'seo_landing_hero',
      ctaId: 'seo_primary',
      destination: 'dashboard_flow',
      sourceRole: 'hub',
      destinationRole: 'dashboard',
      transitionKind: 'to_dashboard',
    });
  });

  it('aligns seo landing hero CTA telemetry for public-only transitions', async () => {
    const { renderSeoLandingPage } = await import('@/app/_seo/SeoLandingPage');
    const { appRoutes } = await import('@/lib/routes');

    renderToStaticMarkup(await renderSeoLandingPage('viajes-por-mes-zaragoza'));

    const heroCta = getTrackedLinkCallByHref(appRoutes.reports());

    expect(heroCta?.ctaEvent).toEqual({
      source: 'seo_landing_hero',
      ctaId: 'seo_primary',
      destination: 'report_archive',
      sourceRole: 'entry_seo',
      destinationRole: 'hub',
      transitionKind: 'within_public',
    });
  });

  it('uses explicit station entity selection tracking on report cards', async () => {
    getDailyMobilityConclusionsMock.mockResolvedValue({
      payload: {
        dateKey: '2026-03-31',
        generatedAt: '2026-03-31T10:00:00.000Z',
        selectedMonth: '2026-03',
        sourceFirstDay: '2026-03-01',
        sourceLastDay: '2026-03-31',
        totalHistoricalDays: 31,
        stationsWithData: 42,
        activeStations: 42,
        metrics: {
          demandLast7Days: 1200,
          demandPrevious7Days: 1000,
          demandDeltaRatio: 0.2,
          occupancyLast7Days: 0.61,
          occupancyPrevious7Days: 0.56,
          occupancyDeltaRatio: 0.05,
        },
        summary: 'Resumen mensual de prueba.',
        highlights: [],
        recommendations: [],
        peakDemandHours: [],
        topDistrictsByDemand: [],
        topStationsByDemand: [
          { stationId: '101', stationName: 'Plaza Espana', avgDemand: 17.4 },
        ],
        leastUsedStations: [],
        weekdayWeekendProfile: {
          weekday: { avgDemand: 20.4, avgOccupancy: 0.63, daysCount: 22 },
          weekend: { avgDemand: 14.2, avgOccupancy: 0.52, daysCount: 9 },
          demandGapRatio: 0.12,
          dominantPeriod: 'weekday',
        },
      },
    });

    const monthlyReportPage = await import('@/app/informes/[month]/page');

    renderToStaticMarkup(
      await monthlyReportPage.default({ params: Promise.resolve({ month: '2026-03' }) })
    );

    expect(trackedLinkSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        href: '/estaciones/101',
        entitySelectEvent: {
          source: 'monthly_report_top_stations',
          entityType: 'station',
        },
      })
    );
  });
});
