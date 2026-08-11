import { z } from 'zod';
import { DASHBOARD_VIEW_MODES, type DashboardViewMode } from '@/lib/dashboard-modes';
import { PERIODS } from '@/app/dashboard/_components/mobility-insights-model';
import { DEFAULT_DASHBOARD_MAP_VIEW, roundDashboardMapViewState, type DashboardMapViewState } from '@/lib/map-view-state';
import { normalizeStationIdValue } from '@/lib/dashboard-url-state';

export const DASHBOARD_TIME_WINDOWS = ['24h', '7d', '30d', '365d'] as const;
export const DASHBOARD_RANKING_TABS = ['turnover', 'availability'] as const;
export const DASHBOARD_BOOLEAN_FILTER_VALUES = ['1', 'true'] as const;
export const DASHBOARD_DENSITIES = ['quick', 'full'] as const;

export type DashboardTimeWindow = (typeof DASHBOARD_TIME_WINDOWS)[number];
export type DashboardRankingTab = (typeof DASHBOARD_RANKING_TABS)[number];

export const dashboardSearchSchema = z.object({
  mode: z.enum(DASHBOARD_VIEW_MODES).optional(),
  stationId: z.coerce.string().trim().min(1).optional(),
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
  density: z.enum(DASHBOARD_DENSITIES).optional(),
});

export type DashboardSearch = z.infer<typeof dashboardSearchSchema>;

export type DashboardClientUrlState = {
  activeWindowId: DashboardTimeWindow;
  viewMode: DashboardViewMode;
  selectedStationId: string;
  searchQuery: string;
  onlyWithBikes: boolean;
  onlyWithAnchors: boolean;
  mapViewState: DashboardMapViewState;
};

export function resolveDashboardMapViewFromSearch(search: DashboardSearch): DashboardMapViewState {
  return {
    latitude: search.mapLat ?? DEFAULT_DASHBOARD_MAP_VIEW.latitude,
    longitude: search.mapLng ?? DEFAULT_DASHBOARD_MAP_VIEW.longitude,
    zoom: search.mapZoom ?? DEFAULT_DASHBOARD_MAP_VIEW.zoom,
  };
}

export function buildDashboardClientSearch(
  prev: DashboardSearch,
  state: DashboardClientUrlState
): DashboardSearch {
  const mapView = roundDashboardMapViewState(state.mapViewState);
  const stationId = normalizeStationIdValue(state.selectedStationId);
  const query = state.searchQuery.trim();

  return {
    ...prev,
    timeWindow: state.activeWindowId,
    mode: state.viewMode,
    stationId: stationId ?? undefined,
    q: query || undefined,
    onlyWithBikes: state.onlyWithBikes ? '1' : undefined,
    onlyWithAnchors: state.onlyWithAnchors ? '1' : undefined,
    mapLat: mapView.latitude,
    mapLng: mapView.longitude,
    mapZoom: mapView.zoom,
  };
}
