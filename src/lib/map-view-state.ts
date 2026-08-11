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

/** Recorta la precision antes de escribir el estado del mapa en la URL. */
export function roundDashboardMapViewState(state: DashboardMapViewState): DashboardMapViewState {
  return {
    latitude: roundCoordinate(state.latitude),
    longitude: roundCoordinate(state.longitude),
    zoom: roundZoom(state.zoom),
  };
}
