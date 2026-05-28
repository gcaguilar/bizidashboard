'use client'
import { useEffect, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
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
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setIsFavorite(parsed.includes(stationId))
      }
    } catch {}
  }, [stationId])

  const toggleFavorite = () => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      const ids: string[] = Array.isArray(parsed) ? parsed : []
      const nextFavorite = !isFavorite
      const next = nextFavorite
        ? [...ids, stationId]
        : ids.filter(id => id !== stationId)
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
      setIsFavorite(nextFavorite)
      trackUmamiEvent(
        buildCtaClickEvent({
          surface: 'public',
          routeKey,
          ctaId: nextFavorite ? 'favorite_station' : 'unfavorite_station',
          source: 'station_detail',
          entityType: 'station',
        }),
      )
    } catch {}
  }

  return (
    <Button
      type="button"
      onClick={toggleFavorite}
      variant="outline"
      size="sm"
      aria-pressed={isFavorite}
      className={`text-xs ${
        isFavorite
          ? 'border-[var(--warning)]/50 bg-[var(--warning)]/12 text-[var(--warning)] hover:border-[var(--warning)]/70 hover:bg-[var(--warning)]/16'
          : ''
      }`}
    >
      {isFavorite ? '★ Favorita' : '☆ Marcar favorita'}
    </Button>
  )
}
