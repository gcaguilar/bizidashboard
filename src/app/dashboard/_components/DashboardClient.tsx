'use client';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataStateNotice } from '@/app/_components/DataStateNotice';
import type {
  AlertsResponse,
  RankingsResponse,
  SharedDatasetSnapshot,
  StationsResponse,
  StatusResponse,
} from '@/lib/api';
import { combineDataStates, shouldShowDataStateNotice } from '@/lib/data-state';
import {
  buildStationDistrictMap,
  fetchDistrictCollection,
  type DistrictCollection,
} from '@/lib/districts';
import { formatDistanceMeters, haversineDistanceMeters, type Coordinates } from '@/lib/geo';
import { resolveDashboardViewMode, type DashboardViewMode } from '@/lib/dashboard-modes';
import { buildDashboardUrlSearchParams } from '@/lib/dashboard-url-state';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { appRoutes } from '@/lib/routes';
import { DashboardLayout } from './DashboardLayout';
import { DashboardHeader } from './DashboardHeader';
import { ModeIntroBanner } from './ModeIntroBanner';
import { DashboardQuickLinks } from './DashboardQuickLinks';
import { ModeHeader } from './ModeHeader';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useSystemMetrics } from './useSystemMetrics';
import { WidgetSkeleton } from './WidgetSkeleton';
import {
  resolveDashboardMapViewState,
  type DashboardMapViewState,
} from '@/lib/map-view-state';
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

const OverviewModeView = dynamic(
  () => import('./OverviewModeView').then((module) => module.OverviewModeView),
  {
    ssr: false,
    loading: () => <WidgetSkeleton className="min-h-[360px]" lines={6} />,
  }
);

const OperationsModeView = dynamic(
  () => import('./OperationsModeView').then((module) => module.OperationsModeView),
  {
    ssr: false,
    loading: () => <WidgetSkeleton className="min-h-[320px]" lines={6} />,
  }
);

const ResearchModeView = dynamic(
  () => import('./ResearchModeView').then((module) => module.ResearchModeView),
  {
    ssr: false,
    loading: () => <WidgetSkeleton className="min-h-[360px]" lines={6} />,
  }
);

const DataModeView = dynamic(
  () => import('./DataModeView').then((module) => module.DataModeView),
  {
    ssr: false,
    loading: () => <WidgetSkeleton className="min-h-[260px]" lines={5} />,
  }
);

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
};

const FAVORITES_STORAGE_KEY = 'bizidashboard-favorite-stations';
const TREND_SNAPSHOT_STORAGE_KEY = 'bizidashboard-session-station-snapshot';
const RECENT_SNAPSHOTS_STORAGE_KEY = 'bizidashboard-session-recent-station-snapshots';
const REFRESH_AFTER_LAST_DATA_MS = 5 * 60_000; // 5 minutes
const MIN_REFRESH_FALLBACK_MS = 30_000;

const TIME_WINDOWS: TimeWindow[] = [
  { id: '24h', label: 'Ultimas 24h', mobilityDays: 1, demandDays: 7 },
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

function resolveTimeWindowId(value: string | null): string {
  if (!value) {
    return TIME_WINDOWS[1]?.id ?? '7d';
  }

  return TIME_WINDOWS.some((window) => window.id === value)
    ? value
    : (TIME_WINDOWS[1]?.id ?? '7d');
}

function parseBooleanFilter(value: string | null): boolean {
  return value === '1' || value === 'true';
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
  status: StatusResponse
): Date {
  if (stations.stations.length === 0) {
    return new Date(Date.now() + MIN_REFRESH_FALLBACK_MS);
  }

  const latestUpdate = resolveLatestDataUpdatedAt(dataset, stations, status);
  return new Date(
    Math.max(
      latestUpdate.getTime() + REFRESH_AFTER_LAST_DATA_MS,
      Date.now() + MIN_REFRESH_FALLBACK_MS
    )
  );
}

function formatCountdown(valueMs: number): string {
  const safeMs = Math.max(0, valueMs);

  if (safeMs < 60_000) {
    return `${Math.ceil(safeMs / 1000)}s`;
  }

  const minutes = Math.ceil(safeMs / 60_000);
  return `${minutes} min`;
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const dashboardRouteKey = 'dashboard_home';
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stationsData, setStationsData] = useState<StationsResponse>(initialData.stations);
  const [statusData, setStatusData] = useState<StatusResponse>(initialData.status);
  const [alertsData, setAlertsData] = useState<AlertsResponse>(initialData.alerts);
  const [rankingsData, setRankingsData] = useState(initialData.rankings);

  const [selectedStationId, setSelectedStationId] = useState(() =>
    resolveStationId(initialData.stations.stations, searchParams.get('stationId'))
  );
  const [viewMode, setViewMode] = useState<DashboardViewMode>(() =>
    resolveDashboardViewMode(searchParams.get('mode'))
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');
  const [activeWindowId, setActiveWindowId] = useState(() =>
    resolveTimeWindowId(searchParams.get('timeWindow'))
  );
  const [favoriteStationIds, setFavoriteStationIds] = useState<string[]>([]);
  const [onlyWithBikes, setOnlyWithBikes] = useState(() => parseBooleanFilter(searchParams.get('onlyWithBikes')));
  const [onlyWithAnchors, setOnlyWithAnchors] = useState(() => parseBooleanFilter(searchParams.get('onlyWithAnchors')));
  const [mapViewState, setMapViewState] = useState<DashboardMapViewState>(() =>
    resolveDashboardMapViewState(searchParams)
  );
  const [stationTrendById, setStationTrendById] = useState<Record<string, StationTrend>>({});
  const [recentSnapshots, setRecentSnapshots] = useState<RecentStationSnapshot[]>([]);
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [nextRefreshAt, setNextRefreshAt] = useState<Date>(() =>
    resolveNextRefreshAt(initialData.dataset, initialData.stations, initialData.status)
  );
  const [refreshCountdownMs, setRefreshCountdownMs] = useState(0);
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
        if ((error as Error).name === 'AbortError') {
          return;
        }

        captureExceptionWithContext(error, {
          area: 'dashboard.client',
          operation: 'loadDistrictsForSearch',
          extra: {
            searchQuery,
          },
        });
        console.error('[Dashboard] No se pudieron cargar distritos para busqueda por barrio.', error);
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
      setGeolocationError('La geolocalizacion no esta disponible en este navegador.');
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
        setGeolocationError(error.message || 'No se pudo obtener tu ubicacion.');
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
    const stationIdFromUrl = resolveStationId(stationsData.stations, searchParams.get('stationId'));
    const windowIdFromUrl = resolveTimeWindowId(searchParams.get('timeWindow'));
    const modeFromUrl = resolveDashboardViewMode(searchParams.get('mode'));
    const queryFromUrl = searchParams.get('q') ?? '';
    const onlyWithBikesFromUrl = parseBooleanFilter(searchParams.get('onlyWithBikes'));
    const onlyWithAnchorsFromUrl = parseBooleanFilter(searchParams.get('onlyWithAnchors'));
    const mapViewFromUrl = resolveDashboardMapViewState(searchParams);

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
  }, [searchParams, stationsData.stations]);

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

    const hasChanges = nextParams.toString() !== searchParams.toString();

    if (!hasChanges) {
      return;
    }

    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [
    activeWindowId,
    mapViewState,
    onlyWithAnchors,
    onlyWithBikes,
    pathname,
    router,
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
    const fetchJson = async <T,>(url: string): Promise<RefreshPayload<T>> => {
      try {
        const response = await fetch(url, { cache: 'no-store' });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
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
        console.error(`[Dashboard] No se pudo refrescar ${url}`, error);
        return { ok: false };
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
      setNextRefreshAt(resolveNextRefreshAt(initialData.dataset, latestStations, latestStatus));
    } finally {
      setIsRefreshingData(false);
    }
  }, [initialData.dataset, stationsData, statusData]);

  useEffect(() => {
    const delayMs = nextRefreshAt.getTime() - Date.now();

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
  }, [nextRefreshAt, refreshDashboardData]);

  useEffect(() => {
    setRefreshCountdownMs(Math.max(0, nextRefreshAt.getTime() - Date.now()));

    const timerId = window.setInterval(() => {
      const remaining = Math.max(0, nextRefreshAt.getTime() - Date.now());
      setRefreshCountdownMs(remaining);
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [nextRefreshAt]);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const refreshMobilityPreview = async () => {
      if (isActive) {
        setIsMobilityPreviewLoading(true);
      }

      try {
        const searchParams = new URLSearchParams({
          mobilityDays: String(activeWindow.mobilityDays),
          demandDays: String(activeWindow.demandDays),
        });

        const selectedMonth = new URLSearchParams(window.location.search).get('month');

        if (selectedMonth) {
          searchParams.set('month', selectedMonth);
        }

        const response = await fetch(`${appRoutes.api.mobility()}?${searchParams.toString()}`, {
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
        if ((error as Error).name === 'AbortError') {
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
        console.error('Error al refrescar vista previa de flujo.', error);

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
  }, [activeWindow.demandDays, activeWindow.mobilityDays]);

  const selectedStationDetailUrl = selectedStation
    ? appRoutes.dashboardStation(selectedStation.id)
    : appRoutes.dashboardStations();
  const totalStationsCount = stationsData.stations.length;
  const filteredOutCount = Math.max(0, totalStationsCount - filteredStations.length);
  const nearestStationInfo = nearestStation
    ? stationsData.stations.find((station) => station.id === nearestStation.stationId) ?? null
    : null;
  const refreshProgress =
    ((REFRESH_AFTER_LAST_DATA_MS - Math.max(0, refreshCountdownMs)) / REFRESH_AFTER_LAST_DATA_MS) *
    100;
  const hasAvailabilityFilter = onlyWithBikes || onlyWithAnchors;
  const nearestMessage = nearestStationInfo && nearestStation
    ? `📍 Estacion mas cercana: ${nearestStationInfo.name} · A ${formatDistanceMeters(nearestStation.distanceMeters)} de ti`
    : geolocationError
      ? `📍 ${geolocationError}`
      : isGeolocationEnabled
        ? '📍 Buscando tu ubicacion para calcular la estacion mas cercana...'
        : '📍 Activa tu ubicacion para calcular la estacion mas cercana.';
  const systemMetrics = useSystemMetrics({
    stations: stationsData.stations,
    rankings: rankingsData,
    alerts: alertsData,
    status: statusData,
  });
  const datasetLastSampleAt =
    statusData.quality.freshness.lastUpdated ?? initialData.dataset.lastUpdated.lastSampleAt;
  const updatedText = statusData.quality.freshness.lastUpdated
    ? new Date(statusData.quality.freshness.lastUpdated).toLocaleString('es-ES')
    : 'sin datos';
  const sharedDatasetUpdatedText = datasetLastSampleAt
    ? new Date(datasetLastSampleAt).toLocaleString('es-ES')
    : 'sin datos';
  const datasetSummaryLabel = `Cobertura ${initialData.dataset.coverage.totalDays} dias · ${initialData.dataset.coverage.totalStations} estaciones · ultima muestra ${sharedDatasetUpdatedText}`;
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
        refreshCountdownLabel={formatCountdown(refreshCountdownMs)}
        refreshProgress={refreshProgress}
      />

      {shouldShowDataStateNotice(dashboardDataState) ? (
        <DataStateNotice
          state={dashboardDataState}
          subject="el dashboard"
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
        <ModeHeader activeMode={viewMode} />

        <ModeIntroBanner mode={viewMode} />

        <TabsContent value="overview">
          {viewMode === 'overview' ? (
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
            />
          ) : null}
        </TabsContent>

        <TabsContent value="operations">
          {viewMode === 'operations' ? (
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
          ) : null}
        </TabsContent>

        <TabsContent value="research">
          {viewMode === 'research' ? (
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
            />
          ) : null}
        </TabsContent>

        <TabsContent value="data">
          {viewMode === 'data' ? (
            <DataModeView
              stationsCsvUrl={appRoutes.api.stations({ format: 'csv' })}
              frictionCsvUrl={appRoutes.api.rankings({ type: 'availability', limit: 200, format: 'csv' })}
              historyJsonUrl={appRoutes.api.history()}
              historyCsvUrl={appRoutes.api.history({ format: 'csv' })}
              alertsCsvUrl={appRoutes.api.alertsHistory({ format: 'csv', state: 'all', limit: 500 })}
              statusCsvUrl={appRoutes.api.status({ format: 'csv' })}
            />
          ) : null}
        </TabsContent>
      </Tabs>

      <DashboardQuickLinks selectedStationDetailUrl={selectedStationDetailUrl} />

      <footer className="pb-4 text-center text-[11px] text-[var(--muted)]" suppressHydrationWarning>
        © {new Date().getFullYear()} Bizi Zaragoza - Sistema de analitica de movilidad urbana.
      </footer>
    </DashboardLayout>
  );
}
