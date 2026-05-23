'use client'
import { useEffect, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import {
  trackUmamiEvent,
  buildCtaClickEvent,
  resolveRouteKeyFromPathname,
} from '@/lib/umami'

const FAVORITES_KEY = 'bizidashboard-favorite-stations'

type StationFavoriteButtonProps = {
  stationId: string
}

export function StationFavoriteButton({ stationId }: StationFavoriteButtonProps) {
  const pathname = useLocation().pathname;
  const routeKey = resolveRouteKeyFromPathname(pathname);
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY)
      if (raw) {
        const ids = JSON.parse(raw) as string[]
        setIsFavorite(ids.includes(stationId))
      }
    } catch {}
  }, [stationId])

  const toggleFavorite = () => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY)
      const ids: string[] = raw ? JSON.parse(raw) : []
      const next = isFavorite
        ? ids.filter(id => id !== stationId)
        : [...ids, stationId]
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
      setIsFavorite(!isFavorite)
    } catch {}
    trackUmamiEvent(
      buildCtaClickEvent({
        surface: 'public',
        routeKey,
        ctaId: isFavorite ? 'unfavorite_station' : 'favorite_station',
        source: 'station_detail',
        entityType: 'station',
      }),
    )
  }

  return (
    <button
      onClick={toggleFavorite}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
        isFavorite
          ? 'border-amber-400/50 bg-amber-500/12 text-amber-300'
          : 'border-[var(--border)] bg-[var(--secondary)] text-[var(--muted)] hover:border-[var(--primary)]/40'
      }`}
    >
      {isFavorite ? '★ Favorita' : '☆ Marcar favorita'}
    </button>
  )
}