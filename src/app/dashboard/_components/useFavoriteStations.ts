import { useCallback, useEffect, useState } from 'react';
import { parseJsonValue } from '@/lib/json';
import { writeJsonStorageItem } from './client-storage';

const FAVORITES_STORAGE_KEY = 'bizidashboard-favorite-stations';

export function parseFavoriteIds(rawValue: string | null): string[] {
  const parsed = parseJsonValue(rawValue);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);
}

export function useFavoriteStations() {
  const [favoriteStationIds, setFavoriteStationIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setFavoriteStationIds(parseFavoriteIds(window.localStorage.getItem(FAVORITES_STORAGE_KEY)));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !isLoaded) {
      return;
    }

    writeJsonStorageItem(window.localStorage, FAVORITES_STORAGE_KEY, favoriteStationIds);
  }, [favoriteStationIds, isLoaded]);

  const toggleFavoriteStation = useCallback((stationId: string) => {
    setFavoriteStationIds((current) => {
      if (current.includes(stationId)) {
        return current.filter((id) => id !== stationId);
      }

      return [...current, stationId];
    });
  }, []);

  return { favoriteStationIds, toggleFavoriteStation };
}
