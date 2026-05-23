'use client';

import { useEffect, useState } from 'react';

const FAVORITES_KEY = 'bizidashboard-favorite-stations';

export function useHasFavorites() {
  const [hasFavorites, setHasFavorites] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) {
        const ids = JSON.parse(raw);
        setHasFavorites(Array.isArray(ids) && ids.length > 0);
      }
    } catch {}
  }, []);
  return hasFavorites;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) {
        const ids = JSON.parse(raw);
        if (Array.isArray(ids)) setFavoriteIds(ids);
      }
    } catch {}
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
