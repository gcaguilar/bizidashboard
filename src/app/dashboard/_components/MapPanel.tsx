'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GeoJSONSource } from 'maplibre-gl';
import type { StyleSpecification } from 'react-map-gl/maplibre';
import {
  Layer,
  Map,
  Marker,
  NavigationControl,
  Popup,
  Source,
  type LayerProps,
  type MapLayerMouseEvent,
  type MapRef,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { StationSnapshot } from '@/lib/api';
import { formatDistanceMeters, type Coordinates } from '@/lib/geo';

type StationTrend = 'up' | 'down' | 'flat';

type MapPanelProps = {
  stations: StationSnapshot[];
  totalStations: number;
  selectedStationId?: string;
  onSelectStation?: (stationId: string) => void;
  favoriteStationIds?: string[];
  onToggleFavorite?: (stationId: string) => void;
  trendByStationId?: Record<string, StationTrend>;
  nearestStationId?: string | null;
  nearestDistanceMeters?: number | null;
  userLocation?: Coordinates | null;
};

const DEFAULT_VIEW_STATE = {
  latitude: 41.65,
  longitude: -0.88,
  zoom: 12,
};

const FOCUS_ZOOM = 14.8;
const MAP_HEIGHT = 560;
const MAP_STYLE_LIGHT: StyleSpecification = {
  version: 8,
  sources: {
    cartoLight: {
      type: 'raster',
      tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    },
  },
  layers: [
    {
      id: 'carto-light',
      type: 'raster',
      source: 'cartoLight',
    },
  ],
};

const MAP_STYLE_DARK: StyleSpecification = {
  version: 8,
  sources: {
    cartoDark: {
      type: 'raster',
      tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    },
  },
  layers: [
    {
      id: 'carto-dark',
      type: 'raster',
      source: 'cartoDark',
    },
  ],
};

const CLUSTER_LAYER: LayerProps = {
  id: 'clusters',
  type: 'circle',
  source: 'stations-source',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': '#ea0615',
    'circle-radius': ['step', ['get', 'point_count'], 18, 20, 22, 50, 28],
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 2,
  },
};

const SELECTED_HALO_LAYER: LayerProps = {
  id: 'selected-halo',
  type: 'circle',
  source: 'stations-source',
  filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'isSelected'], 1]],
  paint: {
    'circle-color': 'rgba(234, 6, 21, 0.18)',
    'circle-radius': 16,
    'circle-stroke-color': '#ea0615',
    'circle-stroke-width': 1,
  },
};

const UNCLUSTERED_POINTS_LAYER: LayerProps = {
  id: 'unclustered-points',
  type: 'circle',
  source: 'stations-source',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': ['coalesce', ['get', 'markerColor'], '#64748b'],
    'circle-radius': ['case', ['==', ['get', 'isSelected'], 1], 10, 8],
    'circle-stroke-color': ['case', ['==', ['get', 'isFavorite'], 1], '#facc15', '#f8fafc'],
    'circle-stroke-width': ['case', ['==', ['get', 'isFavorite'], 1], 3, 2],
    'circle-opacity': 0.96,
  },
};

function getMarkerColor(station: StationSnapshot): string {
  if (station.capacity <= 0) {
    return '#64748b';
  }

  if (station.anchorsFree <= 0) {
    return '#991b1b';
  }

  if (station.bikesAvailable <= 0) {
    return '#7c2d12';
  }

  const ratio = station.bikesAvailable / station.capacity;

  if (ratio > 0.55) {
    return '#0f766e';
  }

  if (ratio > 0.25) {
    return '#b45309';
  }

  return '#b91c1c';
}

function getTrendLabel(trend: StationTrend | undefined): string {
  if (trend === 'up') {
    return '↑ Suben bicis';
  }

  if (trend === 'down') {
    return '↓ Bajan bicis';
  }

  return '→ Sin cambios';
}

export function MapPanel({
  stations,
  totalStations,
  selectedStationId,
  onSelectStation,
  favoriteStationIds = [],
  onToggleFavorite,
  trendByStationId,
  nearestStationId,
  nearestDistanceMeters,
  userLocation,
}: MapPanelProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [dismissedPopupId, setDismissedPopupId] = useState<string | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  const favoriteStationSet = useMemo(() => new Set(favoriteStationIds), [favoriteStationIds]);

  useEffect(() => {
    const root = document.documentElement;

    const syncTheme = () => {
      setIsDarkTheme(root.classList.contains('dark'));
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const stationCollection = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: stations
        .filter((station) => Number.isFinite(station.lat) && Number.isFinite(station.lon))
        .map((station) => ({
          type: 'Feature' as const,
          properties: {
            stationId: station.id,
            stationName: station.name,
            markerColor: getMarkerColor(station),
            isFavorite: favoriteStationSet.has(station.id) ? 1 : 0,
            isSelected: selectedStationId && selectedStationId === station.id ? 1 : 0,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [station.lon, station.lat] as [number, number],
          },
        })),
    };
  }, [favoriteStationSet, selectedStationId, stations]);

  const selectedStation = useMemo(() => {
    if (!selectedStationId) {
      return null;
    }

    return stations.find((station) => station.id === selectedStationId) ?? null;
  }, [selectedStationId, stations]);

  const popupStation = useMemo(() => {
    if (!selectedStationId || dismissedPopupId === selectedStationId) {
      return null;
    }

    return stations.find((station) => station.id === selectedStationId) ?? null;
  }, [dismissedPopupId, selectedStationId, stations]);

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
      duration: 850,
      essential: true,
    });
  }, [isMapReady, selectedStation]);

  const handleZoomIn = () => {
    mapRef.current?.getMap()?.zoomIn({ duration: 240 });
  };

  const handleZoomOut = () => {
    mapRef.current?.getMap()?.zoomOut({ duration: 240 });
  };

  const expandCluster = async (clusterId: number, coordinates: [number, number]) => {
    const source = mapRef.current?.getMap().getSource('stations-source') as GeoJSONSource | undefined;

    if (!source) {
      return;
    }

    try {
      const zoom = await source.getClusterExpansionZoom(clusterId);

      if (!Number.isFinite(zoom)) {
        return;
      }

      mapRef.current?.flyTo({
        center: coordinates,
        zoom,
        duration: 480,
      });
    } catch {
      return;
    }
  };

  const handleMapClick = (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];

    if (!feature) {
      return;
    }

    const properties = (feature.properties as Record<string, unknown>) ?? {};
    const isCluster = Boolean(properties.cluster);

    if (isCluster) {
      const clusterId = Number(properties.cluster_id);
      const coordinates = (feature.geometry as { coordinates?: [number, number] }).coordinates;

      if (!Number.isFinite(clusterId) || !coordinates) {
        return;
      }

      void expandCluster(clusterId, coordinates);

      return;
    }

    const stationId = String(properties.stationId ?? '');

    if (!stationId) {
      return;
    }

    setDismissedPopupId(null);
    onSelectStation?.(stationId);
  };

  const mapStyle = isDarkTheme ? MAP_STYLE_DARK : MAP_STYLE_LIGHT;
  const isFilteredView = stations.length !== totalStations;

  return (
    <section
      className="relative w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]"
      style={{ height: `${MAP_HEIGHT}px` }}
    >
      <div className="absolute left-4 top-4 z-20 rounded-lg border border-[var(--border)] bg-[var(--surface)]/90 px-3 py-2 text-xs font-semibold text-[var(--foreground)] backdrop-blur">
        Mapa operativo · {stations.length}/{totalStations} estaciones
        {isFilteredView ? ' (filtradas)' : ''}
      </div>

      <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleZoomIn}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)]/90 text-sm font-bold text-[var(--foreground)] backdrop-blur"
          aria-label="Acercar"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)]/90 text-sm font-bold text-[var(--foreground)] backdrop-blur"
          aria-label="Alejar"
        >
          -
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-20 flex max-w-[90%] flex-wrap gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 px-3 py-2 text-[11px] backdrop-blur">
        <span className="legend-item">🚲 Con bicis</span>
        <span className="legend-item">✕ Llena</span>
        <span className="legend-item">○ Sin bicis</span>
        <span className="legend-item">★ Favorita</span>
      </div>

      <div className="h-full w-full">
        {stations.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
            No hay estaciones disponibles para los filtros actuales.
          </div>
        ) : (
          <Map
            ref={mapRef}
            onLoad={() => setIsMapReady(true)}
            onClick={handleMapClick}
            interactiveLayerIds={['clusters', 'unclustered-points']}
            initialViewState={{
              latitude: DEFAULT_VIEW_STATE.latitude,
              longitude: DEFAULT_VIEW_STATE.longitude,
              zoom: DEFAULT_VIEW_STATE.zoom,
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle={mapStyle}
          >
            <NavigationControl position="bottom-right" showCompass={false} />

            <Source
              id="stations-source"
              type="geojson"
              data={stationCollection}
              cluster
              clusterRadius={50}
              clusterMaxZoom={13}
            >
            <Layer {...CLUSTER_LAYER} />
            <Layer {...SELECTED_HALO_LAYER} />
            <Layer {...UNCLUSTERED_POINTS_LAYER} />
          </Source>

            {userLocation ? (
              <Marker longitude={userLocation.longitude} latitude={userLocation.latitude} anchor="center">
                <div className="relative flex h-4 w-4 items-center justify-center" aria-label="Tu ubicacion aproximada">
                  <span className="absolute inline-flex h-7 w-7 animate-ping rounded-full bg-sky-500/35" />
                  <span className="relative inline-flex h-3 w-3 rounded-full border border-white bg-sky-500" />
                </div>
              </Marker>
            ) : null}

            {popupStation ? (
              <Popup
                longitude={popupStation.lon}
                latitude={popupStation.lat}
                offset={18}
                closeOnClick={false}
                className="station-map-popup"
                onClose={() => setDismissedPopupId(selectedStationId ?? null)}
              >
                <div className="min-w-[220px] text-[var(--foreground)]">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold">{popupStation.name}</p>
                      <p className="text-xs text-[var(--muted)]">ID #{popupStation.id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleFavorite?.(popupStation.id)}
                      aria-pressed={favoriteStationSet.has(popupStation.id)}
                      className={`rounded-md border px-2 py-1 text-xs font-bold transition ${
                        favoriteStationSet.has(popupStation.id)
                          ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]'
                          : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                      }`}
                    >
                      {favoriteStationSet.has(popupStation.id) ? '★ Favorita' : '☆ Favorita'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <p className="rounded bg-[var(--surface-soft)] px-2 py-1">
                      🚲 Bicis: <span className="font-semibold">{popupStation.bikesAvailable}</span>
                    </p>
                    <p className="rounded bg-[var(--surface-soft)] px-2 py-1">
                      ✕ Huecos: <span className="font-semibold">{popupStation.anchorsFree}</span>
                    </p>
                  </div>

                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Tendencia: {getTrendLabel(trendByStationId?.[popupStation.id])}
                  </p>

                  {nearestStationId === popupStation.id ? (
                    <p className="mt-1 text-xs font-semibold text-[var(--accent)]">
                      📍 A {formatDistanceMeters(nearestDistanceMeters)} de ti
                    </p>
                  ) : null}
                </div>
              </Popup>
            ) : null}
          </Map>
        )}
      </div>
    </section>
  );
}
