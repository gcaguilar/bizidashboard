'use client';
import { lazy, Suspense, useCallback, useEffect, useMemo, Component, type ReactNode } from 'react';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { DataStateNotice } from '@/app/_components/DataStateNotice';
import type {
  AlertsResponse,
  RankingsResponse,
  SharedDatasetSnapshot,
  StationsResponse,
  StatusResponse,
} from '@/lib/api-types';

import { combineDataStates, shouldShowDataStateNotice } from '@/lib/data-state';
import { formatStatusDateTime } from '@/lib/system-status';
import {
  buildStationDistrictMap,
  districtCollectionQueryOptions,
} from '@/lib/districts';
import { formatDistanceMeters, haversineDistanceMeters } from '@/lib/geo';
import { resolveDashboardViewMode, type DashboardViewMode } from '@/lib/dashboard-modes';
import { normalizeStationIdValue } from '@/lib/dashboard-url-state';
import {
  buildDashboardClientSearch,
  resolveDashboardMapViewFromSearch,
  type DashboardClientUrlState,
  type DashboardSearch,
} from '@/lib/dashboard-search';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { appRoutes } from '@/lib/routes';
import { DashboardLayout } from './DashboardLayout';
import { DashboardHeader } from './DashboardHeader';
import { ModeIntroBanner } from './ModeIntroBanner';
import { DashboardQuickLinks } from './DashboardQuickLinks';
import { ModeHeader } from './ModeHeader';
import { QuickHeader } from './QuickHeader';
import { QuickOverviewView } from './QuickOverviewView';
import { useDashboardDensity } from './useDashboardDensity';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useSystemMetrics } from './useSystemMetrics';
import { type DashboardMapViewState } from '@/lib/map-view-state';
import {
  buildDashboardModeChangeEvent,
  buildEntitySelectEvent,
  buildFilterChangeEvent,
  trackUmamiEvent,
} from '@/lib/umami';
import { DashboardPageViewTracker } from './DashboardPageViewTracker';
import { EMPTY_MOBILITY_PREVIEW, mobilityQueryOptions } from './mobility-api';
import { REFRESH_AFTER_LAST_DATA_MS, useDashboardLiveData } from './useDashboardLiveData';
import { useFavoriteStations } from './useFavoriteStations';
import { useGeolocationWatch } from './useGeolocationWatch';
import { useStationTrends } from './useStationTrends';

class ViewErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const OverviewModeView = lazy(() => import('./OverviewModeView').then(m => ({ default: m.OverviewModeView })));
const OperationsModeView = lazy(() => import('./OperationsModeView').then(m => ({ default: m.OperationsModeView })));
const ResearchModeView = lazy(() => import('./ResearchModeView').then(m => ({ default: m.ResearchModeView })));
const DataModeView = lazy(() => import('./DataModeView').then(m => ({ default: m.DataModeView })));

const CURRENT_YEAR = new Date().getFullYear();

const dashboardRouteApi = getRouteApi('/dashboard/');

export type DashboardInitialData = {
  dataset: SharedDatasetSnapshot;
  stations: StationsResponse;
  status: StatusResponse;
  alerts: AlertsResponse;
  rankings: {
    turnover: RankingsResponse;
    availability: RankingsResponse;
  };
};

type DashboardClientProps = {
  initialData: DashboardInitialData;
};

type TimeWindow = {
  id: DashboardClientUrlState['activeWindowId'];
  label: string;
  mobilityDays: number;
  demandDays: number;
};

const TIME_WINDOWS: TimeWindow[] = [
  { id: '24h', label: 'Últimas 24h', mobilityDays: 1, demandDays: 7 },
  { id: '7d', label: '7 dias', mobilityDays: 7, demandDays: 14 },
  { id: '30d', label: 'Mes', mobilityDays: 30, demandDays: 30 },
  { id: '365d', label: 'Anual', mobilityDays: 365, demandDays: 365 },
];

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function resolveStationId(stations: StationsResponse['stations'], value: string | null): string {
  const normalizedValue = value?.trim().replace(/^"(.+)"$/, '$1') ?? null;

  if (normalizedValue && stations.some((station) => station.id === normalizedValue)) {
    return normalizedValue;
  }

  return stations[0]?.id ?? '';
}

function isSameDashboardSearch(a: DashboardSearch, b: DashboardSearch): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof DashboardSearch>;

  for (const key of keys) {
    if (a[key] !== b[key]) {
      return false;
    }
  }

  return true;
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const dashboardRouteKey = 'dashboard_home';
  const navigate = useNavigate({ from: '/dashboard/' });
  const search = dashboardRouteApi.useSearch();
  const parsedSearch = useMemo(
    () => ({
      mode: resolveDashboardViewMode(search.mode),
      stationId: normalizeStationIdValue(search.stationId ?? null),
      q: search.q ?? '',
      timeWindow: search.timeWindow ?? ('30d' as const),
      onlyWithBikes: Boolean(search.onlyWithBikes),
      onlyWithAnchors: Boolean(search.onlyWithAnchors),
      mapViewState: resolveDashboardMapViewFromSearch(search),
      month: search.month ?? null,
    }),
    [search]
  );

  const {
    data: liveData,
    isRefreshing: isRefreshingData,
    nextRefreshAt,
  } = useDashboardLiveData(initialData);
  const stationsData = liveData.stations;
  const statusData = liveData.status;
  const alertsData = liveData.alerts;
  const rankingsData = liveData.rankings;

  // La URL es la única fuente de verdad del estado de UI; se escribe vía updateUrlState.
  const viewMode = parsedSearch.mode;
  const searchQuery = parsedSearch.q;
  const activeWindowId = parsedSearch.timeWindow;
  const onlyWithBikes = parsedSearch.onlyWithBikes;
  const onlyWithAnchors = parsedSearch.onlyWithAnchors;
  const mapViewState = parsedSearch.mapViewState;

  const { favoriteStationIds, toggleFavoriteStation } = useFavoriteStations();
  const { stationTrendById, recentSnapshots } = useStationTrends(stationsData);
  const { userLocation, geolocationError, isGeolocationEnabled, enableGeolocation } =
    useGeolocationWatch();

  const { density, setDensity } = useDashboardDensity();
  const showFull = density === 'full';

  const filteredStations = useMemo(() => {
    return stationsData.stations.filter((station) => {
      if (onlyWithBikes && station.bikesAvailable <= 0) {
        return false;
      }

      if (onlyWithAnchors && station.anchorsFree <= 0) {
        return false;
      }

      return true;
    });
  }, [onlyWithAnchors, onlyWithBikes, stationsData.stations]);

  const activeWindow =
    TIME_WINDOWS.find((window) => window.id === activeWindowId) ?? TIME_WINDOWS[1];

  const selectedStationId = useMemo(() => {
    if (filteredStations.length === 0) {
      return '';
    }

    const resolved = resolveStationId(stationsData.stations, parsedSearch.stationId);

    if (filteredStations.some((station) => station.id === resolved)) {
      return resolved;
    }

    return filteredStations[0]?.id ?? '';
  }, [filteredStations, parsedSearch.stationId, stationsData.stations]);

  const selectedStation = useMemo(() => {
    if (filteredStations.length === 0) {
      return null;
    }

    return filteredStations.find((station) => station.id === selectedStationId) ?? filteredStations[0];
  }, [filteredStations, selectedStationId]);

  const shouldLoadDistricts = searchQuery.trim().length > 0;

  const districtsQuery = useQuery({
    ...districtCollectionQueryOptions,
    enabled: shouldLoadDistricts,
  });
  const districts = districtsQuery.data ?? null;

  useEffect(() => {
    if (districtsQuery.error) {
      captureExceptionWithContext(districtsQuery.error, {
        area: 'dashboard.client',
        operation: 'loadDistrictsForSearch',
        extra: {
          searchQuery,
        },
      });
    }
  }, [districtsQuery.error, searchQuery]);

  const stationDistrictMap = useMemo(() => {
    if (!districts) {
      return new Map<string, string>();
    }

    return buildStationDistrictMap(stationsData.stations, districts);
  }, [districts, stationsData.stations]);

  const nearestStation = useMemo(() => {
    if (!userLocation || stationsData.stations.length === 0) {
      return null;
    }

    let bestMatch: { stationId: string; distanceMeters: number } | null = null;

    for (const station of stationsData.stations) {
      if (!Number.isFinite(station.lat) || !Number.isFinite(station.lon)) {
        continue;
      }

      const distanceMeters = haversineDistanceMeters(userLocation, {
        latitude: station.lat,
        longitude: station.lon,
      });

      if (!bestMatch || distanceMeters < bestMatch.distanceMeters) {
        bestMatch = {
          stationId: station.id,
          distanceMeters,
        };
      }
    }

    return bestMatch;
  }, [stationsData.stations, userLocation]);

  const updateUrlState = useCallback(
    (partial: Partial<DashboardClientUrlState>) => {
      void navigate({
        replace: true,
        search: (prev) => {
          const next = buildDashboardClientSearch(prev, {
            activeWindowId,
            viewMode,
            selectedStationId,
            searchQuery,
            onlyWithBikes,
            onlyWithAnchors,
            mapViewState,
            ...partial,
          });

          return isSameDashboardSearch(prev, next) ? prev : next;
        },
      });
    },
    [
      activeWindowId,
      mapViewState,
      navigate,
      onlyWithAnchors,
      onlyWithBikes,
      searchQuery,
      selectedStationId,
      viewMode,
    ]
  );

  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    const query = normalizeText(searchQuery);
    const sourceStations = filteredStations.length > 0 ? filteredStations : stationsData.stations;
    const bestStationMatch = sourceStations.find((station) => {
      const normalizedName = normalizeText(station.name);
      const normalizedId = normalizeText(station.id);

      return normalizedName.includes(query) || normalizedId.includes(query);
    });

    if (bestStationMatch) {
      if (bestStationMatch.id !== selectedStationId) {
        updateUrlState({ selectedStationId: bestStationMatch.id });
      }

      return;
    }

    if (stationDistrictMap.size === 0) {
      return;
    }

    const matchingDistrict = Array.from(new Set(stationDistrictMap.values())).find((district) =>
      normalizeText(district).includes(query)
    );

    if (!matchingDistrict) {
      return;
    }

    const districtStation = sourceStations.find(
      (station) => stationDistrictMap.get(station.id) === matchingDistrict
    );

    if (districtStation && districtStation.id !== selectedStationId) {
      updateUrlState({ selectedStationId: districtStation.id });
    }
  }, [filteredStations, searchQuery, selectedStationId, stationDistrictMap, stationsData.stations, updateUrlState]);

  const selectStationWithTracking = useCallback(
    (stationId: string, source: string, module = 'station_selector') => {
      const normalizedStationId = normalizeStationIdValue(stationId);

      if (!normalizedStationId || normalizedStationId === selectedStationId) {
        return;
      }

      trackUmamiEvent(
        buildEntitySelectEvent({
          surface: 'dashboard',
          routeKey: dashboardRouteKey,
          entityType: 'station',
          source,
          module,
        })
      );
      updateUrlState({ selectedStationId: normalizedStationId });
    },
    [dashboardRouteKey, selectedStationId, updateUrlState]
  );

  const handleChangeMode = useCallback(
    (mode: DashboardViewMode) => {
      if (mode === viewMode) {
        return;
      }

      trackUmamiEvent(
        buildDashboardModeChangeEvent({
          routeKey: dashboardRouteKey,
          mode,
          source: 'mode_header',
        })
      );
      updateUrlState({ viewMode: mode });
    },
    [dashboardRouteKey, updateUrlState, viewMode]
  );

  const handleChangeWindow = useCallback(
    (windowId: DashboardClientUrlState['activeWindowId']) => {
      if (windowId === activeWindowId) {
        return;
      }

      trackUmamiEvent(
        buildFilterChangeEvent({
          surface: 'dashboard',
          routeKey: dashboardRouteKey,
          module: 'time_window',
          source: 'dashboard_header',
          timeWindow: windowId,
        })
      );
      updateUrlState({ activeWindowId: windowId });
    },
    [activeWindowId, dashboardRouteKey, updateUrlState]
  );

  const handleToggleOnlyWithBikes = useCallback(
    (value: boolean) => {
      if (value === onlyWithBikes) {
        return;
      }

      trackUmamiEvent(
        buildFilterChangeEvent({
          surface: 'dashboard',
          routeKey: dashboardRouteKey,
          module: 'only_with_bikes',
          source: 'dashboard_header',
          destination: value ? 'enabled' : 'disabled',
        })
      );
      updateUrlState({ onlyWithBikes: value });
    },
    [dashboardRouteKey, onlyWithBikes, updateUrlState]
  );

  const handleToggleOnlyWithAnchors = useCallback(
    (value: boolean) => {
      if (value === onlyWithAnchors) {
        return;
      }

      trackUmamiEvent(
        buildFilterChangeEvent({
          surface: 'dashboard',
          routeKey: dashboardRouteKey,
          module: 'only_with_anchors',
          source: 'dashboard_header',
          destination: value ? 'enabled' : 'disabled',
        })
      );
      updateUrlState({ onlyWithAnchors: value });
    },
    [dashboardRouteKey, onlyWithAnchors, updateUrlState]
  );

  const handleChangeSearch = useCallback(
    (value: string) => {
      updateUrlState({ searchQuery: value });
    },
    [updateUrlState]
  );

  const handleMapViewStateCommit = useCallback(
    (state: DashboardMapViewState) => {
      updateUrlState({ mapViewState: state });
    },
    [updateUrlState]
  );

  const mobilityQuery = useQuery({
    ...mobilityQueryOptions({
      mobilityDays: activeWindow.mobilityDays,
      demandDays: activeWindow.demandDays,
      month: parsedSearch.month,
    }),
    enabled: showFull,
  });
  const mobilityPreview = mobilityQuery.data ?? EMPTY_MOBILITY_PREVIEW;
  const isMobilityPreviewLoading = showFull && mobilityQuery.isFetching;

  useEffect(() => {
    if (mobilityQuery.error) {
      captureExceptionWithContext(mobilityQuery.error, {
        area: 'dashboard.client',
        operation: 'refreshMobilityPreview',
        extra: {
          mobilityDays: activeWindow.mobilityDays,
          demandDays: activeWindow.demandDays,
        },
      });
    }
  }, [activeWindow.demandDays, activeWindow.mobilityDays, mobilityQuery.error]);

  const selectedStationDetailUrl = selectedStation
    ? appRoutes.dashboardStation(selectedStation.id)
    : appRoutes.dashboardStations();
  const totalStationsCount = stationsData.stations.length;
  const filteredOutCount = Math.max(0, totalStationsCount - filteredStations.length);
  const nearestStationInfo = nearestStation
    ? stationsData.stations.find((station) => station.id === nearestStation.stationId) ?? null
    : null;
  const hasAvailabilityFilter = onlyWithBikes || onlyWithAnchors;
  const nearestMessage = nearestStationInfo && nearestStation
    ? `📍 Estación más cercana: ${nearestStationInfo.name} · A ${formatDistanceMeters(nearestStation.distanceMeters)} de ti`
    : geolocationError
      ? `📍 ${geolocationError}`
      : isGeolocationEnabled
        ? '📍 Buscando tu ubicación para calcular la estación más cercana...'
        : '📍 Activa tu ubicación para calcular la estación más cercana. No se guarda ni se comparte.';
  const systemMetrics = useSystemMetrics({
    stations: stationsData.stations,
    rankings: rankingsData,
    alerts: alertsData,
    status: statusData,
  });
  const datasetLastSampleAt =
    statusData.quality.freshness.lastUpdated ?? initialData.dataset.lastUpdated.lastSampleAt;
  const updatedText = statusData.quality.freshness.lastUpdated
    ? formatStatusDateTime(statusData.quality.freshness.lastUpdated)
    : 'sin datos';
  const sharedDatasetUpdatedText = datasetLastSampleAt
    ? formatStatusDateTime(datasetLastSampleAt)
    : 'sin datos';
  const datasetSummaryLabel = `Cobertura ${initialData.dataset.coverage.totalDays} días · ${initialData.dataset.coverage.totalStations} estaciones · última muestra ${sharedDatasetUpdatedText}`;
  const topFrictionStationName = systemMetrics.topFriction
    ? stationsData.stations.find((station) => station.id === systemMetrics.topFriction?.stationId)?.name ?? systemMetrics.topFriction.stationId
    : null;
  const frictionByStationId = useMemo(
    () =>
      Object.fromEntries(
        rankingsData.availability.rankings.map((row) => [row.stationId, row.emptyHours + row.fullHours])
      ),
    [rankingsData.availability.rankings]
  );
  const dashboardDataState = combineDataStates([
    initialData.dataset.dataState,
    stationsData.dataState,
    statusData.dataState,
    rankingsData.turnover.dataState,
    rankingsData.availability.dataState,
  ]);

  return (
    <DashboardLayout mode={viewMode}>
      <DashboardPageViewTracker
        routeKey={dashboardRouteKey}
        pageType="dashboard"
        template="dashboard_home"
      />
      {showFull ? (
        <>
          <DashboardHeader
            timeWindows={TIME_WINDOWS}
            activeWindowId={activeWindowId}
            onChangeWindow={handleChangeWindow}
            searchQuery={searchQuery}
            onChangeSearch={handleChangeSearch}
            onlyWithBikes={onlyWithBikes}
            onlyWithAnchors={onlyWithAnchors}
            onToggleOnlyWithBikes={handleToggleOnlyWithBikes}
            onToggleOnlyWithAnchors={handleToggleOnlyWithAnchors}
            filteredStationsCount={filteredStations.length}
            totalStationsCount={totalStationsCount}
            filteredOutCount={hasAvailabilityFilter ? filteredOutCount : 0}
            favoriteCount={favoriteStationIds.length}
            activeAlertsCount={alertsData.alerts.length}
            activeWindowLabel={activeWindow.label}
            isMobilityPreviewLoading={isMobilityPreviewLoading}
            isRefreshingData={isRefreshingData}
            nearestMessage={nearestMessage}
            datasetSummaryLabel={datasetSummaryLabel}
            onUseGeolocation={enableGeolocation}
            canUseGeolocation={!isGeolocationEnabled && !(nearestStationInfo && nearestStation)}
            onJumpToNearest={() => {
              if (!nearestStationInfo) {
                return;
              }

              if (nearestStationInfo.id !== selectedStationId) {
                trackUmamiEvent(
                  buildEntitySelectEvent({
                    surface: 'dashboard',
                    routeKey: dashboardRouteKey,
                    entityType: 'station',
                    source: 'nearest_station',
                    module: 'geolocation',
                  })
                );
              }

              updateUrlState({
                onlyWithBikes: false,
                onlyWithAnchors: false,
                selectedStationId: nearestStationInfo.id,
              });
            }}
            canJumpToNearest={Boolean(nearestStationInfo && nearestStation)}
            nextRefreshAt={nextRefreshAt}
            refreshDurationMs={REFRESH_AFTER_LAST_DATA_MS}
            mode={viewMode}
          />

          {shouldShowDataStateNotice(dashboardDataState) ? (
            <DataStateNotice
              state={dashboardDataState}
              subject="el mapa avanzado"
              description="Todos los paneles comparten el mismo snapshot de cobertura, estado y rankings. Si este banner marca cobertura parcial o dataset antiguo, el resto de widgets heredan esa misma limitacion."
              href={appRoutes.status()}
              actionLabel="Abrir estado"
            />
          ) : null}

          <Tabs
            value={viewMode}
            onValueChange={(value) => {
              if (value === 'overview' || value === 'operations' || value === 'research' || value === 'data') {
                handleChangeMode(value);
              }
            }}
          >
            <div className="space-y-4">
              <ModeHeader activeMode={viewMode} onChangeMode={handleChangeMode} />
              <ModeIntroBanner mode={viewMode} />
            </div>

            <TabsContent value="overview" className="mt-6">
              <ViewErrorBoundary fallback={<div className="h-96 flex items-center justify-center rounded-xl bg-[var(--secondary)] text-sm text-[var(--muted)]">Error al cargar la vista de resumen.</div>}>
                <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-[var(--secondary)]" />}>
                  {viewMode === 'overview' && <OverviewModeView
                    status={statusData}
                    totalStations={totalStationsCount}
                    stations={stationsData.stations}
                    filteredStations={filteredStations}
                    selectedStationId={selectedStationId}
                    onSelectStation={(stationId) =>
                      selectStationWithTracking(stationId, 'overview_mode', 'overview')
                    }
                    favoriteStationIds={favoriteStationIds}
                    onToggleFavorite={toggleFavoriteStation}
                    trendByStationId={stationTrendById}
                    nearestStationId={nearestStation?.stationId ?? null}
                    nearestDistanceMeters={nearestStation?.distanceMeters ?? null}
                    userLocation={userLocation}
                    mapViewState={mapViewState}
                    onViewStateCommit={handleMapViewStateCommit}
                    frictionByStationId={frictionByStationId}
                    systemMetrics={systemMetrics}
                    updatedText={updatedText}
                    coverageDays={initialData.dataset.coverage.totalDays}
                    topFrictionStationName={topFrictionStationName}
                    alerts={alertsData}
                  />}
                </Suspense>
              </ViewErrorBoundary>
            </TabsContent>

            <TabsContent value="operations" className="mt-6">
              <ViewErrorBoundary fallback={<div className="h-96 flex items-center justify-center rounded-xl bg-[var(--secondary)] text-sm text-[var(--muted)]">Error al cargar la vista de operaciones.</div>}>
                <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-[var(--secondary)]" />}>
                  {viewMode === 'operations' && <OperationsModeView
                    stations={stationsData.stations}
                    filteredStations={filteredStations}
                    totalStations={totalStationsCount}
                    selectedStationId={selectedStationId}
                    onSelectStation={(stationId) =>
                      selectStationWithTracking(stationId, 'operations_mode', 'operations')
                    }
                    favoriteStationIds={favoriteStationIds}
                    onToggleFavorite={toggleFavoriteStation}
                    trendByStationId={stationTrendById}
                    nearestStationId={nearestStation?.stationId ?? null}
                    nearestDistanceMeters={nearestStation?.distanceMeters ?? null}
                    userLocation={userLocation}
                    mapViewState={mapViewState}
                    onViewStateCommit={handleMapViewStateCommit}
                    frictionByStationId={frictionByStationId}
                    alerts={alertsData}
                    rankings={rankingsData}
                    balanceIndex={systemMetrics.balanceIndex}
                    criticalStationsCount={systemMetrics.criticalStations.length}
                    dailyInsight={systemMetrics.dailyInsight}
                    topFrictionStationName={topFrictionStationName}
                    activeAlertsCount={systemMetrics.activeAlerts.length}
                  />}
                </Suspense>
              </ViewErrorBoundary>
            </TabsContent>

            <TabsContent value="research" className="mt-6">
              <ViewErrorBoundary fallback={<div className="h-96 flex items-center justify-center rounded-xl bg-[var(--secondary)] text-sm text-[var(--muted)]">Error al cargar la vista de investigación.</div>}>
                <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-[var(--secondary)]" />}>
                  {viewMode === 'research' && <ResearchModeView
                    stations={stationsData.stations}
                    filteredStations={filteredStations}
                    selectedStationId={selectedStationId}
                    onSelectStation={(stationId) =>
                      selectStationWithTracking(stationId, 'research_mode', 'research')
                    }
                    favoriteStationIds={favoriteStationIds}
                    onToggleFavorite={toggleFavoriteStation}
                    trendByStationId={stationTrendById}
                    nearestStationId={nearestStation?.stationId ?? null}
                    rankings={rankingsData}
                    dailyDemand={mobilityPreview.dailyDemand}
                    systemHourlyProfile={mobilityPreview.systemHourlyProfile}
                    hourlySignals={mobilityPreview.hourlySignals}
                    windowLabel={activeWindow.label}
                    requestedDays={activeWindow.demandDays}
                    recentSnapshots={recentSnapshots}
                    currentMonth={parsedSearch.month}
                  />}
                </Suspense>
              </ViewErrorBoundary>
            </TabsContent>

            <TabsContent value="data" className="mt-6">
              <ViewErrorBoundary fallback={<div className="h-96 flex items-center justify-center rounded-xl bg-[var(--secondary)] text-sm text-[var(--muted)]">Error al cargar la vista de datos.</div>}>
                <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-[var(--secondary)]" />}>
                  {viewMode === 'data' && <DataModeView
                    stationsCsvUrl={appRoutes.api.stations({ format: 'csv' })}
                    frictionCsvUrl={appRoutes.api.rankings({ type: 'availability', limit: 200, format: 'csv' })}
                    historyJsonUrl={appRoutes.api.history()}
                    historyCsvUrl={appRoutes.api.history({ format: 'csv' })}
                    alertsCsvUrl={appRoutes.api.alertsHistory({ format: 'csv', state: 'all', limit: 500 })}
                    statusCsvUrl={appRoutes.api.status({ format: 'csv' })}
                  />}
                </Suspense>
              </ViewErrorBoundary>
            </TabsContent>
          </Tabs>

          <DashboardQuickLinks selectedStationDetailUrl={selectedStationDetailUrl} currentMonth={parsedSearch.month} />
        </>
      ) : (
        <>
          <QuickHeader
            searchQuery={searchQuery}
            onChangeSearch={handleChangeSearch}
            filteredStationsCount={filteredStations.length}
            totalStationsCount={totalStationsCount}
            activeAlertsCount={alertsData.alerts.length}
            updatedText={updatedText}
            onSwitchToFull={() => setDensity('full')}
          />

          {shouldShowDataStateNotice(dashboardDataState) ? (
            <DataStateNotice
              state={dashboardDataState}
              subject="el mapa rapido"
              description="Los datos y el mapa comparten el mismo snapshot. Si el banner indica cobertura parcial, el resto de widgets tambien."
              href={appRoutes.status()}
              actionLabel="Abrir estado"
            />
          ) : null}

          <QuickOverviewView
            filteredStations={filteredStations}
            totalStations={totalStationsCount}
            selectedStationId={selectedStationId}
            onSelectStation={(stationId) =>
              selectStationWithTracking(stationId, 'overview_quick', 'overview_quick')
            }
            favoriteStationIds={favoriteStationIds}
            onToggleFavorite={toggleFavoriteStation}
            trendByStationId={stationTrendById}
            nearestStationId={nearestStation?.stationId ?? null}
            nearestDistanceMeters={nearestStation?.distanceMeters ?? null}
            userLocation={userLocation}
            mapViewState={mapViewState}
            onViewStateCommit={handleMapViewStateCommit}
            frictionByStationId={frictionByStationId}
            systemMetrics={systemMetrics}
            updatedText={updatedText}
            topFrictionStationName={topFrictionStationName}
            alerts={alertsData}
          />
        </>
      )}

      <FooterYear />
    </DashboardLayout>
  );
}

function FooterYear() {
  return (
    <footer className="pb-4 text-center text-[11px] text-[var(--muted)]" suppressHydrationWarning>
      &copy; {CURRENT_YEAR} Bizi Zaragoza - Sistema de analitica de movilidad urbana.
    </footer>
  );
}
