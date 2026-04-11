'use client';

import { usePathname } from 'next/navigation';
import { appRoutes } from '@/lib/routes';
import {
  buildSearchSubmitEvent,
  resolveRouteKeyFromPathname,
  trackUmamiEvent,
} from '@/lib/umami';

type PublicSearchFormProps = {
  className?: string;
  placeholder?: string;
  defaultQuery?: string;
  buttonLabel?: string;
  eventSource?: string;
};

export function PublicSearchForm({
  className,
  placeholder = 'Busca estaciones, barrios, informes o endpoints API',
  defaultQuery = '',
  buttonLabel = 'Buscar',
  eventSource = 'public_search',
}: PublicSearchFormProps) {
  const pathname = usePathname();

  return (
    <form
      action={appRoutes.explore()}
      method="get"
      onSubmit={(event) => {
        const query = String(new FormData(event.currentTarget).get('q') ?? '').trim();
        trackUmamiEvent(
          buildSearchSubmitEvent({
            surface: 'public',
            routeKey: resolveRouteKeyFromPathname(pathname),
            source: eventSource,
            queryLength: query.length,
          })
        );
      }}
      className={`flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 ${className ?? ''}`.trim()}
    >
      <label htmlFor="public-search" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
        Buscador global
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="public-search"
          name="q"
          type="search"
          defaultValue={defaultQuery}
          placeholder={placeholder}
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        />
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        >
          {buttonLabel}
        </button>
      </div>
    </form>
  );
}
