'use client';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState, Component, type ReactNode } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';
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
  fetchDistrictCollection,
  type DistrictCollection,
} from '@/lib/districts';
import { formatDistanceMeters, haversineDistanceMeters, type Coordinates } from '@/lib/geo';
import { type DashboardViewMode } from '@/lib/dashboard-modes';
import { buildDashboardUrlSearchParams } from '@/lib/dashboard-url-state';
import { parseDashboardClientSearch } from '@/lib/dashboard-search';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { isAbortError } from './useAbortableAsyncEffect';
import { appRoutes } from '@/lib/routes';
import { getLocationSearchParams } from '@/lib/router-search';
import { DashboardLayout } from './DashboardLayout';
import { DashboardHeader } from './DashboardHeader';
import { ModeIntroBanner } from './ModeIntroBanner';
import { DashboardQuickLinks } from './DashboardQuickLinks';
import { ModeHeader } from './ModeHeader';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useSystemMetrics } from './useSystemMetrics';
import { type DashboardMapViewState } from '@/lib/map-view-state';
import {
  buildDashboardModeChangeEvent,
  buildEntitySelectEvent,
  buildFilterChangeEvent,
  trackUmamiEvent,
} from '@/lib/umami';
import {
  buildStationSnapshotMap,
  parseRecentSnapshots,
  parseStationSnapshot,
  pushRecentSnapshot,
  type RecentStationSnapshot,
  type StationSnapshotMap,
} from '@/lib/recent-station-history';
import { parseJsonValue } from '@/lib/json';
import { DashboardPageViewTracker } from './DashboardPageViewTracker';

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
  id: string;
  label: string;
  mobilityDays: number;
  demandDays: number;
};

type MobilitySignalRow = {
  stationId: string;
  hour: number;
  departures: number;
  arrivals: number;
  sampleCount: number;
};

type DailyDemandRow = {
  day: string;
  demandScore: number;
  avgOccupancy: number;
  sampleCount: number;
};

type MobilityPreviewData = {
  hourlySignals: MobilitySignalRow[];
  dailyDemand: DailyDemandRow[];
  systemHourlyProfile: Array<{
    hour: number;
    avgOccupancy: number;
    avgBikesAvailable: number;
    sampleCount: number;
  }>;
};

type StationTrend = 'up' | 'down' | 'flat';

type RefreshPayload<T> = {
  ok: true;
  data: T;
} | {
  ok: false;
  retryAfterSeconds?: number;
};

const FAVORITES_STORAGE_KEY = 'bizidashboard-favorite-stations';
const TREND_SNAPSHOT_STORAGE_KEY = 'bizidashboard-session-station-snapshot';
const RECENT_SNAPSHOTS_STORAGE_KEY = 'bizidashboard-session-recent-station-snapshots';
const REFRESH_AFTER_LAST_DATA_MS = 5 * 60_000; // 5 minutes
const MIN_REFRESH_FALLBACK_MS = 30_000;

const TIME_WINDOWS: TimeWindow[] = [
  { id: '24h', label: 'Últimas 24h', mobilityDays: 1, demandDays: 7 },
  { id: '7d', label: '7 dias', mobilityDays: 7, demandDays: 14 },
  { id: '30d', label: 'Mes', mobilityDays: 30, demandDays: 30 },
  { id: '365d', label: 'Anual', mobilityDays: 365, demandDays: 365 },
];

const EMPTY_MOBILITY_PREVIEW: MobilityPreviewData = {
  hourlySignals: [],
  dailyDemand: [],
  systemHourlyProfile: [],
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function resolveStationId(stations: StationsResponse['stations'], value: string | null): string {
  if (value && stations.some((station) => station.id === value)) {
    return value;
  }

  return stations[0]?.id ?? '';
}

function computeStationTrends(
  previousSnapshot: StationSnapshotMap,
  currentStations: StationsResponse['stations']
): Record<string, StationTrend> {
  const trends: Record<string, StationTrend> = {};

  for (const station of currentStations) {
    const previousBikes = previousSnapshot[station.id];

    if (!Number.isFinite(previousBikes)) {
      trends[station.id] = 'flat';
      continue;
    }

    if (station.bikesAvailable > previousBikes) {
      trends[station.id] = 'up';
    } else if (station.bikesAvailable < previousBikes) {
      trends[station.id] = 'down';
    } else {
      trends[station.id] = 'flat';
    }
  }

  return trends;
}

function parseFavoriteIds(rawValue: string | null): string[] {
  const parsed = parseJsonValue(rawValue);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);
}

function writeJsonStorageItem(storage: Storage, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota exceeded and private browsing failures.
  }
}

function areSearchParamsEqual(a: URLSearchParams, b: URLSearchParams): boolean {
  const aEntries = Array.from(a.entries()).sort(([ka, va], [kb, vb]) => ka.localeCompare(kb) || va.localeCompare(vb));
  const bEntries = Array.from(b.entries()).sort(([ka, va], [kb, vb]) => ka.localeCompare(kb) || va.localeCompare(vb));

  if (aEntries.length !== bEntries.length) {
    return false;
  }

  for (let i = 0; i < aEntries.length; i++) {
    if (aEntries[i][0] !== bEntries[i][0] || aEntries[i][1] !== bEntries[i][1]) {
      return false;
    }
  }

  return true;
}

function toTimestamp(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function resolveLatestDataUpdatedAt(
  dataset: SharedDatasetSnapshot,
  stations: StationsResponse,
  status: StatusResponse
): Date {
  const stationRecordings = stations.stations
    .map((station) => toTimestamp(station.recordedAt))
    .filter((value): value is number => value !== null);

  const candidates = [
    toTimestamp(dataset.lastUpdated.lastSampleAt),
    toTimestamp(dataset.coverage.generatedAt),
    ...stationRecordings,
    toTimestamp(status.pipeline.lastSuccessfulPoll),
    toTimestamp(stations.generatedAt),
    toTimestamp(status.timestamp),
  ].filter((value): value is number => value !== null);

  if (candidates.length === 0) {
    return new Date();
  }

  return new Date(Math.max(...candidates));
}

function resolveNextRefreshAt(
  dataset: SharedDatasetSnapshot,
  stations: StationsResponse,
  status: StatusResponse,
  now: number
): Date {
  if (stations.stations.length === 0) {
    return new Date(now + MIN_REFRESH_FALLBACK_MS);
  }

  const latestUpdate = resolveLatestDataUpdatedAt(dataset, stations, status);
  return new Date(
    Math.max(
      latestUpdate.getTime() + REFRESH_AFTER_LAST_DATA_MS,
      now + MIN_REFRESH_FALLBACK_MS
    )
  );
}

function resolveHydrationNow(initialData: DashboardInitialData): number {
  if (typeof window === 'undefined') {
    const serverTs = toTimestamp(initialData.status.timestamp);
    return serverTs ?? Date.now();
  }
  return Date.now();
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const dashboardRouteKey = 'dashboard_home';
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useMemo(() => getLocationSearchParams(location), [location]);
  const parsedSearch = useMemo(
    () => parseDashboardClientSearch(searchParams),
    [searchParams]
  );

  const [stationsData, setStationsData] = useState<StationsResponse>(initialData.stations);
  const [statusData, setStatusData] = useState<StatusResponse>(initialData.status);
  const [alertsData, setAlertsData] = useState<AlertsResponse>(initialData.alerts);
  const [rankingsData, setRankingsData] = useState(initialData.rankings);

  const [selectedStationId, setSelectedStationId] = useState(() =>
    resolveStationId(initialData.stations.stations, parsedSearch.stationId)
  );
  const [viewMode, setViewMode] = useState<DashboardViewMode>(() =>
    parsedSearch.mode
  );
  const [searchQuery, setSearchQuery] = useState(parsedSearch.q);
  const [activeWindowId, setActiveWindowId] = useState(() =>
    parsedSearch.timeWindow
  );
  const [favoriteStationIds, setFavoriteStationIds] = useState<string[]>([]);
  const [onlyWithBikes, setOnlyWithBikes] = useState(() => parsedSearch.onlyWithBikes);
  const [onlyWithAnchors, setOnlyWithAnchors] = useState(() => parsedSearch.onlyWithAnchors);
  const [mapViewState, setMapViewState] = useState<DashboardMapViewState>(() =>
    parsedSearch.mapViewState
  );
  const [stationTrendById, setStationTrendById] = useState<Record<string, StationTrend>>({});
  const [recentSnapshots, setRecentSnapshots] = useState<RecentStationSnapshot[]>([]);
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [nextRefreshAt, setNextRefreshAt] = useState<Date>(() =>
    resolveNextRefreshAt(initialData.dataset, initialData.stations, initialData.status, resolveHydrationNow(initialData))
  );
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [isGeolocationEnabled, setIsGeolocationEnabled] = useState(false);
  const [districts, setDistricts] = useState<DistrictCollection | null>(null);
  const [mobilityPreview, setMobilityPreview] =
    useState<MobilityPreviewData>(EMPTY_MOBILITY_PREVIEW);
  const [isMobilityPreviewLoading, setIsMobilityPreviewLoading] = useState(false);

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

  const selectedStation = useMemo(() => {
    if (filteredStations.length === 0) {
      return null;
    }

    return filteredStations.find((station) => station.id === selectedStationId) ?? filteredStations[0];
  }, [filteredStations, selectedStationId]);

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

  const shouldLoadDistricts = searchQuery.trim().length > 0;

  useEffect(() => {
    if (!shouldLoadDistricts || districts) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    const loadDistricts = async () => {
      try {
        const payload = await fetchDistrictCollection(controller.signal);

        if (!payload || !isActive) {
          return;
        }

        setDistricts(payload);
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }

        captureExceptionWithContext(error, {
          area: 'dashboard.client',
          operation: 'loadDistrictsForSearch',
          extra: {
            searchQuery,
          },
        });
      }
    };

    void loadDistricts();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [districts, searchQuery, shouldLoadDistricts]);

     
    useEffect(() => {
      if (typeof window === 'undefined') {
        return;
      }

      const currentSnapshot = buildStationSnapshotMap(initialData.stations.stations);
      const parsedFavorites = parseFavoriteIds(window.localStorage.getItem(FAVORITES_STORAGE_KEY));
       
      setFavoriteStationIds(parsedFavorites);

      const previousSnapshot = parseStationSnapshot(
        window.sessionStorage.getItem(TREND_SNAPSHOT_STORAGE_KEY)
      );

      if (previousSnapshot) {
         
        setStationTrendById(computeStationTrends(previousSnapshot, initialData.stations.stations));
      }

      const nextRecentSnapshots = pushRecentSnapshot(
        parseRecentSnapshots(window.sessionStorage.getItem(RECENT_SNAPSHOTS_STORAGE_KEY)),
        {
          recordedAt: initialData.stations.generatedAt,
          snapshot: currentSnapshot,
        }
      );

       
      setRecentSnapshots(nextRecentSnapshots);

    writeJsonStorageItem(
      window.sessionStorage,
      TREND_SNAPSHOT_STORAGE_KEY,
      currentSnapshot
    );
    writeJsonStorageItem(
      window.sessionStorage,
      RECENT_SNAPSHOTS_STORAGE_KEY,
      nextRecentSnapshots
    );
  }, [initialData.stations]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    writeJsonStorageItem(window.localStorage, FAVORITES_STORAGE_KEY, favoriteStationIds);
  }, [favoriteStationIds]);

  useEffect(() => {
    if (!isGeolocationEnabled) {
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
       
      setGeolocationError('La geolocalización no está disponible en este navegador. Puedes mover el mapa manualmente.');
      return;
    }

    const watcherId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGeolocationError(null);
      },
      (error) => {
        setGeolocationError(error.message || 'No se pudo obtener tu ubicación. Puedes mover el mapa manualmente o revisar el permiso de ubicación del navegador.');
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 90_000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watcherId);
    };
  }, [isGeolocationEnabled]);

  useEffect(() => {
     
    if (filteredStations.length === 0) {
       
      setSelectedStationId('');
      return;
    }

    if (filteredStations.some((station) => station.id === selectedStationId)) {
      return;
    }

    setSelectedStationId(filteredStations[0]?.id ?? '');
  }, [filteredStations, selectedStationId]);

  useEffect(() => {
    const stationIdFromUrl = resolveStationId(stationsData.stations, parsedSearch.stationId);
    const windowIdFromUrl = parsedSearch.timeWindow;
    const modeFromUrl = parsedSearch.mode;
    const queryFromUrl = parsedSearch.q;
    const onlyWithBikesFromUrl = parsedSearch.onlyWithBikes;
    const onlyWithAnchorsFromUrl = parsedSearch.onlyWithAnchors;
    const mapViewFromUrl = parsedSearch.mapViewState;

    setSelectedStationId((current) =>
      current === stationIdFromUrl ? current : stationIdFromUrl
    );

    setActiveWindowId((current) =>
      current === windowIdFromUrl ? current : windowIdFromUrl
    );
    setViewMode((current) => (current === modeFromUrl ? current : modeFromUrl));
    setSearchQuery((current) => (current === queryFromUrl ? current : queryFromUrl));
    setOnlyWithBikes((current) => (current === onlyWithBikesFromUrl ? current : onlyWithBikesFromUrl));
    setOnlyWithAnchors((current) => (current === onlyWithAnchorsFromUrl ? current : onlyWithAnchorsFromUrl));
    setMapViewState((current) =>
      current.latitude === mapViewFromUrl.latitude &&
      current.longitude === mapViewFromUrl.longitude &&
      current.zoom === mapViewFromUrl.zoom
        ? current
        : mapViewFromUrl
    );
  }, [parsedSearch, stationsData.stations]);

  useEffect(() => {
    const nextParams = buildDashboardUrlSearchParams(searchParams, {
      activeWindowId,
      viewMode,
      selectedStationId,
      searchQuery,
      onlyWithBikes,
      onlyWithAnchors,
      mapViewState,
    });

    const hasChanges = !areSearchParamsEqual(nextParams, searchParams);

    if (!hasChanges) {
      return;
    }

    void navigate({
      search: Object.fromEntries(nextParams) as Record<string, unknown>,
      replace: true,
    });
  }, [
    activeWindowId,
    mapViewState,
    navigate,
    onlyWithAnchors,
    onlyWithBikes,
    searchParams,
    searchQuery,
    selectedStationId,
    viewMode,
  ]);

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
        setSelectedStationId(bestStationMatch.id);
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
      setSelectedStationId(districtStation.id);
    }
  }, [filteredStations, searchQuery, selectedStationId, stationDistrictMap, stationsData.stations]);

  const toggleFavoriteStation = useCallback((stationId: string) => {
    setFavoriteStationIds((current) => {
      if (current.includes(stationId)) {
        return current.filter((id) => id !== stationId);
      }

      return [...current, stationId];
    });
  }, []);

  const selectStationWithTracking = useCallback(
    (stationId: string, source: string, module = 'station_selector') => {
      if (!stationId || stationId === selectedStationId) {
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
      setSelectedStationId(stationId);
    },
    [dashboardRouteKey, selectedStationId]
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
      setViewMode(mode);
    },
    [dashboardRouteKey, viewMode]
  );

  const handleChangeWindow = useCallback(
    (windowId: string) => {
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
      setActiveWindowId(windowId);
    },
    [activeWindowId, dashboardRouteKey]
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
      setOnlyWithBikes(value);
    },
    [dashboardRouteKey, onlyWithBikes]
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
      setOnlyWithAnchors(value);
    },
    [dashboardRouteKey, onlyWithAnchors]
  );

  const enableGeolocation = useCallback(() => {
    setIsGeolocationEnabled(true);
    setGeolocationError(null);
  }, []);

  const refreshDashboardData = useCallback(async () => {
    if (isRefreshingData) {
      return;
    }

    const fetchJson = async <T,>(url: string): Promise<RefreshPayload<T>> => {
      try {
        const response = await fetch(url, { cache: 'no-store' });

        if (!response.ok) {
          const retryAfter = response.headers.get('Retry-After');
          throw new Error(`HTTP ${response.status}`, {
            cause: retryAfter ? { retryAfterSeconds: parseInt(retryAfter, 10) } : undefined,
          });
        }

        return {
          ok: true,
          data: (await response.json()) as T,
        };
      } catch (error) {
        captureExceptionWithContext(error, {
          area: 'dashboard.client',
          operation: 'refreshDashboardData.fetchJson',
          extra: {
            url,
          },
        });
        const retryAfterSeconds = (error as Error & { cause?: { retryAfterSeconds?: number } }).cause
          ?.retryAfterSeconds;
        return { ok: false, retryAfterSeconds };
      }
    };

    setIsRefreshingData(true);

    try {
      const rankingLimit = Math.max(50, Math.min(200, stationsData.stations.length || 50));

      const [stationsResult, alertsResult, turnoverResult, availabilityResult, statusResult] =
        await Promise.all([
          fetchJson<StationsResponse>(appRoutes.api.stations()),
          fetchJson<AlertsResponse>(appRoutes.api.alerts({ limit: 20 })),
          fetchJson<RankingsResponse>(appRoutes.api.rankings({ type: 'turnover', limit: rankingLimit })),
          fetchJson<RankingsResponse>(appRoutes.api.rankings({ type: 'availability', limit: rankingLimit })),
          fetchJson<StatusResponse>(appRoutes.api.status()),
        ]);

      if (stationsResult.ok) {
        const nextStationSnapshot = buildStationSnapshotMap(stationsResult.data.stations);
        const previousSnapshot = parseStationSnapshot(
          window.sessionStorage.getItem(TREND_SNAPSHOT_STORAGE_KEY)
        );
        const fallbackSnapshot = buildStationSnapshotMap(stationsData.stations);
        const trendSource = previousSnapshot ?? fallbackSnapshot;

        setStationTrendById(computeStationTrends(trendSource, stationsResult.data.stations));

        writeJsonStorageItem(
          window.sessionStorage,
          TREND_SNAPSHOT_STORAGE_KEY,
          nextStationSnapshot
        );

        const nextRecentSnapshots = pushRecentSnapshot(
          parseRecentSnapshots(window.sessionStorage.getItem(RECENT_SNAPSHOTS_STORAGE_KEY)),
          {
            recordedAt: stationsResult.data.generatedAt,
            snapshot: nextStationSnapshot,
          }
        );

        setRecentSnapshots(nextRecentSnapshots);
        writeJsonStorageItem(
          window.sessionStorage,
          RECENT_SNAPSHOTS_STORAGE_KEY,
          nextRecentSnapshots
        );

        setStationsData(stationsResult.data);
      }

      if (alertsResult.ok) {
        setAlertsData(alertsResult.data);
      }

      if (turnoverResult.ok && availabilityResult.ok) {
        setRankingsData({
          turnover: turnoverResult.data,
          availability: availabilityResult.data,
        });
      }

      if (statusResult.ok) {
        setStatusData(statusResult.data);
      }

      const latestStations = stationsResult.ok ? stationsResult.data : stationsData;
      const latestStatus = statusResult.ok ? statusResult.data : statusData;
      let nextRefresh = resolveNextRefreshAt(initialData.dataset, latestStations, latestStatus, Date.now());

      const rateLimitSeconds = [
        stationsResult,
        alertsResult,
        turnoverResult,
        availabilityResult,
        statusResult,
      ]
        .map((r) => (!r.ok ? r.retryAfterSeconds ?? 0 : 0))
        .reduce((max, val) => Math.max(max, val), 0);

      if (rateLimitSeconds > 0) {
        const rateLimitNext = new Date(Date.now() + rateLimitSeconds * 1000);
        if (rateLimitNext > nextRefresh) {
          nextRefresh = rateLimitNext;
        }
      }

      setNextRefreshAt(nextRefresh);
    } finally {
      setIsRefreshingData(false);
    }
  }, [initialData.dataset, stationsData, statusData, isRefreshingData]);

  useEffect(() => {
    const delayMs = nextRefreshAt.getTime() - Date.now();

    if (isRefreshingData) {
      return;
    }

    if (delayMs <= 0) {
      void refreshDashboardData();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void refreshDashboardData();
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [nextRefreshAt, refreshDashboardData, isRefreshingData]);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const refreshMobilityPreview = async () => {
      if (isActive) {
        setIsMobilityPreviewLoading(true);
      }

      try {
        const params = new URLSearchParams({
          mobilityDays: String(activeWindow.mobilityDays),
          demandDays: String(activeWindow.demandDays),
        });

        const selectedMonth = parsedSearch.month;

        if (selectedMonth) {
          params.set('month', selectedMonth);
        }

        const response = await fetch(`${appRoutes.api.mobility()}?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('No se pudo cargar la vista previa de flujo.');
        }

        const payload = (await response.json()) as Partial<MobilityPreviewData>;

        if (!isActive) {
          return;
        }

        setMobilityPreview({
          hourlySignals: Array.isArray(payload.hourlySignals) ? payload.hourlySignals : [],
          dailyDemand: Array.isArray(payload.dailyDemand) ? payload.dailyDemand : [],
          systemHourlyProfile: Array.isArray(payload.systemHourlyProfile)
            ? payload.systemHourlyProfile
            : [],
        });
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }

        captureExceptionWithContext(error, {
          area: 'dashboard.client',
          operation: 'refreshMobilityPreview',
          extra: {
            mobilityDays: activeWindow.mobilityDays,
            demandDays: activeWindow.demandDays,
          },
        });

        if (isActive) {
          setMobilityPreview(EMPTY_MOBILITY_PREVIEW);
        }
      } finally {
        if (isActive) {
          setIsMobilityPreviewLoading(false);
        }
      }
    };

    void refreshMobilityPreview();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [activeWindow.demandDays, activeWindow.mobilityDays, parsedSearch.month]);

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
      <DashboardHeader
        timeWindows={TIME_WINDOWS}
        activeWindowId={activeWindowId}
        onChangeWindow={handleChangeWindow}
        searchQuery={searchQuery}
        onChangeSearch={setSearchQuery}
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

          setOnlyWithBikes(false);
          setOnlyWithAnchors(false);
          selectStationWithTracking(nearestStationInfo.id, 'nearest_station', 'geolocation');
        }}
        canJumpToNearest={Boolean(nearestStationInfo && nearestStation)}
        nextRefreshAt={nextRefreshAt}
        refreshDurationMs={REFRESH_AFTER_LAST_DATA_MS}
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
        <ModeHeader activeMode={viewMode} onChangeMode={handleChangeMode} />

        <ModeIntroBanner mode={viewMode} />

        <TabsContent value="overview">
          {viewMode === 'overview' ? (
            <ViewErrorBoundary fallback={<div className="h-96 flex items-center justify-center rounded-xl bg-[var(--secondary)] text-sm text-[var(--muted)]">Error al cargar la vista de resumen.</div>}>
              <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-[var(--secondary)]" />}>
                <OverviewModeView
              status={statusData}
              stationsGeneratedAt={stationsData.generatedAt}
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
              onViewStateCommit={setMapViewState}
              frictionByStationId={frictionByStationId}
              systemMetrics={systemMetrics}
              updatedText={updatedText}
              topFrictionStationName={topFrictionStationName}
              mobilityPreview={mobilityPreview}
              activeWindowLabel={activeWindow.label}
              activeWindowDemandDays={activeWindow.demandDays}
              currentMonth={parsedSearch.month}
            />
            </Suspense>
            </ViewErrorBoundary>
          ) : null}
        </TabsContent>

        <TabsContent value="operations">
          {viewMode === 'operations' ? (
            <ViewErrorBoundary fallback={<div className="h-96 flex items-center justify-center rounded-xl bg-[var(--secondary)] text-sm text-[var(--muted)]">Error al cargar la vista de operaciones.</div>}>
              <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-[var(--secondary)]" />}>
                <OperationsModeView
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
              onViewStateCommit={setMapViewState}
              frictionByStationId={frictionByStationId}
              alerts={alertsData}
              rankings={rankingsData}
              balanceIndex={systemMetrics.balanceIndex}
              criticalStationsCount={systemMetrics.criticalStations.length}
              dailyInsight={systemMetrics.dailyInsight}
              topFrictionStationName={topFrictionStationName}
              activeAlertsCount={systemMetrics.activeAlerts.length}
            />
            </Suspense>
            </ViewErrorBoundary>
          ) : null}
        </TabsContent>

        <TabsContent value="research">
          {viewMode === 'research' ? (
            <ViewErrorBoundary fallback={<div className="h-96 flex items-center justify-center rounded-xl bg-[var(--secondary)] text-sm text-[var(--muted)]">Error al cargar la vista de investigación.</div>}>
              <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-[var(--secondary)]" />}>
                <ResearchModeView
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
            />
            </Suspense>
            </ViewErrorBoundary>
          ) : null}
        </TabsContent>

        <TabsContent value="data">
          {viewMode === 'data' ? (
            <ViewErrorBoundary fallback={<div className="h-96 flex items-center justify-center rounded-xl bg-[var(--secondary)] text-sm text-[var(--muted)]">Error al cargar la vista de datos.</div>}>
              <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-[var(--secondary)]" />}>
                <DataModeView
              stationsCsvUrl={appRoutes.api.stations({ format: 'csv' })}
              frictionCsvUrl={appRoutes.api.rankings({ type: 'availability', limit: 200, format: 'csv' })}
              historyJsonUrl={appRoutes.api.history()}
              historyCsvUrl={appRoutes.api.history({ format: 'csv' })}
              alertsCsvUrl={appRoutes.api.alertsHistory({ format: 'csv', state: 'all', limit: 500 })}
              statusCsvUrl={appRoutes.api.status({ format: 'csv' })}
            />
            </Suspense>
            </ViewErrorBoundary>
          ) : null}
        </TabsContent>
      </Tabs>

      <DashboardQuickLinks selectedStationDetailUrl={selectedStationDetailUrl} currentMonth={parsedSearch.month} />

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
