'use client';

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { DistrictCollection } from '@/lib/districts';
import type { StationTrend } from './StationDetailPanel';

export type DashboardViewMode = 'overview' | 'operations' | 'research' | 'data';

interface StationState {
  selectedStationId: string | null;
  favoriteStationIds: string[];
  stationTrendById: Record<string, StationTrend>;
}

interface UIState {
  viewMode: DashboardViewMode;
  searchQuery: string;
  onlyWithBikes: boolean;
  onlyWithAnchors: boolean;
}

interface LocationState {
  userLocation: { lat: number; lng: number } | null;
  geolocationError: string | null;
}

interface DashboardContextValue {
  station: StationState;
  ui: UIState;
  location: LocationState;
  districts: DistrictCollection | null;
  
  setSelectedStation: (id: string | null) => void;
  toggleFavorite: (stationId: string) => void;
  setViewMode: (mode: DashboardViewMode) => void;
  setSearchQuery: (query: string) => void;
  setOnlyWithBikes: (value: boolean) => void;
  setOnlyWithAnchors: (value: boolean) => void;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
  setGeolocationError: (error: string | null) => void;
  setDistricts: (districts: DistrictCollection | null) => void;
  updateStationTrend: (stationId: string, trend: StationTrend) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

interface DashboardProviderProps {
  children: ReactNode;
  initialViewMode?: DashboardViewMode;
  initialSearchQuery?: string;
}

export function DashboardProvider({
  children,
  initialViewMode = 'overview',
  initialSearchQuery = '',
}: DashboardProviderProps) {
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [favoriteStationIds, setFavoriteStationIds] = useState<string[]>([]);
  const [stationTrendById, setStationTrendById] = useState<Record<string, StationTrend>>({});
  
  const [viewMode, setViewMode] = useState<DashboardViewMode>(initialViewMode);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [onlyWithBikes, setOnlyWithBikes] = useState(false);
  const [onlyWithAnchors, setOnlyWithAnchors] = useState(false);
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  
  const [districts, setDistricts] = useState<DistrictCollection | null>(null);

  const toggleFavorite = useCallback((stationId: string) => {
    setFavoriteStationIds((prev) =>
      prev.includes(stationId)
        ? prev.filter((id) => id !== stationId)
        : [...prev, stationId]
    );
  }, []);

  const updateStationTrend = useCallback((stationId: string, trend: StationTrend) => {
    setStationTrendById((prev) => ({ ...prev, [stationId]: trend }));
  }, []);

  const value = useMemo<DashboardContextValue>(() => ({
    station: {
      selectedStationId,
      favoriteStationIds,
      stationTrendById,
    },
    ui: {
      viewMode,
      searchQuery,
      onlyWithBikes,
      onlyWithAnchors,
    },
    location: {
      userLocation,
      geolocationError,
    },
    districts,
    
    setSelectedStation: setSelectedStationId,
    toggleFavorite,
    setViewMode,
    setSearchQuery,
    setOnlyWithBikes,
    setOnlyWithAnchors,
    setUserLocation,
    setGeolocationError,
    setDistricts,
    updateStationTrend,
  }), [
    selectedStationId,
    favoriteStationIds,
    stationTrendById,
    viewMode,
    searchQuery,
    onlyWithBikes,
    onlyWithAnchors,
    userLocation,
    geolocationError,
    districts,
    toggleFavorite,
    updateStationTrend,
  ]);

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
}