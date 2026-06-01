import { z } from 'zod';
import { DASHBOARD_VIEW_MODES, resolveDashboardViewMode, type DashboardViewMode } from '@/lib/dashboard-modes';
import { PERIODS } from '@/app/dashboard/_components/mobility-insights-model';
import { DEFAULT_DASHBOARD_MAP_VIEW, type DashboardMapViewState } from '@/lib/map-view-state';
import { normalizeStationIdValue } from '@/lib/dashboard-url-state';

export const DASHBOARD_TIME_WINDOWS = ['24h', '7d', '30d', '365d'] as const;
export const DASHBOARD_RANKING_TABS = ['turnover', 'availability'] as const;
export const DASHBOARD_BOOLEAN_FILTER_VALUES = ['1', 'true'] as const;

export const dashboardSearchSchema = z.object({
  mode: z.enum(DASHBOARD_VIEW_MODES).optional(),
  stationId: z.string().trim().min(1).optional(),
  q: z.string().trim().max(120).optional(),
  timeWindow: z.enum(DASHBOARD_TIME_WINDOWS).optional(),
  onlyWithBikes: z.enum(DASHBOARD_BOOLEAN_FILTER_VALUES).optional(),
  onlyWithAnchors: z.enum(DASHBOARD_BOOLEAN_FILTER_VALUES).optional(),
  mapLat: z.coerce.number().min(-90).max(90).optional(),
  mapLng: z.coerce.number().min(-180).max(180).optional(),
  mapZoom: z.coerce.number().min(3).max(19).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  period: z.enum(PERIODS.map((period => period.key)) as [string, ...string[]]).optional(),
  rankingTab: z.enum(DASHBOARD_RANKING_TABS).optional(),
  rankingSearch: z.string().trim().max(120).optional(),
  rankingShowAll: z.enum(['1']).optional(),
});

export type DashboardSearch = z.infer<typeof dashboardSearchSchema>;

export type DashboardClientSearchState = {
  mode: DashboardViewMode;
  stationId: string | null;
  q: string;
  timeWindow: (typeof DASHBOARD_TIME_WINDOWS)[number];
  onlyWithBikes: boolean;
  onlyWithAnchors: boolean;
  mapViewState: DashboardMapViewState;
  month: string | null;
};

export type DashboardRankingSearchState = {
  tab: (typeof DASHBOARD_RANKING_TABS)[number];
  search: string;
  showAll: boolean;
};

export type DashboardMonthPeriodSearchState = {
  month: string | null;
  period: (typeof PERIODS)[number]['key'];
};

export function parseDashboardClientSearch(
  params: URLSearchParams | { get: (name: string) => string | null }
): DashboardClientSearchState {
  const mode = dashboardSearchSchema.shape.mode.safeParse(params.get('mode') ?? undefined);
  const stationId = dashboardSearchSchema.shape.stationId.safeParse(params.get('stationId') ?? undefined);
  const q = dashboardSearchSchema.shape.q.safeParse(params.get('q') ?? undefined);
  const timeWindow = dashboardSearchSchema.shape.timeWindow.safeParse(params.get('timeWindow') ?? undefined);
  const onlyWithBikes = dashboardSearchSchema.shape.onlyWithBikes.safeParse(params.get('onlyWithBikes') ?? undefined);
  const onlyWithAnchors = dashboardSearchSchema.shape.onlyWithAnchors.safeParse(params.get('onlyWithAnchors') ?? undefined);
  const mapLat = dashboardSearchSchema.shape.mapLat.safeParse(params.get('mapLat') ?? undefined);
  const mapLng = dashboardSearchSchema.shape.mapLng.safeParse(params.get('mapLng') ?? undefined);
  const mapZoom = dashboardSearchSchema.shape.mapZoom.safeParse(params.get('mapZoom') ?? undefined);
  const month = dashboardSearchSchema.shape.month.safeParse(params.get('month') ?? undefined);

  return {
    mode: resolveDashboardViewMode(mode.success ? mode.data : undefined),
    stationId: stationId.success ? normalizeStationIdValue(stationId.data) : null,
    q: q.success ? q.data ?? '' : '',
    timeWindow: timeWindow.success ? timeWindow.data ?? '30d' : '30d',
    onlyWithBikes: onlyWithBikes.success ? Boolean(onlyWithBikes.data) : false,
    onlyWithAnchors: onlyWithAnchors.success ? Boolean(onlyWithAnchors.data) : false,
    mapViewState: {
      latitude: mapLat.success ? mapLat.data ?? DEFAULT_DASHBOARD_MAP_VIEW.latitude : DEFAULT_DASHBOARD_MAP_VIEW.latitude,
      longitude: mapLng.success ? mapLng.data ?? DEFAULT_DASHBOARD_MAP_VIEW.longitude : DEFAULT_DASHBOARD_MAP_VIEW.longitude,
      zoom: mapZoom.success ? mapZoom.data ?? DEFAULT_DASHBOARD_MAP_VIEW.zoom : DEFAULT_DASHBOARD_MAP_VIEW.zoom,
    },
    month: month.success ? month.data ?? null : null,
  };
}

export function parseDashboardRankingSearch(
  params: URLSearchParams | { get: (name: string) => string | null }
): DashboardRankingSearchState {
  const rankingTab = dashboardSearchSchema.shape.rankingTab.safeParse(params.get('rankingTab') ?? undefined);
  const rankingSearch = dashboardSearchSchema.shape.rankingSearch.safeParse(params.get('rankingSearch') ?? undefined);
  const rankingShowAll = dashboardSearchSchema.shape.rankingShowAll.safeParse(params.get('rankingShowAll') ?? undefined);

  return {
    tab: rankingTab.success ? rankingTab.data ?? 'availability' : 'availability',
    search: rankingSearch.success ? rankingSearch.data ?? '' : '',
    showAll: rankingShowAll.success ? rankingShowAll.data === '1' : false,
  };
}

export function parseDashboardMonthPeriodSearch(
  params: URLSearchParams | { get: (name: string) => string | null }
): DashboardMonthPeriodSearchState {
  const month = dashboardSearchSchema.shape.month.safeParse(params.get('month') ?? undefined);
  const period = dashboardSearchSchema.shape.period.safeParse(params.get('period') ?? undefined);

  return {
    month: month.success ? month.data ?? null : null,
    period: period.success ? (period.data ?? 'all') as DashboardMonthPeriodSearchState['period'] : 'all',
  };
}
