'use client';

import { useMemo, useState } from 'react';
import type { StationSnapshot } from '@/lib/api';

type StationPickerProps = {
  stations: StationSnapshot[];
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
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
    return 350 - (target.length - query.length) * 0.2;
  }

  const includeIndex = target.indexOf(query);
  if (includeIndex >= 0) {
    return 280 - includeIndex * 0.5;
  }

  if (isSubsequence(query, target)) {
    return 220 - (target.length - query.length) * 0.4;
  }

  const distance = levenshteinDistance(query, target);
  return 160 - distance * 8;
}

function findBestStationMatch(
  stations: StationSnapshot[],
  rawQuery: string
): StationSnapshot | null {
  const query = normalizeText(rawQuery);

  if (!query) {
    return null;
  }

  const isNumericQuery = /^\d+$/.test(query);
  let bestStation: StationSnapshot | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const station of stations) {
    const normalizedName = normalizeText(station.name);
    const normalizedId = normalizeText(station.id);

    const nameScore = scoreCandidate(query, normalizedName);
    const idScore = scoreCandidate(query, normalizedId);
    const numericBonus =
      isNumericQuery && normalizedId.includes(query) ? 80 : 0;
    const score = Math.max(nameScore, idScore) + numericBonus;

    if (score > bestScore) {
      bestScore = score;
      bestStation = station;
    }
  }

  return bestStation;
}

export function StationPicker({
  stations,
  selectedStationId,
  onSelectStation,
}: StationPickerProps) {
  const [query, setQuery] = useState('');

  const selectedStation = useMemo(() => {
    return stations.find((station) => station.id === selectedStationId);
  }, [selectedStationId, stations]);

  const suggestedStation = useMemo(
    () => findBestStationMatch(stations, query),
    [query, stations]
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);

    const bestMatch = findBestStationMatch(stations, value);
    if (bestMatch && bestMatch.id !== selectedStationId) {
      onSelectStation(bestMatch.id);
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Estacion seleccionada
        </h2>
        <p className="text-xs text-[var(--muted)]">
          Elige una estacion para centrar el mapa, aplicar zoom y refrescar paneles.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="station-search"
          className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]"
        >
          Buscar por nombre o numero
        </label>
        <input
          id="station-search"
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--foreground)]"
          placeholder="Ejemplo: 2198 o Plaza Espana"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          autoComplete="off"
        />
        {query.trim() ? (
          <p className="text-[11px] text-[var(--muted)]">
            Coincidencia mas cercana:{' '}
            <span className="font-semibold text-[var(--foreground)]">
              {suggestedStation?.name ?? 'Sin coincidencias'}
            </span>
          </p>
        ) : null}
        <label
          htmlFor="station-picker"
          className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]"
        >
          Estaciones disponibles
        </label>
        <select
          id="station-picker"
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--foreground)]"
          value={selectedStationId}
          onChange={(event) => onSelectStation(event.target.value)}
          disabled={stations.length === 0}
        >
          {stations.length === 0 ? (
            <option value="">Sin estaciones disponibles</option>
          ) : (
            stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name}
              </option>
            ))
          )}
        </select>
      </div>
      <p className="text-xs text-[var(--muted)]">
        Total estaciones: {stations.length}
        {selectedStation ? ` · Seleccionada: ${selectedStation.name}` : ''}
      </p>
    </section>
  );
}
