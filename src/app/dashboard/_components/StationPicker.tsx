'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { StationSnapshot } from '@/lib/api';
import { appRoutes } from '@/lib/routes';

type StationTrend = 'up' | 'down' | 'flat';

type StationPickerProps = {
  stations: StationSnapshot[];
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
  favoriteStationIds: string[];
  onToggleFavorite: (stationId: string) => void;
  trendByStationId?: Record<string, StationTrend>;
  nearestStationId?: string | null;
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function isSubsequence(query: string, target: string): boolean {
  if (!query) {
    return true;
  }

  let queryIndex = 0;

  for (let i = 0; i < target.length; i += 1) {
    if (target[i] === query[queryIndex]) {
      queryIndex += 1;
      if (queryIndex === query.length) {
        return true;
      }
    }
  }

  return false;
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) {
    return 0;
  }

  if (!a) {
    return b.length;
  }

  if (!b) {
    return a.length;
  }

  const previousRow = Array.from({ length: b.length + 1 }, (_, idx) => idx);
  const currentRow = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    currentRow[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow[j] = Math.min(
        currentRow[j - 1] + 1,
        previousRow[j] + 1,
        previousRow[j - 1] + substitutionCost
      );
    }

    for (let j = 0; j < currentRow.length; j += 1) {
      previousRow[j] = currentRow[j];
    }
  }

  return previousRow[b.length] ?? Math.max(a.length, b.length);
}

function scoreCandidate(query: string, target: string): number {
  if (!target) {
    return Number.NEGATIVE_INFINITY;
  }

  if (target === query) {
    return 500;
  }

  if (target.startsWith(query)) {
    return 360 - (target.length - query.length) * 0.2;
  }

  const includeIndex = target.indexOf(query);
  if (includeIndex >= 0) {
    return 290 - includeIndex * 0.5;
  }

  if (isSubsequence(query, target)) {
    return 220 - (target.length - query.length) * 0.35;
  }

  const distance = levenshteinDistance(query, target);
  return 160 - distance * 8;
}

type ScoredStation = {
  station: StationSnapshot;
  score: number;
};

function scoreStations(
  stations: StationSnapshot[],
  rawQuery: string,
  favoriteStationSet: Set<string>
): ScoredStation[] {
  const query = normalizeText(rawQuery);

  if (!query) {
    return [...stations]
      .sort((left, right) => {
        const leftFavorite = favoriteStationSet.has(left.id) ? 1 : 0;
        const rightFavorite = favoriteStationSet.has(right.id) ? 1 : 0;

        if (leftFavorite !== rightFavorite) {
          return rightFavorite - leftFavorite;
        }

        return left.name.localeCompare(right.name, 'es-ES');
      })
      .slice(0, 8)
      .map((station) => ({ station, score: 0 }));
  }

  const isNumericQuery = /^\d+$/.test(query);

  return stations
    .map((station) => {
      const normalizedName = normalizeText(station.name);
      const normalizedId = normalizeText(station.id);
      const nameScore = scoreCandidate(query, normalizedName);
      const idScore = scoreCandidate(query, normalizedId);
      const numericBonus = isNumericQuery && normalizedId.includes(query) ? 80 : 0;

      return {
        station,
        score: Math.max(nameScore, idScore) + numericBonus + (favoriteStationSet.has(station.id) ? 12 : 0),
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 8);
}

export function StationPicker({
  stations,
  selectedStationId,
  onSelectStation,
  favoriteStationIds,
  onToggleFavorite,
  trendByStationId,
  nearestStationId,
}: StationPickerProps) {
  const [query, setQuery] = useState('');

  const favoriteStationSet = useMemo(() => new Set(favoriteStationIds), [favoriteStationIds]);

  const orderedStations = useMemo(() => {
    return [...stations].sort((left, right) => {
      const leftFavorite = favoriteStationSet.has(left.id) ? 1 : 0;
      const rightFavorite = favoriteStationSet.has(right.id) ? 1 : 0;

      if (leftFavorite !== rightFavorite) {
        return rightFavorite - leftFavorite;
      }

      return left.name.localeCompare(right.name, 'es-ES');
    });
  }, [favoriteStationSet, stations]);

  const favoriteStations = useMemo(() => {
    return orderedStations.filter((station) => favoriteStationSet.has(station.id));
  }, [favoriteStationSet, orderedStations]);

  const selectedStation = useMemo(() => {
    return stations.find((station) => station.id === selectedStationId) ?? null;
  }, [selectedStationId, stations]);

  const stationSuggestions = useMemo(() => {
    return scoreStations(orderedStations, query, favoriteStationSet);
  }, [favoriteStationSet, orderedStations, query]);

  const bestMatch = stationSuggestions[0]?.station ?? null;
  const stationDetailUrl = selectedStation
    ? appRoutes.dashboardStation(selectedStation.id)
    : null;

  return (
    <section className="dashboard-card overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
            Selector de estacion
          </h2>
          <p className="text-xs text-[var(--muted)]">
            Cambia estacion para sincronizar mapa, patrones y heatmap.
          </p>
        </div>
        <span className="kpi-chip">
          {stations.length} estaciones · {favoriteStations.length} favoritas
        </span>
      </div>

      {favoriteStations.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
            Favoritas
          </p>
          <div className="flex flex-wrap gap-2">
            {favoriteStations.slice(0, 8).map((station) => (
              <button
                key={`favorite-${station.id}`}
                type="button"
                onClick={() => onSelectStation(station.id)}
                className={`max-w-full truncate rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  station.id === selectedStationId
                    ? 'border-amber-500 bg-amber-500 text-[#111827]'
                    : 'border-amber-500/40 bg-amber-500/15 text-[var(--foreground)] hover:border-amber-500'
                }`}
              >
                ★ {station.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid min-w-0 gap-3 lg:grid-cols-[1.4fr_1fr]">
        <label className="flex min-w-0 items-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2">
          <input
            id="station-search"
            className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
            placeholder="Buscar por nombre o ID"
            value={query}
              onChange={(event) => {
                const nextValue = event.target.value;
                setQuery(nextValue);

                const nextMatch = scoreStations(orderedStations, nextValue, favoriteStationSet)[0]?.station;

                if (nextMatch && nextMatch.id !== selectedStationId) {
                  onSelectStation(nextMatch.id);
                }
              }}
            autoComplete="off"
          />
        </label>

        <select
          id="station-picker"
          aria-label="Seleccionar estacion"
          className="w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--foreground)]"
          value={selectedStationId}
          onChange={(event) => onSelectStation(event.target.value)}
          disabled={stations.length === 0}
        >
          {stations.length === 0 ? (
            <option value="">Sin estaciones disponibles</option>
          ) : (
            orderedStations.map((station) => (
              <option key={station.id} value={station.id}>
                {favoriteStationSet.has(station.id) ? `★ ${station.name}` : station.name}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {stationSuggestions.slice(0, 5).map(({ station }) => (
          <button
            key={station.id}
            type="button"
            className={`max-w-full truncate rounded-full border px-3 py-1 text-xs transition ${
              station.id === selectedStationId
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)] hover:border-[var(--accent-soft)] hover:text-[var(--foreground)]'
            }`}
            onClick={() => onSelectStation(station.id)}
          >
            {favoriteStationSet.has(station.id) ? '★ ' : ''}
            {station.name}
            {nearestStationId === station.id ? ' · cerca' : ''}
            {trendByStationId?.[station.id] === 'up' ? ' ↑' : ''}
            {trendByStationId?.[station.id] === 'down' ? ' ↓' : ''}
          </button>
        ))}
      </div>

      {selectedStation ? (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--muted)]">
          <span>
            Tendencia seleccionada:{' '}
            {trendByStationId?.[selectedStation.id] === 'up'
              ? '↑ suben bicis'
              : trendByStationId?.[selectedStation.id] === 'down'
                ? '↓ bajan bicis'
                : '→ sin cambios'}
          </span>
          <button
            type="button"
            onClick={() => onToggleFavorite(selectedStation.id)}
            aria-pressed={favoriteStationSet.has(selectedStation.id)}
            className={`rounded-full border px-2 py-1 text-[11px] font-bold ${
              favoriteStationSet.has(selectedStation.id)
                ? 'border-amber-500 bg-amber-500/20 text-amber-500'
                : 'border-[var(--border)] text-[var(--foreground)]'
            }`}
          >
            {favoriteStationSet.has(selectedStation.id) ? '★ Quitar favorita' : '☆ Marcar favorita'}
          </button>
        </div>
      ) : null}

      {query.trim() ? (
        <p className="text-[11px] text-[var(--muted)]">
          Mejor coincidencia:{' '}
          <span className="font-semibold text-[var(--foreground)]">
            {bestMatch?.name ?? 'Sin coincidencias'}
          </span>
        </p>
      ) : (
        <p className="text-[11px] text-[var(--muted)]">
          {selectedStation ? `Seleccionada: ${selectedStation.name}` : 'Sin seleccion'}
        </p>
      )}

      {stationDetailUrl ? (
        <div className="flex justify-end">
          <Link
            href={stationDetailUrl}
            className="rounded-lg border border-[var(--accent)] bg-[var(--accent)]/15 px-3 py-1.5 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
          >
            Abrir detalle completo
          </Link>
        </div>
      ) : null}
    </section>
  );
}
