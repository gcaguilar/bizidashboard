import { useCallback } from 'react';
import { parseJsonValue } from '@/lib/json';
import { readStorageText, useStorageValue, writeStorageText } from '@/lib/use-storage-value';

const FAVORITES_STORAGE_KEY = 'bizidashboard-favorite-stations';
const EMPTY_FAVORITE_IDS: string[] = [];

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
  const favoriteStationIds = useStorageValue(
    FAVORITES_STORAGE_KEY,
    parseFavoriteIds,
    EMPTY_FAVORITE_IDS
  );

  const toggleFavoriteStation = useCallback((stationId: string) => {
    const current = parseFavoriteIds(readStorageText(FAVORITES_STORAGE_KEY));
    const next = current.includes(stationId)
      ? current.filter((id) => id !== stationId)
      : [...current, stationId];

    writeStorageText(FAVORITES_STORAGE_KEY, JSON.stringify(next));
  }, []);

  return { favoriteStationIds, toggleFavoriteStation };
}
