'use client';

import { useEffect, useMemo, useState } from 'react';
import type { StationSnapshot } from '@/lib/api';

type StationPickerProps = {
  stations: StationSnapshot[];
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
};

export function StationPicker({
  stations,
  selectedStationId,
  onSelectStation,
}: StationPickerProps) {
  const selectedStation = useMemo(() => {
    return stations.find((station) => station.id === selectedStationId);
  }, [selectedStationId, stations]);

  const [query, setQuery] = useState(selectedStation?.name ?? '');

  useEffect(() => {
    setQuery(selectedStation?.name ?? '');
  }, [selectedStation]);

  const filteredStations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return stations;
    }

    return stations.filter((station) => {
      const normalizedName = station.name.toLowerCase();
      const normalizedId = station.id.toLowerCase();

      return (
        normalizedName.includes(normalizedQuery) ||
        normalizedId.includes(normalizedQuery)
      );
    });
  }, [query, stations]);

  const handleSelectChange = (stationId: string) => {
    const nextStation = stations.find((station) => station.id === stationId);

    if (nextStation) {
      setQuery(nextStation.name);
    }

    onSelectStation(stationId);
  };

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Estacion seleccionada
        </h2>
        <p className="text-xs text-[var(--muted)]">
          Busca por nombre o codigo para actualizar los paneles.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <input
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--foreground)]"
          placeholder="Buscar estacion por nombre o codigo"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--foreground)]"
          value={selectedStationId}
          onChange={(event) => handleSelectChange(event.target.value)}
          disabled={stations.length === 0}
        >
          {stations.length === 0 ? (
            <option value="">Sin estaciones disponibles</option>
          ) : filteredStations.length === 0 ? (
            <option value={selectedStationId}>
              Sin resultados con "{query.trim()}"
            </option>
          ) : (
            filteredStations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name}
              </option>
            ))
          )}
        </select>
      </div>
      <p className="text-xs text-[var(--muted)]">
        Total estaciones: {stations.length}
      </p>
    </section>
  );
}
