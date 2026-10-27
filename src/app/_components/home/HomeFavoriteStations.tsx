'use client';

import { useMemo } from 'react';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { StationFavoriteButton } from '@/components/StationFavoriteButton';
import type { StationSnapshot } from '@/lib/api-types';
import { formatHourMinute } from '@/lib/format';
import { buildStationCurrentLabel } from '@/lib/home-diagnosis';
import { StationStatusLabel } from '@/components/ui/station-status';
import { useT } from '@/lib/i18n/use-locale';
import { getCitizenStatus, getCitizenStatusDetail } from '@/lib/map-colors';
import { appRoutes } from '@/lib/routes';
import { useFavoriteStations } from '@/lib/use-favorite-stations';

export type HomeFavoriteStationsProps = {
  stations: StationSnapshot[];
  /** La red aún se está pidiendo a /api/stations. */
  isLoading?: boolean;
  /** ISO de la última respuesta de /api/stations; null si aún no hay. */
  refreshedAt?: string | null;
  className?: string;
};

/**
 * "Mis estaciones": favoritas guardadas solo en este navegador. En servidor y
 * durante la hidratación no hay favoritas, por lo que se muestra el estado
 * vacío y luego se rellena sin desajustes de hidratación.
 */
export function HomeFavoriteStations({
  stations,
  isLoading = false,
  refreshedAt = null,
  className,
}: HomeFavoriteStationsProps) {
  const { locale, t } = useT();
  const { favoriteStationIds } = useFavoriteStations();

  const favoriteStations = useMemo(() => {
    const byId = new Map(stations.map((station) => [station.id, station]));

    return favoriteStationIds
      .map((id) => byId.get(id))
      .filter((station): station is StationSnapshot => station !== undefined);
  }, [stations, favoriteStationIds]);

  const showSkeleton = isLoading && favoriteStationIds.length > 0 && favoriteStations.length === 0;

  return (
    <section className={className} aria-labelledby="home-favorites-title">
      <h2 id="home-favorites-title" className="text-xl font-black text-[var(--foreground)]">
        {t('home.favorites.title')}
      </h2>

      {showSkeleton ? (
        <div aria-busy="true">
          <p className="mt-1 text-xs text-[var(--muted)]">{t('home.favorites.updating')}</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteStationIds.slice(0, 6).map((id) => (
              <li key={id} className="ui-surface-block min-h-[5.5rem] animate-pulse" aria-hidden="true" />
            ))}
          </ul>
        </div>
      ) : favoriteStations.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--muted)]">
          {t('home.favorites.empty')}
        </p>
      ) : (
        <>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {t('home.favorites.saved')}{' '}
            {refreshedAt ? (
              <>
                {t('home.favorites.updatedAt')}<time dateTime={refreshedAt}>{formatHourMinute(refreshedAt, undefined, locale)}</time>.
              </>
            ) : (
              t('home.favorites.lastSample')
            )}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteStations.map((station) => (
              <li key={station.id} className="relative">
                <TrackedLink
                  href={appRoutes.stationDetail(station.id)}
                  entitySelectEvent={{
                    source: 'home_favorites',
                    entityType: 'station',
                    module: station.id,
                  }}
                  className="ui-surface-block ui-surface-block-interactive block min-h-[5.5rem] pr-14"
                >
                  <p className="text-sm font-semibold text-[var(--foreground)]">{station.name}</p>
                  <StationStatusLabel
                    status={{ ...getCitizenStatus(station, locale), label: getCitizenStatusDetail(station, locale) }}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {buildStationCurrentLabel(station, locale)}
                  </p>
                </TrackedLink>
                <StationFavoriteButton
                  stationId={station.id}
                  stationName={station.name}
                  variant="icon"
                  source="home_favorites"
                  className="absolute right-3 top-3"
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
