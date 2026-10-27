'use client';

import { useMemo } from 'react';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { StationFavoriteButton } from '@/components/StationFavoriteButton';
import type { StationSnapshot } from '@/lib/api-types';
import { buildStationCurrentLabel, buildStationStatusLabel } from '@/lib/home-diagnosis';
import { getCitizenMarkerColor } from '@/lib/map-colors';
import { appRoutes } from '@/lib/routes';
import { useFavoriteStations } from '@/lib/use-favorite-stations';

export type HomeFavoriteStationsProps = {
  stations: StationSnapshot[];
  className?: string;
};

/**
 * "Mis estaciones": favoritas guardadas solo en este navegador. En servidor y
 * durante la hidratación no hay favoritas, por lo que se muestra el estado
 * vacío y luego se rellena sin desajustes de hidratación.
 */
export function HomeFavoriteStations({ stations, className }: HomeFavoriteStationsProps) {
  const { favoriteStationIds } = useFavoriteStations();

  const favoriteStations = useMemo(() => {
    const byId = new Map(stations.map((station) => [station.id, station]));

    return favoriteStationIds
      .map((id) => byId.get(id))
      .filter((station): station is StationSnapshot => station !== undefined);
  }, [stations, favoriteStationIds]);

  return (
    <section className={className} aria-labelledby="home-favorites-title">
      <h2 id="home-favorites-title" className="text-xl font-black text-[var(--foreground)]">
        Mis estaciones
      </h2>

      {favoriteStations.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--muted)]">
          Marca una estación con la estrella ☆ y la verás aquí con su estado actual. Se guarda solo
          en este navegador, sin cuenta ni avisos.
        </p>
      ) : (
        <>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Guardadas solo en este navegador. Estado en la última muestra.
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
                  className="ui-surface-block ui-surface-block-interactive block pr-14"
                >
                  <p className="text-sm font-semibold text-[var(--foreground)]">{station.name}</p>
                  <p
                    className="mt-1 text-xs font-semibold"
                    style={{ color: getCitizenMarkerColor(station) }}
                  >
                    {buildStationStatusLabel(station)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {buildStationCurrentLabel(station)}
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
