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
  const currentSearchParams = new URLSearchParams(currentParams.toString());
  const nextParams = new URLSearchParams();

  for (const key of ['month', 'period', 'rankingTab', 'rankingSearch', 'rankingShowAll']) {
    const value = currentSearchParams.get(key);
    if (value !== null) {
      nextParams.set(key, value);
    }
  }

  nextParams.set('timeWindow', state.activeWindowId);
  nextParams.set('mode', state.viewMode);

  const normalizedStationId = normalizeStationIdValue(state.selectedStationId);

  if (normalizedStationId) {
    nextParams.set('stationId', normalizedStationId);
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
  get: (name: string) => string | null;
  toString: () => string;
};

export function normalizeStationIdValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  let normalized = value.trim();

  while (normalized.length >= 2 && normalized.startsWith('"') && normalized.endsWith('"')) {
    normalized = normalized.slice(1, -1).trim();
  }

  return normalized || null;
}
