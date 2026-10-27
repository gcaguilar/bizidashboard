'use client';

import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { findNearestStation, type NearestCandidateStation, type NearestCriterion } from '@/lib/nearest-station';
import { fetchStations } from '@/lib/fetch-stations';
import { appRoutes } from '@/lib/routes';

type NearbyState = 'idle' | 'locating' | 'denied' | 'unsupported' | 'empty' | 'error';

const COMMON_MESSAGES = {
  denied: 'No hemos podido acceder a tu ubicación. Busca tu estación más abajo o ábrela en BiciRadar.',
  unsupported: 'Tu navegador no permite geolocalización. Busca tu estación más abajo o ábrela en BiciRadar.',
  error: 'No hemos podido cargar las estaciones. Inténtalo de nuevo en unos segundos.',
};

const MODE_COPY: Record<
  NearestCriterion,
  { label: string; icon: string; empty: string; primary: boolean }
> = {
  bikes: {
    label: 'Bicis cerca de ti',
    icon: '📍',
    empty: 'Ahora mismo no hay ninguna estación con bicis disponibles.',
    primary: true,
  },
  anchors: {
    label: '¿Dónde dejo la bici?',
    icon: '🅿️',
    empty: 'Ahora mismo no hay ninguna estación con huecos libres.',
    primary: false,
  },
};

function fetchCandidateStations(): Promise<NearestCandidateStation[]> {
  return fetchStations();
}

export function NearbyBikesCta({ mode = 'bikes' }: { mode?: NearestCriterion }) {
  const copy = MODE_COPY[mode];
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
            const nearest = findNearestStation(
              stations,
              { lat: position.coords.latitude, lon: position.coords.longitude },
              mode,
            );
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

  const message = state === 'idle' || state === 'locating' ? null : (state === 'empty' ? copy.empty : COMMON_MESSAGES[state]);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === 'locating'}
        className={
          copy.primary
            ? 'ui-primary-button w-full sm:w-auto'
            : 'ui-primary-button w-full !border-[var(--border)] !bg-transparent !text-[var(--foreground)] !shadow-none sm:w-auto'
        }
      >
        <span aria-hidden="true">{copy.icon}</span>
        {state === 'locating' ? 'Buscando tu ubicación…' : copy.label}
      </button>
      {message ? (
        <p role="status" className="text-xs text-[var(--muted)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
