'use client';

import { useMemo, useState } from 'react';
import { CitySwitcher } from '@/app/_components/CitySwitcher';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DataStateNotice } from '@/app/_components/DataStateNotice';
import type { StationSnapshot } from '@/lib/api';
import { resolveDataState, shouldShowDataStateNotice, type DataState } from '@/lib/data-state';
import { formatPercent } from '@/lib/format';
import { appRoutes } from '@/lib/routes';
import { buildEntitySelectEvent } from '@/lib/umami';
import { DashboardPageViewTracker } from '../../_components/DashboardPageViewTracker';
import { DashboardRouteLinks } from '../../_components/DashboardRouteLinks';
import { GitHubRepoButton } from '../../_components/GitHubRepoButton';
import { ThemeToggleButton } from '../../_components/ThemeToggleButton';
import { PageHeaderCard } from '@/components/layout/page-header-card';
import { PageShell } from '@/components/layout/page-shell';

type StationsDirectoryClientProps = {
  stations: StationSnapshot[];
  dataState: DataState;
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function StationsDirectoryClient({ stations, dataState }: StationsDirectoryClientProps) {
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

  const directoryDataState = query.trim()
    ? resolveDataState({
        hasCoverage: dataState !== 'no_coverage',
        hasData: filteredStations.length > 0,
      })
    : dataState;

  return (
    <PageShell>
      <DashboardPageViewTracker
        routeKey="dashboard_stations"
        pageType="dashboard"
        template="stations_directory"
      />
      <PageHeaderCard className="z-40 bg-[var(--card)]">
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
        <CitySwitcher compact className="mt-3" />
        <div className="mt-3">
          <label htmlFor="stations-directory-search" className="sr-only">
            Buscar por nombre o ID
          </label>
          <Input
            id="stations-directory-search"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="bg-[var(--secondary)]"
            placeholder="Buscar por nombre o ID"
          />
        </div>
      </PageHeaderCard>

      {shouldShowDataStateNotice(directoryDataState) ? (
        <DataStateNotice
          state={directoryDataState}
          subject="el directorio de estaciones"
          description={
            query.trim()
              ? 'No hay estaciones que coincidan con la busqueda actual.'
              : 'El directorio usa el mismo snapshot compartido que el dashboard principal.'
          }
          href={appRoutes.status()}
          actionLabel="Ver estado"
        />
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredStations.map((station) => {
          const occupancy = station.capacity > 0 ? station.bikesAvailable / station.capacity : 0;

          return (
            <Card
              key={station.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-soft)]"
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
              <TrackedLink
                href={appRoutes.dashboardStation(station.id)}
                trackingEvent={buildEntitySelectEvent({
                  surface: 'dashboard',
                  routeKey: 'dashboard_stations',
                  entityType: 'station',
                  source: 'stations_directory',
                  module: 'station_card',
                })}
                className={buttonVariants({
                  variant: 'outline',
                  size: 'sm',
                  className:
                    'mt-3 min-h-0 border-[var(--primary)] px-3 py-1.5 text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white',
                })}
              >
                Ver detalle
              </TrackedLink>
            </Card>
          );
        })}
      </section>
    </PageShell>
  );
}
