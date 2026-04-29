'use client';

import { useEffect, useMemo, useState } from 'react';
import { Layer, Map as MapView, Source, type StyleSpecification } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { StationSnapshot } from '@/lib/api';
import {
  buildStationDistrictMap,
  fetchDistrictCollection,
  type DistrictCollection,
} from '@/lib/districts';
import { formatPercent } from '@/lib/format';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';

const DISTRICT_FILL_LAYER = {
  id: 'district-fill-layer',
  type: 'fill' as const,
  paint: {
    'fill-color': [
      'case',
      ['==', ['get', 'stationCount'], 0],
      '#2a2022',
      ['<', ['get', 'relativeScore'], -0.12],
      '#8f2430',
      ['<', ['get', 'relativeScore'], -0.04],
      '#bf4a47',
      ['<', ['get', 'relativeScore'], 0.04],
      '#9c7682',
      ['<', ['get', 'relativeScore'], 0.12],
      '#5a8f8d',
      '#3da39a',
    ],
    'fill-opacity': 0.75,
  },
};

const DISTRICT_BORDER_LAYER = {
  id: 'district-border-layer',
  type: 'line' as const,
  paint: {
    'line-color': '#f0d5d3',
    'line-width': 0.9,
    'line-opacity': 0.55,
  },
};

const STATION_POINTS_LAYER = {
  id: 'district-station-points-layer',
  type: 'circle' as const,
  paint: {
    'circle-color': [
      'case',
      ['<', ['get', 'occupancy'], 0],
      '#8b8b91',
      ['<', ['get', 'occupancy'], 0.25],
      '#b91c1c',
      ['<', ['get', 'occupancy'], 0.5],
      '#f97316',
      ['<', ['get', 'occupancy'], 0.75],
      '#84cc16',
      '#10b981',
    ],
    'circle-radius': ['case', ['==', ['get', 'selected'], 1], 4.5, 3],
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': ['case', ['==', ['get', 'selected'], 1], 1.2, 0.8],
    'circle-opacity': 0.95,
  },
};

const DISTRICT_FILL_LAYER_PROPS =
  DISTRICT_FILL_LAYER as unknown as Parameters<typeof Layer>[0];
const DISTRICT_BORDER_LAYER_PROPS =
  DISTRICT_BORDER_LAYER as unknown as Parameters<typeof Layer>[0];
const STATION_POINTS_LAYER_PROPS =
  STATION_POINTS_LAYER as unknown as Parameters<typeof Layer>[0];

const MINI_MAP_STYLE: StyleSpecification = {
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

type DistrictRow = {
  name: string;
  bikesScore: number;
  stationCount: number;
};

type NeighborhoodMiniMapProps = {
  stations: StationSnapshot[];
  selectedStationId?: string;
};

function toOccupancy(station: StationSnapshot): number | null {
  if (!Number.isFinite(station.capacity) || station.capacity <= 0) {
    return null;
  }

  if (!Number.isFinite(station.bikesAvailable)) {
    return null;
  }

  return station.bikesAvailable / station.capacity;
}

export function NeighborhoodMiniMap({
  stations,
  selectedStationId,
}: NeighborhoodMiniMapProps) {
  const [districts, setDistricts] = useState<DistrictCollection | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadDistricts = async () => {
      try {
        setErrorMessage(null);
        const payload = await fetchDistrictCollection(controller.signal);

        if (!payload) {
          throw new Error('GeoJSON de distritos invalido.');
        }

        if (!isActive) {
          return;
        }

        setDistricts(payload);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }

        captureExceptionWithContext(error, {
          area: 'dashboard.neighborhood-mini-map',
          operation: 'loadDistricts',
        });
        console.error('[Dashboard] No se pudo cargar el mapa de distritos.', error);

        if (isActive) {
          setErrorMessage('No se pudo cargar el mapa de barrios.');
        }
      }
    };

    void loadDistricts();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const stationDistrictMap = useMemo(() => {
    if (!districts) {
      return new Map<string, string>();
    }

    return buildStationDistrictMap(stations, districts);
  }, [districts, stations]);

  const cityAverage = useMemo(() => {
    const occupancyRows = stations
      .map((station) => toOccupancy(station))
      .filter((value): value is number => value !== null);

    if (occupancyRows.length === 0) {
      return 0;
    }

    return occupancyRows.reduce((sum, value) => sum + value, 0) / occupancyRows.length;
  }, [stations]);

  const districtRows = useMemo<DistrictRow[]>(() => {
    const totals = new Map<string, { sum: number; count: number }>();

    for (const station of stations) {
      const district = stationDistrictMap.get(station.id);
      const occupancy = toOccupancy(station);

      if (!district || occupancy === null) {
        continue;
      }

      const entry = totals.get(district) ?? { sum: 0, count: 0 };
      entry.sum += occupancy;
      entry.count += 1;
      totals.set(district, entry);
    }

    return Array.from(totals.entries())
      .map(([name, values]) => ({
        name,
        bikesScore: values.sum / values.count,
        stationCount: values.count,
      }))
      .sort((left, right) => left.bikesScore - right.bikesScore);
  }, [stationDistrictMap, stations]);

  const districtRowsMap = useMemo(() => {
    return new Map(districtRows.map((row) => [row.name, row]));
  }, [districtRows]);

  const districtsWithMetrics = useMemo<DistrictCollection | null>(() => {
    if (!districts) {
      return null;
    }

    return {
      ...districts,
      features: districts.features.map((feature) => {
        const districtName = feature.properties?.distrito;
        const districtRow = districtName ? districtRowsMap.get(districtName) : null;
        const bikesScore = districtRow?.bikesScore ?? null;
        const stationCount = districtRow?.stationCount ?? 0;
        const relativeScore =
          bikesScore === null ? null : Number((bikesScore - cityAverage).toFixed(4));

        return {
          ...feature,
          properties: {
            ...(feature.properties ?? {}),
            bikesScore,
            stationCount,
            relativeScore,
          },
        };
      }),
    };
  }, [cityAverage, districtRowsMap, districts]);

  const stationPoints = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: stations
        .filter((station) => Number.isFinite(station.lon) && Number.isFinite(station.lat))
        .map((station) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [station.lon, station.lat] as [number, number],
          },
          properties: {
            occupancy: toOccupancy(station) ?? -1,
            selected: station.id === selectedStationId ? 1 : 0,
          },
        })),
    };
  }, [selectedStationId, stations]);

  const highestDistrict = districtRows[districtRows.length - 1] ?? null;
  const lowestDistrict = districtRows[0] ?? null;

  const selectedStation =
    stations.find((station) => station.id === selectedStationId) ?? null;
  const selectedStationDistrict = selectedStation
    ? stationDistrictMap.get(selectedStation.id)
    : null;
  const selectedDistrictRow = selectedStationDistrict
    ? districtRowsMap.get(selectedStationDistrict)
    : null;
  const selectedOccupancy = selectedStation ? toOccupancy(selectedStation) : null;
  const selectedVsDistrict =
    selectedOccupancy !== null && selectedDistrictRow
      ? selectedOccupancy - selectedDistrictRow.bikesScore
      : null;

  return (
    <section className="ui-section-card">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Benchmark por barrios
          </h2>
          <p className="text-xs text-[var(--muted)]">
            Ocupacion media por distrito frente al promedio de ciudad.
          </p>
        </div>
        <span className="ui-chip">{districtRows.length} barrios activos</span>
      </header>

      <div className="h-[280px] overflow-hidden rounded-2xl border border-[var(--border)]">
        {districtsWithMetrics ? (
          <MapView
            initialViewState={{
              latitude: 41.65,
              longitude: -0.88,
              zoom: 10.6,
            }}
            styleDiffing={false}
            style={{ width: '100%', height: '100%' }}
            mapStyle={MINI_MAP_STYLE}
            attributionControl={false}
            dragPan={false}
            scrollZoom={false}
            doubleClickZoom={false}
            touchZoomRotate={false}
          >
            <Source
              id="districts-source"
              type="geojson"
              data={districtsWithMetrics as unknown as GeoJSON.FeatureCollection}
            >
              <Layer {...DISTRICT_FILL_LAYER_PROPS} />
              <Layer {...DISTRICT_BORDER_LAYER_PROPS} />
            </Source>
            <Source
              id="district-stations-source"
              type="geojson"
              data={stationPoints as unknown as GeoJSON.FeatureCollection}
            >
              <Layer {...STATION_POINTS_LAYER_PROPS} />
            </Source>
          </MapView>
        ) : errorMessage ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-[var(--muted)]">
            {errorMessage}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-[var(--muted)]">
            Cargando barrios...
          </div>
        )}
      </div>

      <div className="grid gap-3 text-xs text-[var(--muted)] sm:grid-cols-2">
        <article className="ui-metric-card">
          <p className="stat-label">Media ciudad</p>
          <p className="stat-value">{formatPercent(cityAverage)}</p>
        </article>
        <article className="ui-metric-card">
          <p className="stat-label">Seleccion vs distrito</p>
          <p className="stat-value">
            {selectedVsDistrict === null
              ? 'Sin datos'
              : `${selectedVsDistrict >= 0 ? '+' : ''}${formatPercent(selectedVsDistrict)}`}
          </p>
          <p className="text-[11px] text-[var(--muted)]">
            {selectedStationDistrict ?? 'Selecciona una estacion'}
          </p>
        </article>
        <article className="ui-metric-card">
          <p className="stat-label">Mayor ocupacion</p>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {highestDistrict
              ? `${highestDistrict.name} (${formatPercent(highestDistrict.bikesScore)})`
              : 'Sin datos'}
          </p>
        </article>
        <article className="ui-metric-card">
          <p className="stat-label">Menor ocupacion</p>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {lowestDistrict
              ? `${lowestDistrict.name} (${formatPercent(lowestDistrict.bikesScore)})`
              : 'Sin datos'}
          </p>
        </article>
      </div>
    </section>
  );
}
