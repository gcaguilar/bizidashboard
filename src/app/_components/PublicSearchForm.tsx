'use client';

import { useLocation, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { appRoutes } from '@/lib/routes';
import type { DistrictOption } from '@/server-functions/home';
import { useFavoriteStations } from '@/lib/use-favorite-stations';
import {
  buildSearchSubmitEvent,
  resolveRouteKeyFromPathname,
  trackUmamiEvent,
} from '@/lib/umami';

const MAX_SUGGESTIONS = 8;

export type StationSuggestion = {
  id: string;
  name: string;
  bikesAvailable: number;
};

type SearchSuggestion =
  | { kind: 'station'; station: StationSuggestion }
  | { kind: 'district'; district: DistrictOption };

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

type PublicSearchFormProps = {
  className?: string;
  placeholder?: string;
  defaultQuery?: string;
  buttonLabel?: string;
  /** Etiqueta visible del campo (por defecto, "Buscar estación"). */
  label?: string;
  eventSource?: string;
  /** Fuente de sugerencias ya resuelta (p. ej. la portada); evita el fetch a /api/stations. */
  stations?: StationSuggestion[];
  /** Barrios sugeridos además de estaciones cuando la consulta tiene 2+ caracteres. */
  districts?: DistrictOption[];
};

export function PublicSearchForm({
  className,
  placeholder = 'Busca una estación por nombre o ID',
  defaultQuery = '',
  buttonLabel = 'Buscar',
  label = 'Buscar estación',
  eventSource = 'public_search',
  stations,
  districts,
}: PublicSearchFormProps) {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const blurTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const [query, setQuery] = useState(defaultQuery);
  const [fetchedStations, setFetchedStations] = useState<StationSuggestion[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { favoriteStationIds: favoriteIds } = useFavoriteStations();

  const suggestionPool = stations ?? fetchedStations;

  const suggestions = useMemo<SearchSuggestion[]>(() => {
    if (query.length < 2) {
      return [];
    }

    const q = query.toLowerCase();
    const stationMatches = suggestionPool.filter(
      (s) => s.name.toLowerCase().includes(q) || s.id.includes(q),
    );
    const sortedStations = [...stationMatches].sort((a, b) => {
      const aFav = favoriteIds.includes(a.id) ? 1 : 0;
      const bFav = favoriteIds.includes(b.id) ? 1 : 0;
      return bFav - aFav;
    });

    const stationSuggestions: SearchSuggestion[] = sortedStations
      .slice(0, MAX_SUGGESTIONS)
      .map((station) => ({ kind: 'station', station }));

    const districtSuggestions: SearchSuggestion[] = (districts ?? [])
      .filter((district) => normalizeSearchText(district.name).includes(normalizeSearchText(query)))
      .map((district) => ({ kind: 'district', district }));

    return [...stationSuggestions, ...districtSuggestions].slice(0, MAX_SUGGESTIONS);
  }, [query, suggestionPool, favoriteIds, districts]);
  const showSuggestions = isFocused && suggestions.length > 0;

  useEffect(() => {
    if (stations) {
      return;
    }

    const controller = new AbortController();
    fetch(appRoutes.api.stations(), { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data?.stations) setFetchedStations(data.stations);
      })
      .catch(() => {})
    return () => controller.abort();
  }, [stations]);

  useEffect(() => {
    return () => clearTimeout(blurTimerRef.current);
  }, []);

  const selectSuggestion = useCallback(
    (suggestion: SearchSuggestion) => {
      setIsFocused(false);
      setQuery('');

      if (suggestion.kind === 'district') {
        void navigate({ to: appRoutes.districtDetail(suggestion.district.slug) });
        return;
      }

      void navigate({ to: appRoutes.stationDetail(suggestion.station.id) });
    },
    [navigate],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < suggestions.length) {
      e.preventDefault();
      selectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      setSelectedIndex(-1);
    }
  };

  const trackSubmit = (form: HTMLFormElement) => {
    const raw = new FormData(form).get('q');
    const q = (typeof raw === 'string' ? raw : '').trim();
    trackUmamiEvent(
      buildSearchSubmitEvent({
        surface: 'public',
        routeKey: resolveRouteKeyFromPathname(pathname),
        source: eventSource,
        queryLength: q.length,
      }),
    );
  };

  return (
    <form
      action={appRoutes.explore()}
      method="get"
      onSubmit={(event) => {
        trackSubmit(event.currentTarget);
      }}
      className={`flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-3 ${className ?? ''}`.trim()}
    >
      <label htmlFor="public-search" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
        {label}
      </label>
      <div className="relative flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-1">
          <Input
            ref={inputRef}
            id="public-search"
            name="q"
            type="search"
            value={query}
            placeholder={placeholder}
            autoComplete="off"
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              const timer = setTimeout(() => setIsFocused(false), 150);
              blurTimerRef.current = timer;
            }}
            onKeyDown={handleKeyDown}
            className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          />
          {showSuggestions && (
            <ul
              ref={listRef}
              role="listbox"
              className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg"
            >
              {suggestions.map((suggestion, i) => (
                <li
                  key={suggestion.kind === 'station' ? suggestion.station.id : `district-${suggestion.district.slug}`}
                  role="option"
                  aria-selected={i === selectedIndex}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectSuggestion(suggestion);
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors ${
                    i === selectedIndex
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'text-[var(--foreground)] hover:bg-[var(--secondary)]'
                  }`}
                >
                  {suggestion.kind === 'station' ? (
                    <>
                      <span className="truncate">
                        {favoriteIds.includes(suggestion.station.id) && (
                          <span className="mr-1 text-[var(--warning)]" aria-label="Favorita">★</span>
                        )}
                        {suggestion.station.name}{' '}
                        <span className="text-[11px] text-[var(--muted)]">(#{suggestion.station.id})</span>
                      </span>
                      <span className="ml-2 shrink-0 text-xs text-[var(--muted)]">
                        {suggestion.station.bikesAvailable} <span className="text-[10px]">bicis</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="truncate">{suggestion.district.name}</span>
                      <span className="ml-2 shrink-0 text-[10px] uppercase text-[var(--muted)] border rounded px-1">
                        Barrio
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button type="submit" variant="default" className="min-h-11 shrink-0 whitespace-nowrap px-5">
          {buttonLabel}
        </Button>
      </div>
    </form>
  );
}
