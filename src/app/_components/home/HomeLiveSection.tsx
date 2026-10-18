'use client';

import { useMemo, useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import { PublicSearchForm, type StationSuggestion } from '@/app/_components/PublicSearchForm';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { useFavoriteStations } from '@/app/dashboard/_components/useFavoriteStations';
import { HomeDiagnosis, type HomeDiagnosisFilter } from '@/app/_components/home/HomeDiagnosis';
import { HomeMapSection } from '@/app/_components/home/HomeMapSection';
import { Button } from '@/components/ui/button';
import type { StationSnapshot } from '@/lib/api-types';
import { formatInteger } from '@/lib/format';
import { appRoutes } from '@/lib/routes';
import type { StationSeoSummary } from '@/lib/seo-stations';
import type { DistrictOption } from '@/server-functions/home';
import {
  buildFilterChangeEvent,
  buildObservatoryEvent,
  resolveRouteKeyFromPathname,
  trackUmamiEvent,
} from '@/lib/umami';

const QUICK_FILTERS: { key: HomeDiagnosisFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'bikes', label: '🚲 Con bicis libres' },
  { key: 'anchors', label: '🅿️ Con huecos libres' },
];

export type HomeLiveSectionProps = {
  stations: StationSnapshot[];
  districts: DistrictOption[];
  problemStations: StationSeoSummary[];
  mostUsedStations: StationSeoSummary[];
  className?: string;
};

function applyFilter(station: StationSnapshot, filter: HomeDiagnosisFilter): boolean {
  if (filter === 'bikes') {
    return station.bikesAvailable > 0;
  }

  if (filter === 'anchors') {
    return station.anchorsFree > 0;
  }

  return true;
}

export function HomeLiveSection({
  stations,
  districts,
  problemStations,
  mostUsedStations,
  className,
}: HomeLiveSectionProps) {
  const pathname = useLocation().pathname;
  const routeKey = resolveRouteKeyFromPathname(pathname);
  const [filter, setFilter] = useState<HomeDiagnosisFilter>('all');
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const { favoriteStationIds, toggleFavoriteStation } = useFavoriteStations();

  const filteredStations = useMemo(
    () => stations.filter((station) => applyFilter(station, filter)),
    [stations, filter],
  );

  const searchStations: StationSuggestion[] = useMemo(
    () =>
      stations.map((station) => ({
        id: station.id,
        name: station.name,
        bikesAvailable: station.bikesAvailable,
      })),
    [stations],
  );

  const handleQuickFilter = (nextFilter: HomeDiagnosisFilter) => {
    setFilter(nextFilter);
    trackUmamiEvent(
      buildFilterChangeEvent({
        surface: 'public',
        routeKey,
        module: 'home_live',
        source: 'home_quick_filter',
        destination: nextFilter,
        resultCount: stations.filter((station) => applyFilter(station, nextFilter)).length,
      }),
    );
  };

  return (
    <div className={`flex flex-col gap-4 ${className ?? ''}`.trim()}>
      <div>
        <p className="stat-label">En vivo, ahora mismo</p>
        <h2 className="mt-1 text-xl font-black text-[var(--foreground)]">
          Busca y filtra la red
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Busca tu estación o barrio y filtra por lo que necesitas ahora: una bici libre o un
          hueco para devolverla.
        </p>
      </div>

      <PublicSearchForm
        stations={searchStations}
        districts={districts}
        placeholder="Buscar tu estación, calle o barrio…"
        label="Buscar estación o barrio"
        eventSource="home_search"
      />

      <div className="flex flex-wrap items-center gap-2">
        {QUICK_FILTERS.map((quickFilter) => (
          <Button
            key={quickFilter.key}
            type="button"
            variant="chip"
            size="sm"
            aria-pressed={filter === quickFilter.key}
            onClick={() => handleQuickFilter(quickFilter.key)}
            className={
              filter === quickFilter.key
                ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm hover:border-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]'
                : ''
            }
          >
            {quickFilter.label}
          </Button>
        ))}
        <span className="ui-chip">
          {formatInteger(filteredStations.length)} de {formatInteger(stations.length)} estaciones
        </span>
        <TrackedLink
          href={appRoutes.biciradar()}
          trackingEvent={buildObservatoryEvent('biciradar_handoff_clicked', {
            surface: 'public',
            routeKey: 'home',
            source: 'home_nearby_chip',
          })}
          className="ui-chip"
        >
          📍 Mis estaciones cercanas
        </TrackedLink>
      </div>

      <HomeMapSection
        stations={filteredStations}
        selectedStationId={selectedStationId}
        onSelectStation={setSelectedStationId}
        favoriteStationIds={favoriteStationIds}
        onToggleFavorite={toggleFavoriteStation}
      />

      <HomeDiagnosis
        problemStations={problemStations}
        mostUsedStations={mostUsedStations}
        filter={filter}
      />
    </div>
  );
}
