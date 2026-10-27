'use client';

import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { appRoutes } from '@/lib/routes';

export type NearbyCandidateStation = {
  id: string;
  lat: number;
  lon: number;
  bikesAvailable: number;
};

type NearbyState = 'idle' | 'locating' | 'denied' | 'unsupported' | 'empty' | 'error';

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Estación con al menos una bici más cercana a `origin`, o null si no hay ninguna. */
export function findNearestStationWithBikes(
  stations: NearbyCandidateStation[],
  origin: { lat: number; lon: number },
): NearbyCandidateStation | null {
  let best: NearbyCandidateStation | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const station of stations) {
    if (station.bikesAvailable <= 0) continue;
    const distance = distanceMeters(origin, station);
    if (distance < bestDistance) {
      best = station;
      bestDistance = distance;
    }
  }

  return best;
}

const FALLBACK_MESSAGES: Record<Exclude<NearbyState, 'idle' | 'locating'>, string> = {
  denied: 'No hemos podido acceder a tu ubicación. Busca tu estación más abajo o ábrela en BiciRadar.',
  unsupported: 'Tu navegador no permite geolocalización. Busca tu estación más abajo o ábrela en BiciRadar.',
  empty: 'Ahora mismo no hay ninguna estación con bicis disponibles.',
  error: 'No hemos podido cargar las estaciones. Inténtalo de nuevo en unos segundos.',
};

async function fetchCandidateStations(): Promise<NearbyCandidateStation[]> {
  const res = await fetch(appRoutes.api.stations());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data?.stations) ? data.stations : [];
}

export function NearbyBikesCta() {
  const navigate = useNavigate();
  const [state, setState] = useState<NearbyState>('idle');

  const handleClick = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState('unsupported');
      return;
    }

    setState('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // La red completa no viaja en el HTML inicial: se pide solo al pulsar.
        fetchCandidateStations()
          .then((stations) => {
            const nearest = findNearestStationWithBikes(stations, {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            });
            if (!nearest) {
              setState('empty');
              return;
            }
            setState('idle');
            void navigate({ to: appRoutes.stationDetail(nearest.id) });
          })
          .catch(() => setState('error'));
      },
      () => setState('denied'),
      { timeout: 8000, maximumAge: 60_000 },
    );
  };

  const message = state === 'idle' || state === 'locating' ? null : FALLBACK_MESSAGES[state];

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === 'locating'}
        className="ui-primary-button w-full sm:w-auto"
      >
        <span aria-hidden="true">📍</span>
        {state === 'locating' ? 'Buscando tu ubicación…' : 'Bicis cerca de ti'}
      </button>
      {message ? (
        <p role="status" className="text-xs text-[var(--muted)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
