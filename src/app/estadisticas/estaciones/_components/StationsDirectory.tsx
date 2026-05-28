'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import type { StationSeoSummary } from '@/lib/seo-stations';
import { appRoutes } from '@/lib/routes';
import { formatPercent, formatInteger } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectIcon, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

function stationBadge(s: StationSeoSummary): { label: string; variant: 'danger' | 'warning' | 'success' } {
  if (s.station.bikesAvailable === 0) return { label: 'Vacía', variant: 'danger' };
  if (s.station.anchorsFree === 0) return { label: 'Llena', variant: 'warning' };
  if (s.turnover && s.turnover.turnoverScore > 0.8) return { label: 'Muy usada', variant: 'warning' };
  return { label: 'Sin problemas', variant: 'success' };
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
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setFavoriteIds(parsed);
      }
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
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-3 shadow-[var(--shadow-soft)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              type="button"
              variant="chip"
              size="sm"
              aria-pressed={filter === f.key}
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
              className={filter === f.key ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm hover:border-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]' : ''}
            >
              {f.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="stations-sort" className="stat-label text-sm">Ordenar por:</label>
          <Select
            value={sort}
            onValueChange={(value) => {
              setSort(value as SortKey);
              trackUmamiEvent(
                buildFilterChangeEvent({
                  surface: 'public',
                  routeKey,
                  module: 'stations_directory',
                  source: 'sort',
                  destination: value as string,
                  resultCount: filteredAndSorted.length,
                }),
              );
            }}
          >
            <SelectTrigger id="stations-sort" className="min-w-[15rem]">
              <SelectValue />
              <SelectIcon />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-[var(--muted)]">
            {filteredAndSorted.length} {filteredAndSorted.length === 1 ? 'estación' : 'estaciones'}
          </span>
        </div>
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
              <div key={s.station.id} className="ui-surface-block ui-surface-block-interactive space-y-3 p-4">
                <a
                  href={appRoutes.stationDetail(s.station.id)}
                  className="text-sm font-semibold leading-tight text-[var(--foreground)] no-underline hover:text-[var(--primary)]"
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
                <Badge variant={badge.variant} className="self-start">
                  {badge.label}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
