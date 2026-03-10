'use client';

import { useMemo } from 'react';
import { Map, Marker, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { TransitStopSnapshot } from '@/lib/transit-api';

type TransitMapPanelProps = {
  stops: TransitStopSnapshot[];
  selectedStopId: string;
  onSelectStop: (stopId: string) => void;
};

function getMarkerColor(stop: TransitStopSnapshot): string {
  if (stop.isStale) {
    return '#64748b';
  }

  if (stop.etaMinutes === null) {
    return '#b91c1c';
  }

  if (stop.etaMinutes <= 3) {
    return '#10b981';
  }

  if (stop.etaMinutes <= 8) {
    return '#f59e0b';
  }

  return '#ea580c';
}

export function TransitMapPanel({ stops, selectedStopId, onSelectStop }: TransitMapPanelProps) {
  const selectedStop = useMemo(
    () => stops.find((stop) => stop.id === selectedStopId) ?? null,
    [selectedStopId, stops]
  );

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
          Mapa de paradas
        </h2>
      </header>

      <div className="h-[480px] w-full">
        <Map
          initialViewState={{ latitude: 41.65, longitude: -0.88, zoom: 11.5 }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        >
          {stops.map((stop) => (
            <Marker key={stop.id} longitude={stop.lon} latitude={stop.lat} anchor="center">
              <button
                type="button"
                aria-label={stop.name}
                onClick={() => onSelectStop(stop.id)}
                className="flex h-4 w-4 rounded-full border-2 border-white shadow"
                style={{
                  backgroundColor: getMarkerColor(stop),
                  transform: stop.id === selectedStopId ? 'scale(1.35)' : 'scale(1)',
                }}
              />
            </Marker>
          ))}

          {selectedStop ? (
            <Popup
              longitude={selectedStop.lon}
              latitude={selectedStop.lat}
              closeOnClick={false}
              onClose={() => onSelectStop(selectedStop.id)}
              offset={14}
            >
              <div className="min-w-[220px] text-sm text-[var(--foreground)]">
                <p className="font-semibold">{selectedStop.name}</p>
                <p className="text-xs text-[var(--muted)]">{selectedStop.externalId}</p>
                <p className="mt-2 text-xs">
                  Proxima llegada:{' '}
                  <span className="font-semibold">
                    {selectedStop.etaMinutes === null ? 'sin dato' : `${selectedStop.etaMinutes} min`}
                  </span>
                </p>
                <p className="text-xs">
                  Estado:{' '}
                  <span className="font-semibold">
                    {selectedStop.isStale ? 'stale' : 'operativo'}
                  </span>
                </p>
              </div>
            </Popup>
          ) : null}
        </Map>
      </div>
    </section>
  );
}
