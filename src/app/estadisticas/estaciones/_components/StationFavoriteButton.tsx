'use client'
import { useLocation } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  parseJsonStringArray,
  readStorageText,
  useStorageValue,
  writeStorageText,
} from '@/lib/use-storage-value'
import {
  trackUmamiEvent,
  buildCtaClickEvent,
  resolveRouteKeyFromPathname,
} from '@/lib/umami'

const FAVORITES_KEY = 'bizidashboard-favorite-stations'
const EMPTY_FAVORITE_IDS: string[] = []

type StationFavoriteButtonProps = {
  stationId: string
}

export function StationFavoriteButton({ stationId }: StationFavoriteButtonProps) {
  const pathname = useLocation().pathname;
  const routeKey = resolveRouteKeyFromPathname(pathname);
  const favoriteIds = useStorageValue(FAVORITES_KEY, parseJsonStringArray, EMPTY_FAVORITE_IDS)
  const isFavorite = favoriteIds.includes(stationId)

  const toggleFavorite = () => {
    const ids = parseJsonStringArray(readStorageText(FAVORITES_KEY))
    const nextFavorite = !isFavorite
    const next = nextFavorite
      ? [...ids, stationId]
      : ids.filter(id => id !== stationId)
    writeStorageText(FAVORITES_KEY, JSON.stringify(next))
    trackUmamiEvent(
      buildCtaClickEvent({
        surface: 'public',
        routeKey,
        ctaId: nextFavorite ? 'favorite_station' : 'unfavorite_station',
        source: 'station_detail',
        entityType: 'station',
      }),
    )
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
