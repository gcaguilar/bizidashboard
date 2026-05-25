'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

const FAVORITES_KEY = 'bizidashboard-favorite-stations';

function readFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (raw) {
      const ids = JSON.parse(raw);
      return Array.isArray(ids) ? ids : [];
    }
  } catch {}
  return [];
}

function subscribeToFavorites(cb: () => void): () => void {
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
}

export function useHasFavorites(): boolean {
  const ids = useSyncExternalStore(
    subscribeToFavorites,
    () => readFavoriteIds(),
    () => [],
  );
  return ids.length > 0;
}

export function useIsMobile() {
  const subscribe = (cb: () => void) => {
    const mq = window.matchMedia('(max-width: 767px)');
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
  };
  const getSnapshot = () => {
    try {
      return window.matchMedia('(max-width: 767px)').matches;
    } catch {
      return false;
    }
  };
  const getServerSnapshot = () => false;
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const initialRead = useRef(false);

  useEffect(() => {
    if (initialRead.current) return;
    initialRead.current = true;
    const ids = readFavoriteIds();
    setFavoriteIds(ids);
  }, []);

  useEffect(() => {
    const handler = () => {
      const ids = readFavoriteIds();
      setFavoriteIds(ids);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const toggleFavorite = (stationId: string) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(stationId)
        ? prev.filter((id) => id !== stationId)
        : [...prev, stationId];
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const isFavorite = (stationId: string) => favoriteIds.includes(stationId);

  return { favoriteIds, toggleFavorite, isFavorite };
}
