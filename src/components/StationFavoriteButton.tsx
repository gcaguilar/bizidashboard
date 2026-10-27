'use client'
import { useLocation } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n/use-locale'
import { useFavoriteStations } from '@/lib/use-favorite-stations'
import { cn } from '@/lib/utils'
import {
  trackUmamiEvent,
  buildCtaClickEvent,
  resolveRouteKeyFromPathname,
} from '@/lib/umami'

type StationFavoriteButtonProps = {
  stationId: string
  stationName?: string
  /** Botón con texto (ficha) o solo estrella (listas). */
  variant?: 'labeled' | 'icon'
  /** Origen para la analítica agregada. */
  source?: string
  className?: string
}

const ACTIVE_CLASSES =
  'border-[var(--warning)]/50 bg-[var(--warning)]/12 text-[var(--warning)] hover:border-[var(--warning)]/70 hover:bg-[var(--warning)]/16'

/** Único botón de favorito de estación: ficha, listas y bloque "Mis estaciones". */
export function StationFavoriteButton({
  stationId,
  stationName,
  variant = 'labeled',
  source = 'station_detail',
  className,
}: StationFavoriteButtonProps) {
  const { t } = useT()
  const pathname = useLocation().pathname
  const routeKey = resolveRouteKeyFromPathname(pathname)
  const { favoriteStationIds, toggleFavoriteStation } = useFavoriteStations()
  const isFavorite = favoriteStationIds.includes(stationId)

  const toggleFavorite = () => {
    toggleFavoriteStation(stationId)
    trackUmamiEvent(
      buildCtaClickEvent({
        surface: 'public',
        routeKey,
        ctaId: isFavorite ? 'unfavorite_station' : 'favorite_station',
        source,
        entityType: 'station',
      }),
    )
  }

  if (variant === 'icon') {
    const actionLabel = isFavorite ? t('favorite.remove') : t('favorite.add')

    return (
      <Button
        type="button"
        onClick={toggleFavorite}
        variant="outline"
        size="icon"
        aria-pressed={isFavorite}
        aria-label={stationName ? `${actionLabel}: ${stationName}` : actionLabel}
        title={actionLabel}
        className={cn('h-8 w-8 text-base', isFavorite && ACTIVE_CLASSES, className)}
      >
        <span aria-hidden="true">{isFavorite ? '★' : '☆'}</span>
      </Button>
    )
  }

  return (
    <Button
      type="button"
      onClick={toggleFavorite}
      variant="outline"
      size="sm"
      aria-pressed={isFavorite}
      className={cn('text-xs', isFavorite && ACTIVE_CLASSES, className)}
    >
      {isFavorite ? t('favorite.labeledOn') : t('favorite.labeledOff')}
    </Button>
  )
}
