'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AlertsResponse,
  RankingsResponse,
  StationsResponse,
  StatusResponse,
} from '@/lib/api';
import {
  buildStationDistrictMap,
  DISTRICTS_GEOJSON_URL,
  type DistrictCollection,
  isDistrictCollection,
} from '@/lib/districts';
import { formatDistanceMeters, haversineDistanceMeters, type Coordinates } from '@/lib/geo';
import { AlertsPanel } from './AlertsPanel';
import { DemandFlowCard } from './DemandFlowCard';
import { FlowPreviewPanel } from './FlowPreviewPanel';
import { MapPanel } from './MapPanel';
import { NeighborhoodLoadCard } from './NeighborhoodLoadCard';
import { RankingsTable } from './RankingsTable';
import { DashboardRouteLinks } from './DashboardRouteLinks';
import { StatusBanner } from './StatusBanner';
import { StationPicker } from './StationPicker';
import { SystemIntradayCard } from './SystemIntradayCard';
import { ThemeToggleButton } from './ThemeToggleButton';

export type DashboardInitialData = {
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
    bikesInCirculation: number;
    sampleCount: number;
  }>;
};

type StationTrend = 'up' | 'down' | 'flat';

type StationSnapshotMap = Record<string, number>;

type RefreshPayload<T> = {
  ok: true;
  data: T;
} | {
  ok: false;
};

const FAVORITES_STORAGE_KEY = 'bizidashboard-favorite-stations';
const TREND_SNAPSHOT_STORAGE_KEY = 'bizidashboard-session-station-snapshot';
const REFRESH_AFTER_LAST_DATA_MS = 30 * 60_000;
const MIN_REFRESH_FALLBACK_MS = 60_000;

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

const REPO_URL = 'https://github.com/gcaguilar/bizidashboard';

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

function toStationSnapshot(stations: StationsResponse['stations']): StationSnapshotMap {
  return stations.reduce<StationSnapshotMap>((accumulator, station) => {
    accumulator[station.id] = Number(station.bikesAvailable);
    return accumulator;
  }, {});
}

function parseStationSnapshot(rawValue: string | null): StationSnapshotMap | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    const snapshot: StationSnapshotMap = {};

    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!Number.isFinite(value)) {
        continue;
      }

      snapshot[key] = Number(value);
    }

    return snapshot;
  } catch {
    return null;
  }
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
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);
  } catch {
    return [];
  }
}

function toTimestamp(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function resolveLatestDataUpdatedAt(stations: StationsResponse, status: StatusResponse): Date {
  const stationRecordings = stations.stations
    .map((station) => toTimestamp(station.recordedAt))
    .filter((value): value is number => value !== null);

  const candidates = [
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

function formatCountdown(valueMs: number): string {
  const safeMs = Math.max(0, valueMs);

  if (safeMs < 60_000) {
    return `${Math.ceil(safeMs / 1000)}s`;
  }

  const minutes = Math.ceil(safeMs / 60_000);
  return `${minutes} min`;
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [stationsData, setStationsData] = useState<StationsResponse>(initialData.stations);
  const [statusData, setStatusData] = useState<StatusResponse>(initialData.status);
  const [alertsData, setAlertsData] = useState<AlertsResponse>(initialData.alerts);
  const [rankingsData, setRankingsData] = useState(initialData.rankings);

  const [selectedStationId, setSelectedStationId] = useState(() =>
    resolveStationId(initialData.stations.stations, searchParams.get('stationId'))
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');
  const [activeWindowId, setActiveWindowId] = useState(() =>
    resolveTimeWindowId(searchParams.get('timeWindow'))
  );
  const [favoriteStationIds, setFavoriteStationIds] = useState<string[]>([]);
  const [onlyWithBikes, setOnlyWithBikes] = useState(() => parseBooleanFilter(searchParams.get('onlyWithBikes')));
  const [onlyWithAnchors, setOnlyWithAnchors] = useState(() => parseBooleanFilter(searchParams.get('onlyWithAnchors')));
  const [stationTrendById, setStationTrendById] = useState<Record<string, StationTrend>>({});
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [nextRefreshAt, setNextRefreshAt] = useState<Date>(() => {
    const latestUpdate = resolveLatestDataUpdatedAt(initialData.stations, initialData.status);
    return new Date(latestUpdate.getTime() + REFRESH_AFTER_LAST_DATA_MS);
  });
  const [refreshCountdownMs, setRefreshCountdownMs] = useState(0);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
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

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadDistricts = async () => {
      try {
        const response = await fetch(DISTRICTS_GEOJSON_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as unknown;

        if (!isDistrictCollection(payload) || !isActive) {
          return;
        }

        setDistricts(payload);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }

        console.error('[Dashboard] No se pudieron cargar distritos para busqueda por barrio.', error);
      }
    };

    void loadDistricts();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const parsedFavorites = parseFavoriteIds(window.localStorage.getItem(FAVORITES_STORAGE_KEY));
    setFavoriteStationIds(parsedFavorites);

    const previousSnapshot = parseStationSnapshot(
      window.sessionStorage.getItem(TREND_SNAPSHOT_STORAGE_KEY)
    );

    if (previousSnapshot) {
      setStationTrendById(computeStationTrends(previousSnapshot, initialData.stations.stations));
    }

    window.sessionStorage.setItem(
      TREND_SNAPSHOT_STORAGE_KEY,
      JSON.stringify(toStationSnapshot(initialData.stations.stations))
    );
  }, [initialData.stations]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteStationIds));
  }, [favoriteStationIds]);

  useEffect(() => {
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
  }, []);

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
    const queryFromUrl = searchParams.get('q') ?? '';
    const onlyWithBikesFromUrl = parseBooleanFilter(searchParams.get('onlyWithBikes'));
    const onlyWithAnchorsFromUrl = parseBooleanFilter(searchParams.get('onlyWithAnchors'));

    setSelectedStationId((current) =>
      current === stationIdFromUrl ? current : stationIdFromUrl
    );

    setActiveWindowId((current) =>
      current === windowIdFromUrl ? current : windowIdFromUrl
    );
    setSearchQuery((current) => (current === queryFromUrl ? current : queryFromUrl));
    setOnlyWithBikes((current) => (current === onlyWithBikesFromUrl ? current : onlyWithBikesFromUrl));
    setOnlyWithAnchors((current) => (current === onlyWithAnchorsFromUrl ? current : onlyWithAnchorsFromUrl));
  }, [searchParams, stationsData.stations]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    let hasChanges = false;

    if (nextParams.get('timeWindow') !== activeWindowId) {
      nextParams.set('timeWindow', activeWindowId);
      hasChanges = true;
    }

    if (selectedStationId) {
      if (nextParams.get('stationId') !== selectedStationId) {
        nextParams.set('stationId', selectedStationId);
        hasChanges = true;
      }
    } else if (nextParams.has('stationId')) {
      nextParams.delete('stationId');
      hasChanges = true;
    }

    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      if (nextParams.get('q') !== trimmedQuery) {
        nextParams.set('q', trimmedQuery);
        hasChanges = true;
      }
    } else if (nextParams.has('q')) {
      nextParams.delete('q');
      hasChanges = true;
    }

    if (onlyWithBikes) {
      if (nextParams.get('onlyWithBikes') !== '1') {
        nextParams.set('onlyWithBikes', '1');
        hasChanges = true;
      }
    } else if (nextParams.has('onlyWithBikes')) {
      nextParams.delete('onlyWithBikes');
      hasChanges = true;
    }

    if (onlyWithAnchors) {
      if (nextParams.get('onlyWithAnchors') !== '1') {
        nextParams.set('onlyWithAnchors', '1');
        hasChanges = true;
      }
    } else if (nextParams.has('onlyWithAnchors')) {
      nextParams.delete('onlyWithAnchors');
      hasChanges = true;
    }

    if (!hasChanges) {
      return;
    }

    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    window.history.replaceState(window.history.state, '', nextUrl);
  }, [activeWindowId, onlyWithAnchors, onlyWithBikes, pathname, searchParams, searchQuery, selectedStationId]);

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
        console.error(`[Dashboard] No se pudo refrescar ${url}`, error);
        return { ok: false };
      }
    };

    setIsRefreshingData(true);

    try {
      const rankingLimit = Math.max(50, Math.min(200, stationsData.stations.length || 50));

      const [stationsResult, alertsResult, turnoverResult, availabilityResult, statusResult] =
        await Promise.all([
          fetchJson<StationsResponse>('/api/stations'),
          fetchJson<AlertsResponse>('/api/alerts?limit=20'),
          fetchJson<RankingsResponse>(`/api/rankings?type=turnover&limit=${rankingLimit}`),
          fetchJson<RankingsResponse>(`/api/rankings?type=availability&limit=${rankingLimit}`),
          fetchJson<StatusResponse>('/api/status'),
        ]);

      if (stationsResult.ok) {
        const previousSnapshot = parseStationSnapshot(
          window.sessionStorage.getItem(TREND_SNAPSHOT_STORAGE_KEY)
        );
        const fallbackSnapshot = toStationSnapshot(stationsData.stations);
        const trendSource = previousSnapshot ?? fallbackSnapshot;

        setStationTrendById(computeStationTrends(trendSource, stationsResult.data.stations));

        window.sessionStorage.setItem(
          TREND_SNAPSHOT_STORAGE_KEY,
          JSON.stringify(toStationSnapshot(stationsResult.data.stations))
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
      const latestUpdate = resolveLatestDataUpdatedAt(latestStations, latestStatus);
      const targetTimestamp = Math.max(
        latestUpdate.getTime() + REFRESH_AFTER_LAST_DATA_MS,
        Date.now() + MIN_REFRESH_FALLBACK_MS
      );
      setNextRefreshAt(new Date(targetTimestamp));
    } finally {
      setIsRefreshingData(false);
    }
  }, [stationsData, statusData]);

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

        const response = await fetch(`/api/mobility?${searchParams.toString()}`, {
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
    ? `/dashboard/estaciones/${encodeURIComponent(selectedStation.id)}`
    : '/dashboard/estaciones';
  const totalStationsCount = stationsData.stations.length;
  const filteredOutCount = Math.max(0, totalStationsCount - filteredStations.length);
  const nearestStationInfo = nearestStation
    ? stationsData.stations.find((station) => station.id === nearestStation.stationId) ?? null
    : null;
  const refreshProgress =
    ((REFRESH_AFTER_LAST_DATA_MS - Math.max(0, refreshCountdownMs)) / REFRESH_AFTER_LAST_DATA_MS) *
    100;
  const hasAvailabilityFilter = onlyWithBikes || onlyWithAnchors;

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 overflow-x-hidden">
      <header className="sticky top-0 z-50 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-6">
            <div className="flex items-center gap-3 text-[var(--accent)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-black text-white">
                B
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Bizi Zaragoza</h1>
            </div>

            <div className="hidden items-center gap-2 rounded-lg bg-[var(--accent)]/10 p-1 lg:flex">
              {TIME_WINDOWS.map((window) => (
                <button
                  key={window.id}
                  type="button"
                  onClick={() => setActiveWindowId(window.id)}
                  aria-pressed={activeWindowId === window.id}
                  className={`rounded-md px-4 py-1.5 text-xs font-semibold transition ${
                    activeWindowId === window.id
                      ? 'bg-[var(--accent)] text-white shadow-sm'
                      : 'text-[var(--muted)] hover:bg-[var(--accent)]/10 hover:text-[var(--foreground)]'
                  }`}
                >
                  {window.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
            <label className="hidden w-full max-w-md items-center rounded-lg border border-transparent bg-[var(--surface-soft)] px-3 py-2 md:flex md:border-[var(--border)]/60">
              <input
                type="text"
                className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
                placeholder="Buscar estacion, ID o barrio..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>

            <Link
              href="/dashboard/conclusiones"
              className="icon-button hidden sm:inline-flex"
              aria-label="Conclusiones de movilidad"
            >
              Conclusiones
            </Link>
            <Link
              href="/dashboard/ayuda"
              className="icon-button hidden sm:inline-flex"
              aria-label="Centro de ayuda"
            >
              Ayuda
            </Link>
            <ThemeToggleButton />
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="icon-button"
              aria-label="Repositorio de la aplicacion"
            >
              <span className="sm:hidden">Repo</span>
              <span className="hidden sm:inline">Repositorio</span>
            </a>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3 border-t border-[var(--border)]/70 pt-3">
          <DashboardRouteLinks
            activeRoute="dashboard"
            routes={['stations', 'flow', 'conclusions', 'help']}
            variant="chips"
            className="flex flex-wrap items-center gap-2 sm:hidden"
          />

          <label className="flex w-full items-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-sm md:hidden">
            <input
              type="text"
              className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
              placeholder="Buscar estacion, ID o barrio..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-2 py-1.5">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={onlyWithBikes}
                onChange={(event) => setOnlyWithBikes(event.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
              />
              Solo con bicis
            </label>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={onlyWithAnchors}
                onChange={(event) => setOnlyWithAnchors(event.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
              />
              Solo con huecos
            </label>
          </div>

          <div className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs text-[var(--muted)]">
            <p>
              Estaciones: {filteredStations.length}/{totalStationsCount}
              {hasAvailabilityFilter && filteredOutCount > 0 ? ` (filtradas ${filteredOutCount})` : ''} ·
              Favoritas: {favoriteStationIds.length} · Alertas activas: {alertsData.alerts.length} · Ventana:{' '}
              {activeWindow.label}
              {isMobilityPreviewLoading ? ' (actualizando flujo...)' : ''}
            </p>
            <p>{isRefreshingData ? 'Refrescando datos del sistema ahora...' : 'Resumen operativo disponible justo debajo.'}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[var(--accent)]/10 p-1 lg:hidden">
            {TIME_WINDOWS.map((window) => (
              <button
                key={window.id}
                type="button"
                onClick={() => setActiveWindowId(window.id)}
                aria-pressed={activeWindowId === window.id}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  activeWindowId === window.id
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {window.label}
              </button>
              ))}
            </div>

          <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2">
            <p className="text-xs text-[var(--foreground)]">
              {nearestStationInfo && nearestStation
                ? `📍 Estacion mas cercana: ${nearestStationInfo.name} · A ${formatDistanceMeters(nearestStation.distanceMeters)} de ti`
                : geolocationError
                  ? `📍 ${geolocationError}`
                  : '📍 Buscando tu ubicacion para calcular la estacion mas cercana...'}
            </p>

            {nearestStationInfo && nearestStation ? (
              <button
                type="button"
                onClick={() => {
                  setOnlyWithBikes(false);
                  setOnlyWithAnchors(false);
                  setSelectedStationId(nearestStationInfo.id);
                }}
                className="rounded-lg border border-[var(--accent)] px-2 py-1 text-[11px] font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
              >
                Ir a la mas cercana
              </button>
            ) : null}
          </div>

          <div className="w-full">
            <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--muted)]">
              <span>Auto-refresh: ultima actualizacion de datos + 30 min</span>
              <span>
                {isRefreshingData
                  ? 'sincronizando...'
                  : `siguiente en ${formatCountdown(refreshCountdownMs)}`}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/15">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500"
                style={{ width: `${Math.max(0, Math.min(100, refreshProgress))}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <StatusBanner status={statusData} stationsGeneratedAt={stationsData.generatedAt} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:items-stretch">
        <div className="min-w-0 lg:col-span-3">
          <MapPanel
            stations={filteredStations}
            totalStations={totalStationsCount}
            selectedStationId={selectedStationId}
            onSelectStation={setSelectedStationId}
            favoriteStationIds={favoriteStationIds}
            onToggleFavorite={toggleFavoriteStation}
            trendByStationId={stationTrendById}
            nearestStationId={nearestStation?.stationId ?? null}
            nearestDistanceMeters={nearestStation?.distanceMeters ?? null}
            userLocation={userLocation}
          />
        </div>
        <div className="min-w-0 lg:col-span-1">
          <AlertsPanel alerts={alertsData} stations={stationsData.stations} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <DemandFlowCard
          dailyDemand={mobilityPreview.dailyDemand}
          windowLabel={activeWindow.label}
          requestedDays={activeWindow.demandDays}
        />
        <SystemIntradayCard rows={mobilityPreview.systemHourlyProfile} windowLabel={activeWindow.label} />
        <RankingsTable rankings={rankingsData} stations={stationsData.stations} />
        <NeighborhoodLoadCard stations={stationsData.stations} />
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--accent)]/8 px-4 py-4">
          <div>
            <h2 className="text-lg font-bold leading-tight text-[var(--foreground)]">
              Analisis de flujo y corredores populares
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Movimiento entre barrios en tiempo real.
            </p>
          </div>
          <Link
            href="/dashboard/flujo"
            className="rounded-lg border border-[var(--accent)] bg-[var(--accent)]/12 px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
          >
            Vista completa
          </Link>
        </div>
        <FlowPreviewPanel
          stations={stationsData.stations}
          hourlySignals={mobilityPreview.hourlySignals}
        />
      </section>

      <StationPicker
        stations={filteredStations}
        selectedStationId={selectedStationId}
        onSelectStation={setSelectedStationId}
        favoriteStationIds={favoriteStationIds}
        onToggleFavorite={toggleFavoriteStation}
        trendByStationId={stationTrendById}
        nearestStationId={nearestStation?.stationId ?? null}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="dashboard-card">
          <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
            Detalle de estacion
          </h3>
          <p className="text-sm text-[var(--muted)]">
            Abre la vista completa de la estacion seleccionada para ver prediccion, mapa por barrios y comparativas.
          </p>
          <Link
            href={selectedStationDetailUrl}
            className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
          >
            Abrir detalle completo
          </Link>
        </article>

        <article className="dashboard-card">
          <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
            Flujo por barrios
          </h3>
          <p className="text-sm text-[var(--muted)]">
            Consulta la matriz O-D, el chord y las rutas de mayor volumen en una pagina dedicada.
          </p>
          <Link
            href="/dashboard/flujo"
            className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
          >
            Ir a analisis de flujo
          </Link>
        </article>

        <article className="dashboard-card">
          <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
            Conclusiones diarias
          </h3>
          <p className="text-sm text-[var(--muted)]">
            Resumen ejecutivo de movilidad, tendencias semanales y recomendaciones operativas.
          </p>
          <Link
            href="/dashboard/conclusiones"
            className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
          >
            Ver conclusiones
          </Link>
        </article>

        <article className="dashboard-card">
          <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
            Centro de ayuda
          </h3>
          <p className="text-sm text-[var(--muted)]">
            Metodologia, criterios de alertas y documentacion en una pagina independiente.
          </p>
          <Link
            href="/dashboard/ayuda"
            className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
          >
            Abrir ayuda
          </Link>
        </article>
      </section>

      <footer className="pb-4 text-center text-[11px] text-[var(--muted)]">
        © 2024 Bizi Zaragoza - Sistema de analitica de movilidad urbana.
      </footer>
    </div>
  );
}
