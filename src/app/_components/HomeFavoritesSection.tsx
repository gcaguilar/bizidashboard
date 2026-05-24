'use client';

import { useEffect, useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import type { StationSeoSummary } from '@/lib/seo-stations';
import { appRoutes } from '@/lib/routes';
import { formatPercent, formatInteger } from '@/lib/format';
import {
  trackUmamiEvent,
  buildEntitySelectEvent,
  resolveRouteKeyFromPathname,
} from '@/lib/umami';

const FAVORITES_KEY = 'bizidashboard-favorite-stations';

type HomeFavoritesSectionProps = {
  stationRows: StationSeoSummary[];
};

export function HomeFavoritesSection({ stationRows }: HomeFavoritesSectionProps) {
  const pathname = useLocation().pathname;
  const routeKey = resolveRouteKeyFromPathname(pathname);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) setFavoriteIds(JSON.parse(raw));
    } catch {}
  }, []);

  const favorites = stationRows
    .filter((s) => favoriteIds.includes(s.station.id))
    .slice(0, 5);

  if (favorites.length === 0) {
    return (
      <div className="ui-section-card">
        <p className="stat-label">Tus favoritas</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Marca favoritas desde el dashboard para verlas aquí.
        </p>
      </div>
    );
  }

  const criticalFavorites = favorites.filter(
    (s) => s.station.bikesAvailable === 0 || s.station.anchorsFree === 0
  );

  return (
    <div className="ui-section-card">
      <div className="flex items-center justify-between gap-2">
        <p className="stat-label">Tus favoritas</p>
        {criticalFavorites.length > 0 && (
          <span className="rounded-full bg-[var(--danger)]/12 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--danger)]">
            {criticalFavorites.length} necesitan atención
          </span>
        )}
      </div>
      <div className="mt-2 space-y-2">
        {favorites.map((s) => {
          const isEmpty = s.station.bikesAvailable === 0;
          const isFull = s.station.anchorsFree === 0;
          const hasAlert = isEmpty || isFull;
          return (
            <a
              key={s.station.id}
              href={appRoutes.stationDetail(s.station.id)}
              className={`ui-surface-block ui-surface-block-interactive ${hasAlert ? 'ring-1 ring-red-500/20' : ''}`}
              onClick={() =>
                trackUmamiEvent(
                  buildEntitySelectEvent({
                    surface: 'public',
                    routeKey,
                    entityType: 'station',
                    source: 'home_favorites',
                    module: s.station.id,
                  }),
                )
              }
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--foreground)]">{s.station.name}</p>
                {hasAlert && (
                  <span className="shrink-0 rounded bg-[var(--danger)]/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--danger)]">
                    {isEmpty ? 'Vacía' : 'Llena'}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
                <span>{formatInteger(s.station.bikesAvailable)} bicis</span>
                <span>{formatInteger(s.station.anchorsFree)} huecos</span>
                <span>{formatPercent(s.currentOccupancy)} ocupación</span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
