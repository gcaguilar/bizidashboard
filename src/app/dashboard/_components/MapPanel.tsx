'use client';

import { Map, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { StationSnapshot } from '@/lib/api';

type MapPanelProps = {
  stations: StationSnapshot[];
  selectedStationId: string;
  onSelect: (stationId: string) => void;
};

function getMarkerColor(station: StationSnapshot): string {
  if (station.capacity <= 0) return '#6b6f76';
  const ratio = station.bikesAvailable / station.capacity;
  if (ratio >= 0.6) return '#1f7a8c';
  if (ratio >= 0.3) return '#e07a3f';
  return '#c85c2d';
}

export function MapPanel({ stations, selectedStationId, onSelect }: MapPanelProps) {
  const fallbackCenter = {
    latitude: 41.6561,
    longitude: -0.8773,
  };
  const primaryStation = stations[0];
  const center = primaryStation
    ? { latitude: primaryStation.lat, longitude: primaryStation.lon }
    : fallbackCenter;

  return (
    <section className="flex h-full flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Mapa de estaciones
          </h2>
          <p className="text-xs text-[var(--muted)]">
            Selecciona una estacion para ver sus patrones.
          </p>
        </div>
        <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          {stations.length} estaciones
        </span>
      </header>

      <div className="h-[320px] w-full overflow-hidden rounded-2xl border border-[var(--border)]">
        {stations.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
            No hay estaciones disponibles.
          </div>
        ) : (
          <Map
            initialViewState={{
              latitude: center.latitude,
              longitude: center.longitude,
              zoom: 12,
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          >
            {stations.map((station) => {
              const isSelected = station.id === selectedStationId;
              return (
                <Marker
                  key={station.id}
                  longitude={station.lon}
                  latitude={station.lat}
                  anchor="bottom"
                >
                  <button
                    type="button"
                    onClick={() => onSelect(station.id)}
                    className={`h-3 w-3 rounded-full border border-white shadow-sm transition-transform ${
                      isSelected ? 'scale-150' : 'scale-100'
                    }`}
                    style={{ backgroundColor: getMarkerColor(station) }}
                    aria-label={`Estacion ${station.name}`}
                  />
                </Marker>
              );
            })}
          </Map>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs text-[var(--muted)] sm:grid-cols-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#1f7a8c' }} />
          <span>Alta disponibilidad</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#e07a3f' }} />
          <span>Media disponibilidad</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#c85c2d' }} />
          <span>Baja disponibilidad</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#6b6f76' }} />
          <span>Sin datos</span>
        </div>
      </div>
    </section>
  );
}
