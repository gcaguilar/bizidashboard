'use client';

import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useT } from '@/lib/i18n/use-locale';
import type { MessageKey } from '@/lib/i18n/messages';
import { findNearestStation, type NearestCandidateStation, type NearestCriterion } from '@/lib/nearest-station';
import { fetchStations } from '@/lib/fetch-stations';
import { appRoutes } from '@/lib/routes';

type NearbyState = 'idle' | 'locating' | 'denied' | 'unsupported' | 'empty' | 'error';

const COMMON_MESSAGES: Record<'denied' | 'unsupported' | 'error', MessageKey> = {
  denied: 'home.nearby.denied',
  unsupported: 'home.nearby.unsupported',
  error: 'home.nearby.error',
};

const MODE_COPY: Record<
  NearestCriterion,
  { label: MessageKey; icon: string; empty: MessageKey; primary: boolean }
> = {
  bikes: {
    label: 'home.nearby.bikes.label',
    icon: '📍',
    empty: 'home.nearby.bikes.empty',
    primary: true,
  },
  anchors: {
    label: 'home.nearby.anchors.label',
    icon: '🅿️',
    empty: 'home.nearby.anchors.empty',
    primary: false,
  },
};

function fetchCandidateStations(): Promise<NearestCandidateStation[]> {
  return fetchStations();
}

export function NearbyBikesCta({ mode = 'bikes' }: { mode?: NearestCriterion }) {
  const { t } = useT();
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

  const messageKey =
    state === 'idle' || state === 'locating'
      ? null
      : state === 'empty'
        ? copy.empty
        : COMMON_MESSAGES[state];
  const message = messageKey ? t(messageKey) : null;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === 'locating'}
        className={
          copy.primary
            ? 'ui-primary-button w-full sm:w-auto'
            : 'ui-secondary-button w-full sm:w-auto'
        }
      >
        <span aria-hidden="true">{copy.icon}</span>
        {state === 'locating' ? t('home.nearby.locating') : t(copy.label)}
      </button>
      {message ? (
        <p role="status" className="text-xs text-[var(--muted)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
