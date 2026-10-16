'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DashboardViewMode } from './DashboardContext';

const FAVORITES_STORAGE_KEY = 'dashboard-favorite-stations';

export interface UseFavoritesOptions {
  initialFavorites?: string[];
}

export interface UseFavoritesResult {
  favoriteIds: string[];
  isFavorite: (stationId: string) => boolean;
  toggleFavorite: (stationId: string) => void;
  addFavorite: (stationId: string) => void;
  removeFavorite: (stationId: string) => void;
  clearFavorites: () => void;
}

function loadFavoritesFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFavoritesToStorage(favorites: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Ignore storage errors
  }
}

export function useFavorites(options: UseFavoritesOptions = {}): UseFavoritesResult {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => 
    options.initialFavorites ?? loadFavoritesFromStorage()
  );

  useEffect(() => {
    saveFavoritesToStorage(favoriteIds);
  }, [favoriteIds]);

  const isFavorite = useCallback((stationId: string) => {
    return favoriteIds.includes(stationId);
  }, [favoriteIds]);

  const toggleFavorite = useCallback((stationId: string) => {
    setFavoriteIds((prev) => 
      prev.includes(stationId)
        ? prev.filter((id) => id !== stationId)
        : [...prev, stationId]
    );
  }, []);

  const addFavorite = useCallback((stationId: string) => {
    setFavoriteIds((prev) => 
      prev.includes(stationId) ? prev : [...prev, stationId]
    );
  }, []);

  const removeFavorite = useCallback((stationId: string) => {
    setFavoriteIds((prev) => prev.filter((id) => id !== stationId));
  }, []);

  const clearFavorites = useCallback(() => {
    setFavoriteIds([]);
  }, []);

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
  };
}

export interface UseAutoRefreshOptions {
  intervalMs?: number;
  enabled?: boolean;
  onRefresh?: () => void | Promise<void>;
}

export interface UseAutoRefreshResult {
  isRefreshing: boolean;
  nextRefreshAt: Date | null;
  countdownMs: number;
  triggerRefresh: () => void;
  setEnabled: (enabled: boolean) => void;
}

export function useAutoRefresh(options: UseAutoRefreshOptions = {}): UseAutoRefreshResult {
  const {
    intervalMs = 60_000,
    enabled = true,
    onRefresh,
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextRefreshAt, setNextRefreshAt] = useState<Date | null>(null);
  const [countdownMs, setCountdownMs] = useState(intervalMs);
  const [isEnabled, setIsEnabled] = useState(enabled);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);
  const countdownRef = useRef(intervalMs);

  const triggerRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;

    isRefreshingRef.current = true;
    setIsRefreshing(true);
    try {
      await onRefreshRef.current?.();
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
      countdownRef.current = intervalMs;
    }
  }, [intervalMs]);

  useEffect(() => {
    if (!isEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    countdownRef.current = intervalMs;

    const id = setInterval(() => {
      countdownRef.current = Math.max(0, countdownRef.current - 1000);
      setCountdownMs(countdownRef.current);
      setNextRefreshAt(new Date(Date.now() + countdownRef.current));

      if (countdownRef.current <= 0) {
        void triggerRefresh();
      }
    }, 1000);
    intervalRef.current = id;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isEnabled, intervalMs, triggerRefresh]);

  return {
    isRefreshing,
    nextRefreshAt,
    countdownMs,
    triggerRefresh,
    setEnabled: setIsEnabled,
  };
}

export interface StationTrend {
  direction: 'up' | 'down' | 'flat';
  change24h: number;
}

export interface UseStationTrendsOptions {
  initialTrends?: Record<string, StationTrend>;
}

export interface UseStationTrendsResult {
  trends: Record<string, StationTrend>;
  updateTrend: (stationId: string, trend: StationTrend) => void;
  getTrend: (stationId: string) => StationTrend | undefined;
}

export function useStationTrends(options: UseStationTrendsOptions = {}): UseStationTrendsResult {
  const [trends, setTrends] = useState<Record<string, StationTrend>>(
    options.initialTrends ?? {}
  );

  const updateTrend = useCallback((stationId: string, trend: StationTrend) => {
    setTrends((prev) => ({ ...prev, [stationId]: trend }));
  }, []);

  const getTrend = useCallback((stationId: string) => {
    return trends[stationId];
  }, [trends]);

  return {
    trends,
    updateTrend,
    getTrend,
  };
}

export interface UseGeolocationOptions {
  enabled?: boolean;
  watchPosition?: boolean;
  maximumAge?: number;
  timeout?: number;
}

export interface UseGeolocationResult {
  location: { lat: number; lng: number } | null;
  error: string | null;
  isLoading: boolean;
  requestLocation: () => void;
  clearError: () => void;
}

export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationResult {
  const {
    enabled = false,
    watchPosition = false,
    maximumAge = 60_000,
    timeout = 10_000,
  } = options;

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
      { maximumAge, timeout }
    );
  }, [maximumAge, timeout]);

  useEffect(() => {
    if (!enabled || !watchPosition || typeof navigator === 'undefined') {
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);
      },
      (err) => {
        setError(err.message);
      },
      { maximumAge, timeout }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, watchPosition, maximumAge, timeout]);

  return {
    location,
    error,
    isLoading,
    requestLocation,
    clearError,
  };
}

export interface UseDashboardUrlStateOptions {
  initialViewMode?: DashboardViewMode;
  initialSearch?: string;
}

export interface UseDashboardUrlStateResult {
  viewMode: DashboardViewMode;
  setViewMode: (mode: DashboardViewMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedStationId: string | null;
  setSelectedStationId: (id: string | null) => void;
}

export function useDashboardUrlState(options: UseDashboardUrlStateOptions = {}): UseDashboardUrlStateResult {
  const [viewMode, setViewModeState] = useState(options.initialViewMode ?? 'overview');
  const [searchQuery, setSearchQueryState] = useState(options.initialSearch ?? '');
  const [selectedStationId, setSelectedStationIdState] = useState<string | null>(null);

  const setViewMode = useCallback((mode: DashboardViewMode) => {
    setViewModeState(mode);
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const setSelectedStationId = useCallback((id: string | null) => {
    setSelectedStationIdState(id);
  }, []);

  return {
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    selectedStationId,
    setSelectedStationId,
  };
}