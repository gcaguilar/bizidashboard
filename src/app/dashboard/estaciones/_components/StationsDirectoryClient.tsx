'use client';

import { useMemo, useState } from 'react';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DataStateNotice } from '@/app/_components/DataStateNotice';
import type { StationSnapshot } from '@/lib/api-types';
import { resolveDataState, shouldShowDataStateNotice, type DataState } from '@/lib/data-state';
import { formatPercent } from '@/lib/format';
import { appRoutes } from '@/lib/routes';
import { buildEntitySelectEvent } from '@/lib/umami';
import { DashboardPageViewTracker } from '@/app/dashboard/_components/DashboardPageViewTracker';
import { GitHubRepoButton } from '@/app/dashboard/_components/GitHubRepoButton';
import { ThemeToggleButton } from '@/app/dashboard/_components/ThemeToggleButton';
import { PageHeaderCard } from '@/components/layout/page-header-card';
import { PageShell } from '@/components/layout/page-shell';

// Dashboard sections contract: dashboard, stations, flow, conclusions, redistribucion, help.

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
      <PageHeaderCard className="bg-[var(--card)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">Estaciones</p>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Directorio de estaciones</h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ThemeToggleButton />
            <GitHubRepoButton />
          </div>
        </div>
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
              : 'El directorio usa los mismos datos que el dashboard principal.'
          }
          href={appRoutes.status()}
          actionLabel="Revisar estado"
        />
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredStations.map((station) => {
          const occupancy = station.capacity > 0 ? station.bikesAvailable / station.capacity : 0;

          return (
            <Card key={station.id}>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">ID {station.id}</p>
              <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">{station.name}</h2>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[var(--muted)]">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em]">Bicis</p>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{station.bikesAvailable}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em]">Huecos</p>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{station.anchorsFree}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em]">Ocupacion</p>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{formatPercent(occupancy)}</p>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-3 border-[var(--primary)] text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white"
              >
                <TrackedLink
                  href={appRoutes.dashboardStation(station.id)}
                  trackingEvent={buildEntitySelectEvent({
                    surface: 'dashboard',
                    routeKey: 'dashboard_stations',
                    entityType: 'station',
                    source: 'stations_directory',
                    module: 'station_card',
                  })}
                >
                  Ver detalle
                </TrackedLink>
              </Button>
            </Card>
          );
        })}
      </section>
    </PageShell>
  );
}
