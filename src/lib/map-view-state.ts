export type DashboardMapViewState = {
  latitude: number;
  longitude: number;
  zoom: number;
};

export const DEFAULT_DASHBOARD_MAP_VIEW: DashboardMapViewState = {
  latitude: 41.65,
  longitude: -0.88,
  zoom: 12,
};

function roundCoordinate(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function roundZoom(value: number): number {
  return Math.round(value * 10) / 10;
}

export function resolveDashboardMapViewState(searchParams: URLSearchParams | ReadonlyURLSearchParamsLike): DashboardMapViewState {
  const lat = Number(searchParams.get('mapLat'));
  const lng = Number(searchParams.get('mapLng'));
  const zoom = Number(searchParams.get('mapZoom'));

  return {
    latitude: Number.isFinite(lat) && lat >= -90 && lat <= 90 ? lat : DEFAULT_DASHBOARD_MAP_VIEW.latitude,
    longitude: Number.isFinite(lng) && lng >= -180 && lng <= 180 ? lng : DEFAULT_DASHBOARD_MAP_VIEW.longitude,
    zoom: Number.isFinite(zoom) && zoom >= 3 && zoom <= 19 ? zoom : DEFAULT_DASHBOARD_MAP_VIEW.zoom,
  };
}

export function serializeDashboardMapViewState(state: DashboardMapViewState): Record<string, string> {
  return {
    mapLat: String(roundCoordinate(state.latitude)),
    mapLng: String(roundCoordinate(state.longitude)),
    mapZoom: String(roundZoom(state.zoom)),
  };
}

export type ReadonlyURLSearchParamsLike = {
  get(name: string): string | null;
};
