'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { StationSnapshot } from '@/lib/api';
import { formatPercent } from '@/lib/format';
import { DashboardRouteLinks } from '../../_components/DashboardRouteLinks';
import { GitHubRepoButton } from '../../_components/GitHubRepoButton';
import { ThemeToggleButton } from '../../_components/ThemeToggleButton';

type StationsDirectoryClientProps = {
  stations: StationSnapshot[];
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function StationsDirectoryClient({ stations }: StationsDirectoryClientProps) {
  const [query, setQuery] = useState('');

  const filteredStations = useMemo(() => {
    const normalized = normalize(query);

    if (!normalized) {
      return stations;
    }

    return stations.filter((station) => {
      const searchable = normalize(`${station.id} ${station.name}`);
      return searchable.includes(normalized);
    });
  }, [query, stations]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
      <header className="sticky top-0 z-40 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">Estaciones</p>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Directorio de estaciones</h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <DashboardRouteLinks
              activeRoute="stations"
              routes={['dashboard', 'stations', 'flow', 'conclusions', 'help']}
              variant="inline"
              className="hidden items-center gap-5 md:flex"
            />
            <DashboardRouteLinks
              activeRoute="stations"
              routes={['dashboard', 'stations', 'flow', 'conclusions', 'help']}
              variant="chips"
              className="flex flex-wrap items-center gap-2 md:hidden"
            />
            <ThemeToggleButton />
            <GitHubRepoButton />
          </div>
        </div>
        <label className="mt-3 flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
            placeholder="Buscar por nombre o ID"
          />
        </label>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredStations.map((station) => {
          const occupancy = station.capacity > 0 ? station.bikesAvailable / station.capacity : 0;

          return (
            <article
              key={station.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]"
            >
              <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">ID {station.id}</p>
              <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">{station.name}</h2>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[var(--muted)]">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em]">Bicis</p>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{station.bikesAvailable}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em]">Anclajes</p>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{station.anchorsFree}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em]">Ocupacion</p>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{formatPercent(occupancy)}</p>
                </div>
              </div>
              <Link
                href={`/dashboard/estaciones/${encodeURIComponent(station.id)}`}
                className="mt-3 inline-flex rounded-lg border border-[var(--accent)] px-3 py-1.5 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
              >
                Ver detalle
              </Link>
            </article>
          );
        })}
      </section>
    </main>
  );
}
