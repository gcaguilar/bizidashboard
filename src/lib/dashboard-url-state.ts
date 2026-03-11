import {
  serializeDashboardMapViewState,
  type DashboardMapViewState,
} from '@/lib/map-view-state';

export type DashboardUrlState = {
  activeWindowId: string;
  viewMode: string;
  selectedStationId: string;
  searchQuery: string;
  onlyWithBikes: boolean;
  onlyWithAnchors: boolean;
  mapViewState: DashboardMapViewState;
};

export function buildDashboardUrlSearchParams(
  currentParams: URLSearchParams | ReadonlyURLSearchParamsLike,
  state: DashboardUrlState
): URLSearchParams {
  const nextParams = new URLSearchParams(currentParams.toString());

  nextParams.set('timeWindow', state.activeWindowId);
  nextParams.set('mode', state.viewMode);

  if (state.selectedStationId) {
    nextParams.set('stationId', state.selectedStationId);
  } else {
    nextParams.delete('stationId');
  }

  const trimmedQuery = state.searchQuery.trim();
  if (trimmedQuery) {
    nextParams.set('q', trimmedQuery);
  } else {
    nextParams.delete('q');
  }

  if (state.onlyWithBikes) {
    nextParams.set('onlyWithBikes', '1');
  } else {
    nextParams.delete('onlyWithBikes');
  }

  if (state.onlyWithAnchors) {
    nextParams.set('onlyWithAnchors', '1');
  } else {
    nextParams.delete('onlyWithAnchors');
  }

  for (const [key, value] of Object.entries(serializeDashboardMapViewState(state.mapViewState))) {
    nextParams.set(key, value);
  }

  return nextParams;
}

export type ReadonlyURLSearchParamsLike = {
  get(name: string): string | null;
  toString(): string;
};
