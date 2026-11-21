'use client';

import { useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useT } from '@/lib/i18n/use-locale';
import { appRoutes } from '@/lib/routes';
import {
  buildSearchClearEvent,
  buildSearchNoResultsEvent,
  buildSearchResultSelectEvent,
  buildSearchResultsViewEvent,
  resolveRouteKeyFromPathname,
  trackEvent,
  type AnalyticsEntityType,
} from '@/lib/analytics';
import { searchHeaderContent, type HeaderSearchResult } from '@/server-functions/global-search';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 200;
const ALL_RESULTS_VALUE = '__all_results__';

/** Grupos fijos del buscador global; nunca se envía el id ni el título del resultado. */
function entityTypeForGroup(group: string): AnalyticsEntityType | undefined {
  if (group === 'stations') return 'station';
  if (group === 'districts') return 'district';
  if (group === 'reports') return 'report';
  if (group === 'api') return 'api';
  return undefined;
}

/**
 * Buscador global de la cabecera: estaciones, barrios, informes, páginas y API.
 * Usa `Command` del sistema de diseño y la búsqueda de `lib/global-search.ts`
 * (vía server function); "Ver todos los resultados" lleva a `/explorar?q=`.
 */
export function HeaderSearch() {
  const navigate = useNavigate();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [fetched, setFetched] = useState<{ query: string; results: HeaderSearchResult[] }>({
    query: '',
    results: [],
  });

  const trimmed = query.trim();
  const active = trimmed.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!open || !active) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      searchHeaderContent({ data: { q: trimmed } })
        .then((results) => {
          if (!cancelled) setFetched({ query: trimmed, results });
        })
        .catch(() => {
          if (!cancelled) setFetched({ query: trimmed, results: [] });
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, active, trimmed]);

  const results = useMemo(
    () => (active && fetched.query === trimmed ? fetched.results : []),
    [active, fetched, trimmed],
  );
  const loading = active && fetched.query !== trimmed;

  const pathname = useLocation().pathname;
  const routeKey = resolveRouteKeyFromPathname(pathname);
  const surface = pathname?.startsWith('/dashboard') ? ('dashboard' as const) : ('public' as const);

  const lastSearchRef = useRef<string | null>(null);
  useEffect(() => {
    if (!active || loading) {
      return;
    }

    const key = `${trimmed}|${results.length > 0}`;
    if (lastSearchRef.current === key) {
      return;
    }
    lastSearchRef.current = key;

    const base = { surface, routeKey, source: 'header_search', searchType: 'global' };
    if (results.length === 0) {
      trackEvent(buildSearchNoResultsEvent({ ...base, queryLength: trimmed.length }));
      return;
    }
    trackEvent(buildSearchResultsViewEvent({ ...base, resultsCount: results.length }));
  }, [active, loading, results.length, routeKey, surface, trimmed]);

  const trackSearchClear = () => {
    trackEvent(buildSearchClearEvent({
      surface,
      routeKey,
      source: 'header_search',
      searchType: 'global',
    }));
  };

  const resultsByHref = useMemo(
    () => new Map(results.map((result) => [result.id, result])),
    [results],
  );

  const groups = useMemo(() => {
    const byGroup = new Map<string, { title: string; items: HeaderSearchResult[] }>();
    for (const result of results) {
      const entry = byGroup.get(result.group) ?? { title: result.groupTitle, items: [] };
      entry.items.push(result);
      byGroup.set(result.group, entry);
    }
    return [...byGroup.entries()];
  }, [results]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const handleSelect = (value: string) => {
    if (value === ALL_RESULTS_VALUE) {
      trackEvent(buildSearchResultSelectEvent({
        surface,
        routeKey,
        source: 'header_search',
        searchType: 'global',
        section: 'view_all',
        action: 'navigate',
      }));
      void navigate({ to: appRoutes.exploreHub(), search: { q: trimmed } });
      close();
      return;
    }

    const result = resultsByHref.get(value);
    if (!result) {
      return;
    }

    trackEvent(buildSearchResultSelectEvent({
      surface,
      routeKey,
      source: 'header_search',
      searchType: 'global',
      entityType: entityTypeForGroup(result.group),
      section: 'global_results',
      action: 'navigate',
    }));
    const [path, hash] = result.href.split('#');
    void navigate({ to: path, hash: hash || undefined });
    close();
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next && query.length > 0) {
          trackSearchClear();
        }
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <PopoverTrigger
        aria-label={t('search.open')}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-[var(--muted)] outline-none transition hover:text-[var(--foreground)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
      >
        <span aria-hidden="true">🔍</span>
        <span className="hidden lg:inline">{t('search.trigger')}</span>
      </PopoverTrigger>
      <PopoverContent className="w-[min(100vw-1.5rem,26rem)]">
        <Command
          value={null}
          onValueChange={(next) => {
            if (typeof next === 'string' && next) handleSelect(next);
          }}
          onInputValueChange={(next) => setQuery(next)}
          itemToStringLabel={(next) => resultsByHref.get(String(next))?.title ?? String(next)}
        >
          <CommandInput placeholder={t('search.placeholder')} autoFocus />
          <CommandList className="mt-2 max-h-80">
            {!active ? (
              <p className="px-3 py-3 text-sm text-[var(--muted)]">
                {t('search.minChars', { count: MIN_QUERY_LENGTH })}
              </p>
            ) : null}
            {loading ? (
              <p className="px-3 py-3 text-sm text-[var(--muted)]">{t('search.loading')}</p>
            ) : null}
            {groups.map(([groupId, group]) => (
              <CommandGroup key={groupId}>
                <p className="px-3 pt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                  {group.title}
                </p>
                {group.items.map((item) => (
                  <CommandItem key={item.id} value={item.id}>
                    <span className="truncate">{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            {active && !loading && results.length === 0 ? (
              <CommandEmpty>{t('search.empty')}</CommandEmpty>
            ) : null}
            {active ? (
              <CommandGroup>
                <CommandItem value={ALL_RESULTS_VALUE}>
                  <span className="text-[var(--primary)]">{t('search.viewAll')}</span>
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
