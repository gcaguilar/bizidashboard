'use client';

import { useLocation, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { appRoutes } from '@/lib/routes';
import { parseJsonStringArray, useStorageValue } from '@/lib/use-storage-value';
import {
  buildSearchSubmitEvent,
  resolveRouteKeyFromPathname,
  trackUmamiEvent,
} from '@/lib/umami';

const FAVORITES_KEY = 'bizidashboard-favorite-stations';
const EMPTY_FAVORITE_IDS: string[] = [];

type StationSuggestion = {
  id: string;
  name: string;
  bikesAvailable: number;
};

type PublicSearchFormProps = {
  className?: string;
  placeholder?: string;
  defaultQuery?: string;
  buttonLabel?: string;
  eventSource?: string;
};

export function PublicSearchForm({
  className,
  placeholder = 'Busca una estación por nombre o ID',
  defaultQuery = '',
  buttonLabel = 'Buscar',
  eventSource = 'public_search',
}: PublicSearchFormProps) {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const blurTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const [query, setQuery] = useState(defaultQuery);
  const [stations, setStations] = useState<StationSuggestion[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const favoriteIds = useStorageValue(FAVORITES_KEY, parseJsonStringArray, EMPTY_FAVORITE_IDS);

  const suggestions = useMemo(() => {
    if (query.length < 2) {
      return [];
    }

    const q = query.toLowerCase();
    const matches = stations.filter(
      (s) => s.name.toLowerCase().includes(q) || s.id.includes(q),
    );
    const sorted = [...matches].sort((a, b) => {
      const aFav = favoriteIds.includes(a.id) ? 1 : 0;
      const bFav = favoriteIds.includes(b.id) ? 1 : 0;
      return bFav - aFav;
    });

    return sorted.slice(0, 8);
  }, [query, stations, favoriteIds]);
  const showSuggestions = isFocused && suggestions.length > 0;

  useEffect(() => {
    const controller = new AbortController();
    fetch(appRoutes.api.stations(), { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data?.stations) setStations(data.stations);
      })
      .catch(() => {})
    return () => controller.abort();
  }, []);

  useEffect(() => {
    return () => clearTimeout(blurTimerRef.current);
  }, []);

  const selectSuggestion = useCallback(
    (station: StationSuggestion) => {
      setIsFocused(false);
      setQuery('');
      void navigate({ to: appRoutes.stationDetail(station.id) });
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
        Buscar estación
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
              {suggestions.map((station, i) => (
                <li
                  key={station.id}
                  role="option"
                  aria-selected={i === selectedIndex}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectSuggestion(station);
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors ${
                    i === selectedIndex
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'text-[var(--foreground)] hover:bg-[var(--secondary)]'
                  }`}
                >
                  <span className="truncate">
                    {favoriteIds.includes(station.id) && (
                      <span className="mr-1 text-[var(--warning)]" aria-label="Favorita">★</span>
                    )}
                    {station.name}{' '}
                    <span className="text-[11px] text-[var(--muted)]">(#{station.id})</span>
                  </span>
                  <span className="ml-2 shrink-0 text-xs text-[var(--muted)]">
                    {station.bikesAvailable} <span className="text-[10px]">bicis</span>
                  </span>
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
