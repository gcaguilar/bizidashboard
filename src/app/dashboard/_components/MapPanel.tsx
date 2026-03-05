'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Map,
  Marker,
  NavigationControl,
  type MapRef,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { StationSnapshot } from '@/lib/api';

type MapPanelProps = {
  stations: StationSnapshot[];
  selectedStationId?: string;
  onSelectStation?: (stationId: string) => void;
};

const DEFAULT_VIEW_STATE = {
  latitude: 41.65,
  longitude: -0.88,
  zoom: 12,
};

const FOCUS_ZOOM = 14.8;
const MAP_HEIGHT = 560;

function getMarkerColor(station: StationSnapshot): string {
  if (station.capacity <= 0) {
    return '#7f8595';
  }

  const ratio = station.bikesAvailable / station.capacity;

  if (ratio > 0.55) {
    return '#0ea5a2';
  }

  if (ratio > 0.25) {
    return '#f59e0b';
  }

  return '#ef4444';
}

export function MapPanel({
  stations,
  selectedStationId,
  onSelectStation,
}: MapPanelProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const selectedStation = useMemo(() => {
    if (!selectedStationId) {
      return null;
    }

    return stations.find((station) => station.id === selectedStationId) ?? null;
  }, [selectedStationId, stations]);

  useEffect(() => {
    if (!isMapReady || !selectedStation) {
      return;
    }

    if (!Number.isFinite(selectedStation.lat) || !Number.isFinite(selectedStation.lon)) {
      return;
    }

    mapRef.current?.flyTo({
      center: [selectedStation.lon, selectedStation.lat],
      zoom: FOCUS_ZOOM,
      duration: 900,
      essential: true,
    });
  }, [isMapReady, selectedStation]);

  return (
    <section
      className="relative w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]"
      style={{ height: `${MAP_HEIGHT}px` }}
    >
      <div className="absolute left-4 top-4 z-20 rounded-lg border border-[var(--border)] bg-[var(--surface)]/90 px-3 py-2 text-xs font-semibold text-[var(--foreground)] backdrop-blur">
        Mapa operativo · {stations.length} estaciones
      </div>

      <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)]/90 text-sm font-bold text-[var(--foreground)] backdrop-blur"
          aria-label="Acercar"
        >
          +
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)]/90 text-sm font-bold text-[var(--foreground)] backdrop-blur"
          aria-label="Alejar"
        >
          -
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]/90 px-3 py-2 text-[11px] backdrop-blur">
        <span className="legend-item">
          <span className="h-2.5 w-2.5 rounded-full bg-[#0ea5a2]" /> Disponible
        </span>
        <span className="legend-item">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" /> Bajo stock
        </span>
        <span className="legend-item">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" /> Critica
        </span>
      </div>

      <div className="h-full w-full">
        {stations.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
            No hay estaciones disponibles.
          </div>
        ) : (
          <Map
            ref={mapRef}
            onLoad={() => setIsMapReady(true)}
            initialViewState={{
              latitude: DEFAULT_VIEW_STATE.latitude,
              longitude: DEFAULT_VIEW_STATE.longitude,
              zoom: DEFAULT_VIEW_STATE.zoom,
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          >
            <NavigationControl position="bottom-right" showCompass={false} />
            {stations.map((station) => {
              const isSelected = Boolean(selectedStationId && station.id === selectedStationId);

              return (
                <Marker
                  key={station.id}
                  longitude={station.lon}
                  latitude={station.lat}
                  anchor="bottom"
                >
                  <div className="group relative flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => onSelectStation?.(station.id)}
                      disabled={!onSelectStation}
                      className={`h-3.5 w-3.5 rounded-full border border-white shadow-sm transition-all duration-300 ${
                        isSelected
                          ? 'scale-150 ring-4 ring-[#ef444455]'
                          : 'scale-100 hover:scale-125'
                      } ${onSelectStation ? 'cursor-pointer' : 'cursor-default'}`}
                      style={{ backgroundColor: getMarkerColor(station) }}
                      aria-label={`Estacion ${station.name}`}
                    />
                    <div className="pointer-events-none absolute -top-10 whitespace-nowrap rounded-full bg-black/80 px-3 py-1 text-[10px] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                      {station.name} · {station.bikesAvailable} bicis · {station.anchorsFree} libres
                    </div>
                  </div>
                </Marker>
              );
            })}
          </Map>
        )}
      </div>
    </section>
  );
}
