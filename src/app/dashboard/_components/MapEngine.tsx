'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Layer, Map, Marker, Popup, Source } from 'react-map-gl/maplibre';
import type { LayerProps, MapLayerMouseEvent, MapRef } from 'react-map-gl/maplibre';
// MapLibre GL JS v6 resolves its worker from `import.meta.url` at runtime, which
// bundlers (Vite) can't statically trace, so the worker file would never be
// emitted. Importing it with `?url` emits it and we hand the URL to react-map-gl
// (which calls `setWorkerUrl` before creating the map).
// @see https://maplibre.org/maplibre-gl-js/docs/guides/v5-to-v6-migration-guide/
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from '@/components/ui/button';
import { MapStationList } from './MapStationList';
import { StationStatusLabel } from '@/components/ui/station-status';
import type { DashboardViewMode } from '@/lib/dashboard-modes';
import type { StationSnapshot } from '@/lib/api-types';
import { formatDistanceMeters, type Coordinates } from '@/lib/geo';
import {
  getAnalyticalMarkerColor,
  getAnalyticalMarkerGlyph,
  getAnalyticalMarkerSeverity,
  getCitizenMarkerColor,
  getCitizenMarkerGlyph,
  getCitizenMarkerSeverity,
  getCitizenStatus,
  type MapColorScale,
} from '@/lib/map-colors';
import { buildStationFeatureCollection } from '@/lib/map-features';
import { MAP_FONT_STACK, resolveMapStyle } from '@/lib/map-style';
import type { DashboardMapViewState } from '@/lib/map-view-state';
import { appRoutes } from '@/lib/routes';

type StationTrend = 'up' | 'down' | 'flat';

type MapEngineProps = {
  stations: StationSnapshot[];
  colorScale?: MapColorScale;
  viewMode?: DashboardViewMode;
  initialViewState?: DashboardMapViewState;
  frictionByStationId?: Record<string, number>;
  selectedStationId?: string;
  onSelectStation?: (stationId: string) => void;
  favoriteStationIds?: string[];
  onToggleFavorite?: (stationId: string) => void;
  trendByStationId?: Record<string, StationTrend>;
  nearestStationId?: string | null;
  nearestDistanceMeters?: number | null;
  userLocation?: Coordinates | null;
  onViewStateCommit?: (state: DashboardMapViewState) => void;
};

const DEFAULT_VIEW_STATE = {
  latitude: 41.65,
  longitude: -0.88,
  zoom: 12,
};

const FOCUS_ZOOM = 14.8;

const CLUSTER_LAYER: LayerProps = {
  id: 'clusters',
  type: 'circle',
  source: 'stations-source',
  filter: ['has', 'point_count'],
  paint: {
    // Color por la severidad media del grupo (déficit ponderado) para que un
    // clúster con estaciones agotadas no se pinte como uno sano. La escala
    // replica los tonos de `ANALYTICAL_MAP_LEGEND`/`getAnalyticalMarkerColor`.
    'circle-color': [
      'step',
      ['/', ['coalesce', ['get', 'severitySum'], 0], ['max', ['coalesce', ['get', 'point_count'], 1], 1]],
      '#0f766e',
      0.5,
      '#b45309',
      1.5,
      '#b91c1c',
      2.5,
      '#991b1b',
    ],
    'circle-radius': ['step', ['get', 'point_count'], 18, 20, 22, 50, 28],
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 2,
  },
};

const CLUSTER_COUNT_LAYER: LayerProps = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'stations-source',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': ['get', 'point_count_abbreviated'],
    'text-font': MAP_FONT_STACK,
    'text-size': 12,
    'text-allow-overlap': true,
  },
  paint: {
    'text-color': '#ffffff',
    'text-halo-color': 'rgba(0, 0, 0, 0.45)',
    'text-halo-width': 1,
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

// Glifo del estado dentro de cada marcador: el estado no depende solo del color.
const UNCLUSTERED_GLYPH_LAYER: LayerProps = {
  id: 'unclustered-glyphs',
  type: 'symbol',
  source: 'stations-source',
  filter: ['!', ['has', 'point_count']],
  layout: {
    'text-field': ['coalesce', ['get', 'markerGlyph'], ''],
    'text-font': MAP_FONT_STACK,
    'text-size': 12,
    'text-allow-overlap': true,
    'text-ignore-placement': true,
  },
  paint: {
    'text-color': '#ffffff',
    'text-halo-color': 'rgba(0, 0, 0, 0.35)',
    'text-halo-width': 0.5,
  },
};

// Si el estilo/teselas no responden pasado este tiempo se avisa al usuario.
const MAP_LOAD_TIMEOUT_MS = 12000;

const OPERATIONS_HEAT_LAYER: LayerProps = {
  id: 'operations-heat',
  type: 'circle',
  source: 'stations-source',
  filter: ['all', ['!', ['has', 'point_count']], ['>', ['coalesce', ['get', 'frictionScore'], 0], 0]],
  paint: {
    'circle-color': '#ea0615',
    'circle-radius': [
      'interpolate',
      ['linear'],
      ['coalesce', ['get', 'frictionScore'], 0],
      0,
      10,
      4,
      18,
      8,
      28,
      16,
      42,
    ],
    'circle-opacity': 0.14,
    'circle-blur': 0.7,
    'circle-stroke-width': 0,
  },
};

function getTrendLabel(trend: StationTrend | undefined): string {
  if (trend === 'up') {
    return '↑ Suben bicis';
  }

  if (trend === 'down') {
    return '↓ Bajan bicis';
  }

  return '→ Sin cambios';
}

const EMPTY_FRICTION: Record<string, number> = {};
const EMPTY_FAVORITES: string[] = [];

export function MapEngine({
  stations,
  colorScale = 'analytical',
  viewMode = 'overview',
  initialViewState,
  frictionByStationId = EMPTY_FRICTION,
  selectedStationId,
  onSelectStation,
  favoriteStationIds = EMPTY_FAVORITES,
  onToggleFavorite,
  trendByStationId,
  nearestStationId,
  nearestDistanceMeters,
  userLocation,
  onViewStateCommit,
}: MapEngineProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [dismissedPopupId, setDismissedPopupId] = useState<string | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [hasTileError, setHasTileError] = useState(false);
  const [hasLoadTimedOut, setHasLoadTimedOut] = useState(false);
  const [viewCenter, setViewCenter] = useState<Coordinates | null>(null);

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
    return buildStationFeatureCollection({
      stations,
      getMarkerColor: colorScale === 'citizen' ? getCitizenMarkerColor : getAnalyticalMarkerColor,
      getMarkerSeverity:
        colorScale === 'citizen' ? getCitizenMarkerSeverity : getAnalyticalMarkerSeverity,
      getMarkerGlyph: colorScale === 'citizen' ? getCitizenMarkerGlyph : getAnalyticalMarkerGlyph,
      favoriteStationIds: favoriteStationSet,
      selectedStationId,
      frictionByStationId,
    });
  }, [colorScale, favoriteStationSet, frictionByStationId, selectedStationId, stations]);

  const selectedStationPosition = useMemo(() => {
    if (!selectedStationId) return null;
    const station = stations.find((s) => s.id === selectedStationId);
    if (!station || !Number.isFinite(station.lat) || !Number.isFinite(station.lon)) return null;
    return { lat: station.lat, lon: station.lon };
  }, [selectedStationId, stations]);

  useEffect(() => {
    if (!isMapReady || !selectedStationPosition) {
      return;
    }

    mapRef.current?.flyTo({
      center: [selectedStationPosition.lon, selectedStationPosition.lat],
      zoom: FOCUS_ZOOM,
      duration: 850,
      essential: true,
    });
  }, [isMapReady, selectedStationPosition]);

  const popupStation = useMemo(() => {
    if (!selectedStationId || dismissedPopupId === selectedStationId) {
      return null;
    }

    return stations.find((station) => station.id === selectedStationId) ?? null;
  }, [dismissedPopupId, selectedStationId, stations]);

  useEffect(() => {
    if (isMapReady) {
      return;
    }

    const timer = setTimeout(() => setHasLoadTimedOut(true), MAP_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isMapReady]);

  // Teclado: Escape cierra la ficha emergente de la estación seleccionada.
  useEffect(() => {
    if (!popupStation) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDismissedPopupId(popupStation.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [popupStation]);

  const handleMapLoad = () => {
    setIsMapReady(true);
    // El canvas de MapLibre es focusable (flechas = mover, +/- = zoom); le damos nombre accesible.
    mapRef.current
      ?.getMap()
      .getCanvas()
      .setAttribute(
        'aria-label',
        'Mapa de estaciones. Con el mapa enfocado usa las flechas para moverte y más o menos para acercar o alejar. La lista de estaciones tiene las mismas estaciones en texto.'
      );
  };

  const handleZoomIn = () => {
    mapRef.current?.getMap()?.zoomIn({ duration: 240 });
  };

  const handleZoomOut = () => {
    mapRef.current?.getMap()?.zoomOut({ duration: 240 });
  };

  const commitMapViewState = () => {
    const map = mapRef.current?.getMap();

    if (!map) {
      return;
    }

    const center = map.getCenter();
    setViewCenter({ latitude: center.lat, longitude: center.lng });

    if (!onViewStateCommit) {
      return;
    }

    onViewStateCommit({
      latitude: center.lat,
      longitude: center.lng,
      zoom: map.getZoom(),
    });
  };

  const expandCluster = async (clusterId: number, coordinates: [number, number]) => {
    const source = mapRef.current?.getMap().getSource('stations-source');

    if (!source) {
      return;
    }

    try {
      const clusterSource = source as unknown as { getClusterExpansionZoom: (id: number) => Promise<number> };
      const zoom = await clusterSource.getClusterExpansionZoom(clusterId);

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

    const stationId = typeof properties.stationId === 'string' ? properties.stationId : '';

    if (!stationId) {
      return;
    }

    setDismissedPopupId(null);
    onSelectStation?.(stationId);
  };

  const handleListSelect = (stationId: string) => {
    setDismissedPopupId(null);
    onSelectStation?.(stationId);
  };

  const mapStyle = useMemo(() => resolveMapStyle(isDarkTheme ? 'dark' : 'light'), [isDarkTheme]);

  if (stations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[var(--muted)]">
        No hay estaciones para los filtros actuales. Desactiva “solo con bicis” o “solo con huecos” para ampliar resultados.
      </div>
    );
  }

  return (
    <>
      <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
        <Button
          onClick={handleZoomIn}
          variant="icon-button"
          size="default"
          aria-label="Acercar"
        >
          +
        </Button>
        <Button
          onClick={handleZoomOut}
          variant="icon-button"
          size="default"
          aria-label="Alejar"
        >
          -
        </Button>
      </div>

      {(hasTileError || hasLoadTimedOut) && (!isMapReady || hasTileError) ? (
        <div
          role="status"
          className="absolute inset-x-4 top-16 z-20 mx-auto max-w-sm rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-center text-xs text-[var(--foreground)] shadow-md"
        >
          {isMapReady
            ? 'No se pudo cargar el mapa base. Las estaciones siguen siendo válidas. '
            : 'El mapa tarda en cargar o no está disponible. '}
          <a className="font-semibold underline" href={appRoutes.statsEstaciones()}>
            Ver la lista de estaciones
          </a>
        </div>
      ) : null}

      <Map
        ref={mapRef}
        onLoad={handleMapLoad}
        onError={(event) => {
          // Sin teselas el mapa base queda vacío, pero las estaciones se siguen pintando.
          const message = String((event as { error?: { message?: string } }).error?.message ?? '');
          if (!isMapReady || /tile|fetch|network|failed|load/i.test(message)) {
            setHasTileError(true);
          }
        }}
        onClick={handleMapClick}
        onMoveEnd={commitMapViewState}
        interactiveLayerIds={['clusters', 'unclustered-points']}
        initialViewState={{
          latitude: initialViewState?.latitude ?? DEFAULT_VIEW_STATE.latitude,
          longitude: initialViewState?.longitude ?? DEFAULT_VIEW_STATE.longitude,
          zoom: initialViewState?.zoom ?? DEFAULT_VIEW_STATE.zoom,
        }}
        styleDiffing={false}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        workerUrl={maplibreWorkerUrl}
      >
        <Source
          id="stations-source"
          type="geojson"
          data={stationCollection}
          cluster
          clusterRadius={50}
          clusterMaxZoom={13}
          clusterProperties={{
            severitySum: ['+', ['get', 'severity']],
            criticalCount: ['+', ['case', ['>=', ['get', 'severity'], 2], 1, 0]],
          }}
        >
          {viewMode === 'operations' ? <Layer {...OPERATIONS_HEAT_LAYER} /> : null}
          <Layer {...CLUSTER_LAYER} />
          <Layer {...SELECTED_HALO_LAYER} />
          <Layer {...UNCLUSTERED_POINTS_LAYER} />
          <Layer {...UNCLUSTERED_GLYPH_LAYER} />
          <Layer {...CLUSTER_COUNT_LAYER} />
        </Source>

        {userLocation ? (
          <Marker longitude={userLocation.longitude} latitude={userLocation.latitude} anchor="center">
            <div className="relative flex h-4 w-4 items-center justify-center" aria-label="Tu ubicación aproximada">
              <span className="absolute inline-flex h-7 w-7 animate-ping rounded-full bg-[var(--primary)]/35" />
              <span className="relative inline-flex h-3 w-3 rounded-full border border-white bg-[var(--primary)]" />
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
                <Button
                  onClick={() => onToggleFavorite?.(popupStation.id)}
                  aria-pressed={favoriteStationSet.has(popupStation.id)}
                  variant="outline"
                  size="sm"
                  className={`min-h-0 rounded-md px-2 py-1 text-xs font-bold transition ${
                    favoriteStationSet.has(popupStation.id)
                      ? 'map-popup-accent border-[var(--primary)] bg-[var(--primary)]/15 hover:bg-[var(--primary)]/20'
                      : 'border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                  }`}
                >
                  {favoriteStationSet.has(popupStation.id) ? '★ Favorita' : '☆ Favorita'}
                </Button>
              </div>

              <StationStatusLabel status={getCitizenStatus(popupStation)} className="mb-2" />

              <div className="grid grid-cols-2 gap-2 text-xs">
                <p className="rounded bg-[var(--secondary)] px-2 py-1">
                  🚲 Bicis: <span className="font-semibold">{popupStation.bikesAvailable}</span>
                </p>
                <p className="rounded bg-[var(--secondary)] px-2 py-1">
                  ✕ Huecos: <span className="font-semibold">{popupStation.anchorsFree}</span>
                </p>
              </div>

              <p className="mt-2 text-xs text-[var(--muted)]">
                Tendencia: {getTrendLabel(trendByStationId?.[popupStation.id])}
              </p>

              {nearestStationId === popupStation.id ? (
                <p className="map-popup-accent mt-1 text-xs font-semibold">
                  📍 A {formatDistanceMeters(nearestDistanceMeters)} de ti
                </p>
              ) : null}
            </div>
          </Popup>
        ) : null}
      </Map>

      <MapStationList
        stations={stations}
        selectedStationId={selectedStationId}
        referencePoint={
          userLocation ??
          viewCenter ?? {
            latitude: initialViewState?.latitude ?? DEFAULT_VIEW_STATE.latitude,
            longitude: initialViewState?.longitude ?? DEFAULT_VIEW_STATE.longitude,
          }
        }
        onSelect={handleListSelect}
      />
    </>
  );
}
