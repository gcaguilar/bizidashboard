'use client';

import { useMemo, useRef, type KeyboardEvent } from 'react';
import { StationStatusLabel } from '@/components/ui/station-status';
import type { StationSnapshot } from '@/lib/api-types';
import { haversineDistanceMeters, type Coordinates } from '@/lib/geo';
import { useT } from '@/lib/i18n/use-locale';
import { getCitizenStatus } from '@/lib/map-colors';

export const MAP_STATION_LIST_LIMIT = 20;

type MapStationListProps = {
  stations: StationSnapshot[];
  selectedStationId?: string;
  /** Punto de referencia (ubicación del usuario o centro del mapa) para ordenar por cercanía. */
  referencePoint?: Coordinates | null;
  onSelect: (stationId: string) => void;
  limit?: number;
};

/**
 * Estaciones más cercanas al punto de referencia; la seleccionada siempre se
 * incluye para que el estado del mapa y de la lista coincidan.
 */
export function pickNearbyStations(
  stations: StationSnapshot[],
  referencePoint: Coordinates | null | undefined,
  selectedStationId: string | undefined,
  limit: number
): StationSnapshot[] {
  const valid = stations.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lon));
  const ranked = referencePoint
    ? valid
        .map((station) => ({
          station,
          distance: haversineDistanceMeters(referencePoint, {
            latitude: station.lat,
            longitude: station.lon,
          }),
        }))
        .sort((a, b) => a.distance - b.distance)
        .map((entry) => entry.station)
    : valid;
  const top = ranked.slice(0, limit);

  if (selectedStationId && !top.some((s) => s.id === selectedStationId)) {
    const selected = valid.find((s) => s.id === selectedStationId);
    if (selected) {
      top.push(selected);
    }
  }

  return top;
}

/**
 * Alternativa por teclado al canvas del mapa: lista colapsable de estaciones
 * cercanas. Tab entra en la lista y las flechas se mueven entre estaciones.
 */
export function MapStationList({
  stations,
  selectedStationId,
  referencePoint,
  onSelect,
  limit = MAP_STATION_LIST_LIMIT,
}: MapStationListProps) {
  const { locale, t } = useT();
  const listRef = useRef<HTMLUListElement | null>(null);
  const items = useMemo(
    () => pickNearbyStations(stations, referencePoint, selectedStationId, limit),
    [stations, referencePoint, selectedStationId, limit]
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) {
      return;
    }

    const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
    if (buttons.length === 0) {
      return;
    }

    event.preventDefault();
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    let next = current;
    if (event.key === 'ArrowDown') next = Math.min(buttons.length - 1, current + 1);
    if (event.key === 'ArrowUp') next = Math.max(0, current - 1);
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    buttons[next]?.focus();
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <details className="absolute bottom-6 left-4 z-20 max-w-[min(20rem,calc(100%-2rem))] rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-md">
      <summary className="cursor-pointer px-3 py-2 text-xs font-semibold">
        {t('home.map.list.summary')}
      </summary>
      <ul
        ref={listRef}
        aria-label={t('home.map.list.label')}
        onKeyDown={handleKeyDown}
        className="max-h-64 overflow-y-auto border-t border-[var(--border)] p-1"
      >
        {items.map((station) => {
          const isSelected = station.id === selectedStationId;
          return (
            <li key={station.id}>
              <button
                type="button"
                aria-current={isSelected ? 'true' : undefined}
                onClick={() => onSelect(station.id)}
                className={`flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left text-xs hover:bg-[var(--secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)] ${
                  isSelected ? 'bg-[var(--secondary)]' : ''
                }`}
              >
                <span className="font-bold">{station.name}</span>
                <StationStatusLabel status={getCitizenStatus(station, locale)} />
              </button>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
