'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import type { StationSeoSummary } from '@/lib/seo-stations';
import { appRoutes } from '@/lib/routes';
import { formatPercent, formatInteger } from '@/lib/format';
import {
  trackUmamiEvent,
  buildFilterChangeEvent,
  resolveRouteKeyFromPathname,
} from '@/lib/umami';

const FAVORITES_KEY = 'bizidashboard-favorite-stations';

type FilterKey = 'todas' | 'con-bicis' | 'con-huecos' | 'casi-vacias' | 'casi-llenas' | 'favoritas';

type SortKey = 'bicis' | 'huecos' | 'usadas' | 'problematicas' | 'ocupacion' | 'nombre';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'con-bicis', label: 'Con bicis' },
  { key: 'con-huecos', label: 'Con huecos' },
  { key: 'casi-vacias', label: 'Casi vacías' },
  { key: 'casi-llenas', label: 'Casi llenas' },
  { key: 'favoritas', label: 'Favoritas' },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'bicis', label: 'Bicis disponibles' },
  { key: 'huecos', label: 'Huecos libres' },
  { key: 'usadas', label: 'Más usadas' },
  { key: 'problematicas', label: 'Con más problemas' },
  { key: 'ocupacion', label: 'Nivel de uso' },
  { key: 'nombre', label: 'Nombre' },
];

function stationBadge(s: StationSeoSummary): { label: string; variant: string } {
  if (s.station.bikesAvailable === 0) return { label: 'Vacía', variant: 'border-[var(--danger)] text-[var(--danger)] bg-[var(--danger)]/10' };
  if (s.station.anchorsFree === 0) return { label: 'Llena', variant: 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10' };
  if (s.turnover && s.turnover.turnoverScore > 0.8) return { label: 'Muy usada', variant: 'border-[var(--warning)] text-[var(--warning)] bg-[var(--warning)]/10' };
  return { label: 'Sin problemas', variant: 'border-[var(--success)] text-[var(--success)] bg-[var(--success)]/10' };
}

type StationsDirectoryProps = {
  stationRows: StationSeoSummary[];
};

export function StationsDirectory({ stationRows }: StationsDirectoryProps) {
  const pathname = useLocation().pathname;
  const routeKey = resolveRouteKeyFromPathname(pathname);
  const [filter, setFilter] = useState<FilterKey>('todas');
  const [sort, setSort] = useState<SortKey>('bicis');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) setFavoriteIds(JSON.parse(raw));
    } catch {}
  }, []);

  const filteredAndSorted = useMemo(() => {
    let result = [...stationRows];

    switch (filter) {
      case 'con-bicis':
        result = result.filter((s) => s.station.bikesAvailable > 0);
        break;
      case 'con-huecos':
        result = result.filter((s) => s.station.anchorsFree > 0);
        break;
      case 'casi-vacias':
        result = result.filter((s) => s.currentOccupancy < 0.15);
        break;
      case 'casi-llenas':
        result = result.filter((s) => s.currentOccupancy > 0.85);
        break;
      case 'favoritas':
        result = result.filter((s) => favoriteIds.includes(s.station.id));
        break;
    }

    switch (sort) {
      case 'bicis':
        result.sort((a, b) => b.station.bikesAvailable - a.station.bikesAvailable);
        break;
      case 'huecos':
        result.sort((a, b) => b.station.anchorsFree - a.station.anchorsFree);
        break;
      case 'usadas':
        result.sort((a, b) => (b.turnover?.turnoverScore ?? 0) - (a.turnover?.turnoverScore ?? 0));
        break;
      case 'problematicas':
        result.sort((a, b) => {
          const aScore = (a.turnover?.emptyHours ?? 0) + (a.turnover?.fullHours ?? 0);
          const bScore = (b.turnover?.emptyHours ?? 0) + (b.turnover?.fullHours ?? 0);
          return bScore - aScore;
        });
        break;
      case 'ocupacion':
        result.sort((a, b) => b.currentOccupancy - a.currentOccupancy);
        break;
      case 'nombre':
        result.sort((a, b) => a.station.name.localeCompare(b.station.name));
        break;
    }

    return result;
  }, [stationRows, filter, sort, favoriteIds]);

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              setFilter(f.key);
              trackUmamiEvent(
                buildFilterChangeEvent({
                  surface: 'public',
                  routeKey,
                  module: 'stations_directory',
                  source: 'filter',
                  destination: f.key,
                  resultCount: filteredAndSorted.length,
                }),
              );
            }}
            className={`ui-chip ${filter === f.key ? 'border-[var(--primary)] bg-[var(--primary)] text-white' : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sort dropdown */}
      <div className="flex items-center gap-2">
        <label htmlFor="stations-sort" className="stat-label text-sm">Ordenar por:</label>
        <select
          id="stations-sort"
          value={sort}
          onChange={(e) => {
              setSort(e.target.value as SortKey);
              trackUmamiEvent(
                buildFilterChangeEvent({
                  surface: 'public',
                  routeKey,
                  module: 'stations_directory',
                  source: 'sort',
                  destination: e.target.value,
                  resultCount: filteredAndSorted.length,
                }),
              );
            }}
          className="ui-surface-block rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm w-full sm:w-auto"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-[var(--muted)]">
          {filteredAndSorted.length} {filteredAndSorted.length === 1 ? 'estación' : 'estaciones'}
        </span>
      </div>

      {/* Empty state */}
      {filteredAndSorted.length === 0 && (
        <p className="py-12 text-center text-sm text-[var(--muted)]">
          Ninguna estación cumple ese filtro ahora mismo.
        </p>
      )}

      {/* Station cards grid */}
      {filteredAndSorted.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAndSorted.map((s) => {
            const badge = stationBadge(s);
            const isFav = favoriteIds.includes(s.station.id);

            return (
              <div key={s.station.id} className="ui-metric-card flex flex-col gap-2">
                <a
                  href={appRoutes.stationDetail(s.station.id)}
                  className="ui-surface-block-interactive text-sm font-semibold text-[var(--foreground)] no-underline hover:text-[var(--primary)]"
                >
                  {isFav && <span className="text-[var(--warning)]" aria-label="Favorita">★ </span>}
                  {s.station.name}
                </a>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
                  <span>{formatInteger(s.station.bikesAvailable)} bicis</span>
                  <span>{formatInteger(s.station.anchorsFree)} huecos</span>
                  <span>Cap. {formatInteger(s.station.capacity)}</span>
                </div>

                {/* Occupancy bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: formatPercent(s.currentOccupancy),
                      backgroundColor: s.currentOccupancy > 0.85 ? 'var(--primary)' : s.currentOccupancy < 0.15 ? 'var(--muted)' : 'var(--accent)',
                    }}
                  />
                </div>

                {/* Badge */}
                <span className={`self-start rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.variant}`}>
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
