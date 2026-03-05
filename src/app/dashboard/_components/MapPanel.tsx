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
const MIN_MAP_HEIGHT = 300;
const MAX_MAP_HEIGHT = 620;
const DEFAULT_MAP_HEIGHT = 420;

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
  const [mapHeight, setMapHeight] = useState(DEFAULT_MAP_HEIGHT);

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

  useEffect(() => {
    if (!isMapReady) {
      return;
    }

    mapRef.current?.resize();
  }, [isMapReady, mapHeight]);

  const increaseMapHeight = () => {
    setMapHeight((currentHeight) => Math.min(MAX_MAP_HEIGHT, currentHeight + 40));
  };

  const decreaseMapHeight = () => {
    setMapHeight((currentHeight) => Math.max(MIN_MAP_HEIGHT, currentHeight - 40));
  };

  return (
    <section className="dashboard-card">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Mapa operativo de estaciones</h2>
          <p className="text-xs text-[var(--muted)]">
            Haz click en un punto para actualizar todo el analisis de la estacion.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="kpi-chip">{stations.length} estaciones</span>
          <div className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-2 py-1 text-xs">
            <button
              type="button"
              onClick={decreaseMapHeight}
              className="h-6 w-6 rounded-full border border-[var(--border)] text-sm leading-none text-[var(--foreground)] transition hover:border-[var(--accent-soft)]"
              aria-label="Reducir alto del mapa"
            >
              -
            </button>
            <span className="min-w-[52px] text-center">{mapHeight}px</span>
            <button
              type="button"
              onClick={increaseMapHeight}
              className="h-6 w-6 rounded-full border border-[var(--border)] text-sm leading-none text-[var(--foreground)] transition hover:border-[var(--accent-soft)]"
              aria-label="Aumentar alto del mapa"
            >
              +
            </button>
          </div>
        </div>
      </header>

      <div
        className="relative w-full overflow-hidden rounded-2xl border border-[var(--border)]"
        style={{ height: `${mapHeight}px`, minHeight: `${MIN_MAP_HEIGHT}px` }}
      >
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
            <NavigationControl position="top-right" showCompass={false} />
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

      <div className="space-y-1">
        <input
          type="range"
          min={MIN_MAP_HEIGHT}
          max={MAX_MAP_HEIGHT}
          step={20}
          value={mapHeight}
          onChange={(event) => setMapHeight(Number(event.target.value))}
          className="w-full accent-[var(--accent)]"
          aria-label="Control de tamano del mapa"
        />
        <p className="text-[11px] text-[var(--muted)]">
          Ajusta el alto para priorizar detalle cartografico o analitica en movil.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-[var(--muted)] sm:grid-cols-4">
        <div className="legend-item">
          <span className="h-2.5 w-2.5 rounded-full bg-[#0ea5a2]" /> Alta disponibilidad
        </div>
        <div className="legend-item">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" /> Nivel medio
        </div>
        <div className="legend-item">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" /> Critica
        </div>
        <div className="legend-item">
          <span className="h-2.5 w-2.5 rounded-full bg-[#7f8595]" /> Sin datos
        </div>
      </div>
    </section>
  );
}
