import { useCallback } from 'react';
import { parseJsonValue } from '@/lib/json';
import { readStorageText, useStorageValue, writeStorageText } from '@/lib/use-storage-value';

export const FAVORITES_STORAGE_KEY = 'bizidashboard-favorite-stations';
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

/** Lista siguiente tras marcar/desmarcar `stationId` (función pura). */
export function toggleFavoriteId(current: string[], stationId: string): string[] {
  const id = stationId.trim();

  if (!id) {
    return current;
  }

  return current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
}

/** Lee, alterna y persiste un favorito en localStorage. No-op en servidor. */
export function toggleStoredFavorite(stationId: string): void {
  const current = parseFavoriteIds(readStorageText(FAVORITES_STORAGE_KEY));
  writeStorageText(FAVORITES_STORAGE_KEY, JSON.stringify(toggleFavoriteId(current, stationId)));
}

/**
 * Favoritos de estaciones guardados solo en el navegador (sin cuenta ni
 * servidor). En SSR e hidratación devuelve siempre la lista vacía, así que no
 * hay hydration mismatch; después se sincroniza con localStorage.
 */
export function useFavoriteStations() {
  const favoriteStationIds = useStorageValue(
    FAVORITES_STORAGE_KEY,
    parseFavoriteIds,
    EMPTY_FAVORITE_IDS
  );

  const toggleFavoriteStation = useCallback((stationId: string) => toggleStoredFavorite(stationId), []);

  return { favoriteStationIds, toggleFavoriteStation };
}
