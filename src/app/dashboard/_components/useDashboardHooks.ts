'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
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
  const [countdownMs, setCountdownMs] = useState(0);
  const [isEnabled, setIsEnabled] = useState(enabled);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);

  const triggerRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh?.();
      lastRefreshRef.current = Date.now();
      setNextRefreshAt(new Date(Date.now() + intervalMs));
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, intervalMs, onRefresh]);

  useEffect(() => {
    if (!isEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setNextRefreshAt(new Date(Date.now() + intervalMs));

    intervalRef.current = setInterval(() => {
      setCountdownMs((prev) => {
        if (prev <= 1000) {
          triggerRefresh();
          return intervalMs;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isEnabled, intervalMs, triggerRefresh]);

  useEffect(() => {
    setCountdownMs(nextRefreshAt ? Math.max(0, nextRefreshAt.getTime() - Date.now()) : 0);
  }, [nextRefreshAt]);

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
  initialViewMode?: 'overview' | 'operations' | 'research' | 'data';
  initialSearch?: string;
}

export interface UseDashboardUrlStateResult {
  viewMode: string;
  setViewMode: (mode: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedStationId: string | null;
  setSelectedStationId: (id: string | null) => void;
}

export function useDashboardUrlState(options: UseDashboardUrlStateOptions = {}): UseDashboardUrlStateResult {
  const [viewMode, setViewModeState] = useState(options.initialViewMode ?? 'overview');
  const [searchQuery, setSearchQueryState] = useState(options.initialSearch ?? '');
  const [selectedStationId, setSelectedStationIdState] = useState<string | null>(null);

  const setViewMode = useCallback((mode: string) => {
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