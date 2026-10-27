'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import { PublicSearchForm, type StationSuggestion } from '@/app/_components/PublicSearchForm';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { pruneStoredFavorites, useFavoriteStations } from '@/lib/use-favorite-stations';
import { HomeDiagnosis, type HomeDiagnosisFilter } from '@/app/_components/home/HomeDiagnosis';
import { HomeFavoriteStations } from '@/app/_components/home/HomeFavoriteStations';
import { HomeMapSection } from '@/app/_components/home/HomeMapSection';
import type { HomeDiagnosisSummary } from '@/lib/home-diagnosis';
import { Button } from '@/components/ui/button';
import type { StationSnapshot } from '@/lib/api-types';
import { formatInteger } from '@/lib/format';
import { fetchStationsSnapshot } from '@/lib/fetch-stations';
import type { MessageKey } from '@/lib/i18n/messages';
import { useT } from '@/lib/i18n/use-locale';
import { appRoutes } from '@/lib/routes';
import type { DistrictOption } from '@/server-functions/home';
import {
  buildFilterChangeEvent,
  buildObservatoryEvent,
  resolveRouteKeyFromPathname,
  trackUmamiEvent,
} from '@/lib/umami';

const QUICK_FILTERS: { key: HomeDiagnosisFilter; labelKey: MessageKey }[] = [
  { key: 'all', labelKey: 'home.live.filter.all' },
  { key: 'bikes', labelKey: 'home.live.filter.bikes' },
  { key: 'anchors', labelKey: 'home.live.filter.anchors' },
];

export type HomeLiveSectionProps = {
  /** Red completa ya resuelta. Si falta, se pide a /api/stations tras hidratar. */
  stations?: StationSnapshot[];
  /** Total de estaciones del loader: pinta el contador antes de que llegue la red. */
  stationsTotal?: number;
  districts: DistrictOption[];
  problemStations: HomeDiagnosisSummary[];
  mostUsedStations: HomeDiagnosisSummary[];
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

const NO_STATIONS: StationSnapshot[] = [];

/** ~2 min: dentro del límite de 40 req/min de /api/stations incluso con varias pestañas. */
const HOME_STATIONS_REFRESH_MS = 120_000;

export function HomeLiveSection({
  stations: stationsProp,
  stationsTotal,
  districts,
  problemStations,
  mostUsedStations,
  className,
}: HomeLiveSectionProps) {
  const { t } = useT();
  const pathname = useLocation().pathname;
  const routeKey = resolveRouteKeyFromPathname(pathname);
  const [filter, setFilter] = useState<HomeDiagnosisFilter>('all');
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const { favoriteStationIds, toggleFavoriteStation } = useFavoriteStations();
  const [fetchedStations, setFetchedStations] = useState<StationSnapshot[] | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const stations = stationsProp ?? fetchedStations ?? NO_STATIONS;
  const isLoadingStations = stationsProp == null && fetchedStations == null;

  // El HTML inicial solo lleva el resumen y los top 5; el mapa y el buscador
  // reciben la red completa de /api/stations una vez hidratada la página.
  useEffect(() => {
    if (stationsProp) {
      return;
    }

    let controller: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const load = () => {
      controller?.abort();
      const current = new AbortController();
      controller = current;
      fetchStationsSnapshot({ signal: current.signal })
        .then(({ stations: fetched, generatedAt }) => {
          setFetchedStations(fetched);
          setRefreshedAt(generatedAt ?? new Date().toISOString());
          pruneStoredFavorites(fetched.map((s) => s.id));
        })
        .catch(() => {});
    };

    // Al volver a la pestaña se refresca de inmediato si pasó el intervalo.
    let lastLoadAt = Date.now();
    const loadTracked = () => {
      lastLoadAt = Date.now();
      load();
    };
    const onVisible = () => {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - lastLoadAt >= HOME_STATIONS_REFRESH_MS
      ) {
        loadTracked();
      }
    };

    loadTracked();
    timer = setTimeout(function tick() {
      if (stopped) return;
      if (document.visibilityState === 'visible') loadTracked();
      timer = setTimeout(tick, HOME_STATIONS_REFRESH_MS);
    }, HOME_STATIONS_REFRESH_MS);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [stationsProp]);

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
        <p className="stat-label">{t('home.live.kicker')}</p>
        <h2 className="mt-1 text-xl font-black text-[var(--foreground)]">
          {t('home.live.title')}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {t('home.live.subtitle')}
        </p>
      </div>

      <HomeFavoriteStations
        stations={stations}
        isLoading={isLoadingStations}
        refreshedAt={refreshedAt}
        className="ui-section-card"
      />

      <PublicSearchForm
        stations={searchStations}
        districts={districts}
        placeholder={t('home.live.search.placeholder')}
        label={t('home.live.search.label')}
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
            {t(quickFilter.labelKey)}
          </Button>
        ))}
        <span className="ui-chip">
          {stations.length === 0 && stationsTotal != null
            ? t('home.live.count.total', { total: formatInteger(stationsTotal) })
            : t('home.live.count.filtered', {
                shown: formatInteger(filteredStations.length),
                total: formatInteger(stations.length),
              })}
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
          {t('home.live.nearby')}
        </TrackedLink>
      </div>

      <HomeMapSection
        stations={filteredStations}
        isLoading={isLoadingStations}
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
