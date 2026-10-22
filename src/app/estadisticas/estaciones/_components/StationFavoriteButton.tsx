'use client'
import { useLocation } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useFavoriteStations } from '@/app/dashboard/_components/useFavoriteStations'
import {
  trackUmamiEvent,
  buildCtaClickEvent,
  resolveRouteKeyFromPathname,
} from '@/lib/umami'

type StationFavoriteButtonProps = {
  stationId: string
}

export function StationFavoriteButton({ stationId }: StationFavoriteButtonProps) {
  const pathname = useLocation().pathname;
  const routeKey = resolveRouteKeyFromPathname(pathname);
  const { favoriteStationIds, toggleFavoriteStation } = useFavoriteStations()
  const isFavorite = favoriteStationIds.includes(stationId)

  const toggleFavorite = () => {
    const nextFavorite = !isFavorite
    toggleFavoriteStation(stationId)
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
