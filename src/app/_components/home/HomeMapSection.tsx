'use client';

import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { TrackedLink } from '@/app/_components/TrackedLink';
import type { StationSnapshot } from '@/lib/api-types';
import { CITIZEN_MAP_LEGEND } from '@/lib/map-colors';
import { appRoutes } from '@/lib/routes';
import { buildObservatoryEvent } from '@/lib/umami';

// El motor del mapa (MapLibre) solo se descarga cuando la sección entra en el
// viewport; el `lazy` no ejecuta el import hasta renderizar el componente.
const MapEngineLazy = lazy(() =>
  import('@/app/dashboard/_components/MapEngine').then((m) => ({ default: m.MapEngine })),
);

export type HomeMapSectionProps = {
  stations: StationSnapshot[];
  selectedStationId?: string | null;
  onSelectStation?: (id: string) => void;
  favoriteStationIds?: string[];
  onToggleFavorite?: (id: string) => void;
  className?: string;
};

function MapLoadingSkeleton() {
  return (
    <div
      aria-busy="true"
      className="flex h-[420px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-6 text-center text-sm text-[var(--muted)]"
    >
      El mapa se carga al llegar aquí…
    </div>
  );
}

export function HomeMapSection({
  stations,
  selectedStationId,
  onSelectStation,
  favoriteStationIds,
  onToggleFavorite,
  className,
}: HomeMapSectionProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [isMapVisible, setIsMapVisible] = useState(false);

  useEffect(() => {
    if (isMapVisible || stations.length === 0) {
      return;
    }

    const node = mapContainerRef.current;

    if (!node) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      // Entornos sin IntersectionObserver (tests o navegadores antiguos): carga
      // el mapa sin esperar al scroll, pero fuera del render del efecto para no
      // provocar renders en cascada.
      const timer = setTimeout(() => setIsMapVisible(true), 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsMapVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isMapVisible, stations.length]);

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {CITIZEN_MAP_LEGEND.map((item) => (
          <span key={item.color} className="ui-legend-item">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            <span className="text-xs font-semibold text-[var(--foreground)]">{item.label}</span>
            <span className="text-[11px] text-[var(--muted)]">{item.description}</span>
          </span>
        ))}
      </div>

      <div ref={mapContainerRef} className="relative mt-3">
        {stations.length === 0 ? (
          <div className="flex h-[420px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-6 text-center text-sm text-[var(--muted)]">
            No hay estaciones con este filtro.
          </div>
        ) : isMapVisible ? (
          <div className="relative h-[420px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <Suspense fallback={<MapLoadingSkeleton />}>
              <MapEngineLazy
                stations={stations}
                colorScale="citizen"
                selectedStationId={selectedStationId ?? undefined}
                onSelectStation={onSelectStation}
                favoriteStationIds={favoriteStationIds}
                onToggleFavorite={onToggleFavorite}
              />
            </Suspense>
          </div>
        ) : (
          <MapLoadingSkeleton />
        )}

        <TrackedLink
          href={appRoutes.biciradar()}
          trackingEvent={buildObservatoryEvent('biciradar_handoff_clicked', {
            surface: 'public',
            routeKey: 'home',
            source: 'home_map_floating_cta',
          })}
          className="ui-primary-button shadow-lg absolute bottom-4 right-4 z-20"
        >
          📍 Bicis cerca de ti
        </TrackedLink>
      </div>
    </div>
  );
}
