import { useCallback } from 'react';
import { parseJsonValue } from '@/lib/json';
import { readStorageText, useStorageValue, writeStorageText } from '@/lib/use-storage-value';

export type SavedComparison = {
  dimension: string;
  left: string;
  right: string;
  scope: string | null;
};

const SAVED_COMPARISONS_KEY = 'bizidashboard-saved-comparisons';
const MAX_SAVED_COMPARISONS = 8;
const EMPTY_SAVED_COMPARISONS: SavedComparison[] = [];

function sameComparison(left: SavedComparison, right: SavedComparison): boolean {
  return (
    left.dimension === right.dimension &&
    left.left === right.left &&
    left.right === right.right &&
    (left.scope ?? null) === (right.scope ?? null)
  );
}

export function parseSavedComparisons(rawValue: string | null): SavedComparison[] {
  const parsed = parseJsonValue(rawValue);

  if (!Array.isArray(parsed)) {
    return [];
  }

  const entries: SavedComparison[] = [];

  for (const value of parsed) {
    if (!value || typeof value !== 'object') {
      continue;
    }
    const candidate = value as Record<string, unknown>;
    if (
      typeof candidate.dimension !== 'string' ||
      typeof candidate.left !== 'string' ||
      typeof candidate.right !== 'string'
    ) {
      continue;
    }
    entries.push({
      dimension: candidate.dimension,
      left: candidate.left,
      right: candidate.right,
      scope: typeof candidate.scope === 'string' ? candidate.scope : null,
    });
  }

  return entries.slice(0, MAX_SAVED_COMPARISONS);
}

/**
 * Guarda comparaciones frecuentes en el navegador (modelo 100% anónimo). Es un
 * espejo de `useFavoriteStations`: misma mecánica de storage y sincronización
 * entre pestañas, con una lista acotada y sin duplicados.
 */
export function useSavedComparisons() {
  const savedComparisons = useStorageValue(
    SAVED_COMPARISONS_KEY,
    parseSavedComparisons,
    EMPTY_SAVED_COMPARISONS
  );

  const saveComparison = useCallback((entry: SavedComparison) => {
    const current = parseSavedComparisons(readStorageText(SAVED_COMPARISONS_KEY));
    const next = [entry, ...current.filter((item) => !sameComparison(item, entry))].slice(
      0,
      MAX_SAVED_COMPARISONS
    );
    writeStorageText(SAVED_COMPARISONS_KEY, JSON.stringify(next));
  }, []);

  const removeComparison = useCallback((entry: SavedComparison) => {
    const current = parseSavedComparisons(readStorageText(SAVED_COMPARISONS_KEY));
    const next = current.filter((item) => !sameComparison(item, entry));
    writeStorageText(SAVED_COMPARISONS_KEY, JSON.stringify(next));
  }, []);

  return { savedComparisons, saveComparison, removeComparison };
}
