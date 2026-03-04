'use client';

import { useEffect, useMemo, useState } from 'react';
import { Layer, Map, Source } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { StationSnapshot } from '@/lib/api';
import { formatPercent } from '@/lib/format';

const DISTRICTS_GEOJSON_URL =
  'https://raw.githubusercontent.com/bislai/bislai/master/mapas/distritos-ciudadanos-zaragoza.geojson';

const DISTRICT_FILL_LAYER = {
  id: 'district-fill-layer',
  type: 'fill' as const,
  paint: {
    'fill-color': [
      'case',
      ['==', ['get', 'stationCount'], 0],
      '#e9e3d8',
      ['<', ['get', 'relativeScore'], -0.09],
      '#a6412b',
      ['<', ['get', 'relativeScore'], -0.03],
      '#d97706',
      ['<', ['get', 'relativeScore'], 0.03],
      '#d4c3a3',
      ['<', ['get', 'relativeScore'], 0.09],
      '#4d9f72',
      '#1f7a8c',
    ],
    'fill-opacity': 0.76,
  },
};

const DISTRICT_BORDER_LAYER = {
  id: 'district-border-layer',
  type: 'line' as const,
  paint: {
    'line-color': '#6b6f76',
    'line-width': 1,
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
      '#6b7280',
      ['<', ['get', 'occupancy'], 0.25],
      '#b91c1c',
      ['<', ['get', 'occupancy'], 0.5],
      '#d97706',
      ['<', ['get', 'occupancy'], 0.75],
      '#65a30d',
      '#0f766e',
    ],
    'circle-radius': ['case', ['==', ['get', 'selected'], 1], 4.2, 2.8],
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': ['case', ['==', ['get', 'selected'], 1], 1.3, 0.8],
    'circle-opacity': 0.95,
  },
};

const DISTRICT_FILL_LAYER_PROPS =
  DISTRICT_FILL_LAYER as unknown as Parameters<typeof Layer>[0];
const DISTRICT_BORDER_LAYER_PROPS =
  DISTRICT_BORDER_LAYER as unknown as Parameters<typeof Layer>[0];
const STATION_POINTS_LAYER_PROPS =
  STATION_POINTS_LAYER as unknown as Parameters<typeof Layer>[0];

type Coordinate = number[];

type DistrictGeometry =
  | {
      type: 'Polygon';
      coordinates: Coordinate[][];
    }
  | {
      type: 'MultiPolygon';
      coordinates: Coordinate[][][];
    };

type DistrictProperties = {
  distrito?: string;
  bikesScore?: number | null;
  relativeScore?: number | null;
  stationCount?: number;
  [key: string]: unknown;
};

type DistrictFeature = {
  type: 'Feature';
  id?: string | number;
  geometry: DistrictGeometry;
  properties?: DistrictProperties;
};

type DistrictCollection = {
  type: 'FeatureCollection';
  features: DistrictFeature[];
};

type StationPointFeature = {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    occupancy: number;
    selected: 0 | 1;
  };
};

type StationPointCollection = {
  type: 'FeatureCollection';
  features: StationPointFeature[];
};

type DistrictStatsResult = {
  districts: DistrictCollection;
  cityAverage: number;
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

function toLngLatPair(coordinate: Coordinate | undefined): [number, number] | null {
  if (!coordinate || coordinate.length < 2) {
    return null;
  }

  const lng = coordinate[0];
  const lat = coordinate[1];

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return null;
  }

  return [lng, lat];
}

function toOccupancy(station: StationSnapshot): number | null {
  if (!Number.isFinite(station.capacity) || station.capacity <= 0) {
    return null;
  }

  if (!Number.isFinite(station.bikesAvailable)) {
    return null;
  }

  return station.bikesAvailable / station.capacity;
}

function isDistrictCollection(value: unknown): value is DistrictCollection {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeCollection = value as {
    type?: unknown;
    features?: unknown;
  };

  if (maybeCollection.type !== 'FeatureCollection') {
    return false;
  }

  if (!Array.isArray(maybeCollection.features)) {
    return false;
  }

  return maybeCollection.features.every((feature: unknown) => {
    if (!feature || typeof feature !== 'object') {
      return false;
    }

    const maybeFeature = feature as {
      type?: unknown;
      geometry?: { type?: unknown };
    };

    if (maybeFeature.type !== 'Feature') {
      return false;
    }

    if (!maybeFeature.geometry || typeof maybeFeature.geometry !== 'object') {
      return false;
    }

    const geometryType = maybeFeature.geometry?.type;
    return geometryType === 'Polygon' || geometryType === 'MultiPolygon';
  });
}

function isPointInRing(point: [number, number], ring: Coordinate[]): boolean {
  if (ring.length < 3) {
    return false;
  }

  const [lng, lat] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const current = toLngLatPair(ring[i]);
    const previous = toLngLatPair(ring[j]);

    if (!current || !previous) {
      continue;
    }

    const [xi, yi] = current;
    const [xj, yj] = previous;

    const intersects =
      (yi > lat) !== (yj > lat) &&
      lng < ((xj - xi) * (lat - yi)) / ((yj - yi) || Number.EPSILON) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function isPointInPolygon(point: [number, number], polygon: Coordinate[][]): boolean {
  if (polygon.length === 0) {
    return false;
  }

  if (!isPointInRing(point, polygon[0] ?? [])) {
    return false;
  }

  for (let i = 1; i < polygon.length; i += 1) {
    if (isPointInRing(point, polygon[i] ?? [])) {
      return false;
    }
  }

  return true;
}

function isPointInDistrict(point: [number, number], district: DistrictFeature): boolean {
  const geometry = district.geometry;

  if (geometry.type === 'Polygon') {
    return isPointInPolygon(point, geometry.coordinates);
  }

  return geometry.coordinates.some((polygon: Coordinate[][]) =>
    isPointInPolygon(point, polygon)
  );
}

function buildDistrictStats(
  districts: DistrictCollection,
  stations: StationSnapshot[]
): DistrictStatsResult {
  const stationEntries = stations
    .filter(
      (station) => Number.isFinite(station.lon) && Number.isFinite(station.lat)
    )
    .map((station) => ({
      station,
      point: [station.lon, station.lat] as [number, number],
      occupancy: toOccupancy(station),
    }));

  const cityOccupancies = stationEntries
    .map((entry) => entry.occupancy)
    .filter((value): value is number => value !== null);

  const cityAverage =
    cityOccupancies.length > 0
      ? cityOccupancies.reduce((sum, value) => sum + value, 0) /
        cityOccupancies.length
      : 0;

  const features = districts.features.map((district: DistrictFeature) => {
    let stationCount = 0;
    const districtOccupancies: number[] = [];

    for (const entry of stationEntries) {
      if (!isPointInDistrict(entry.point, district)) {
        continue;
      }

      stationCount += 1;

      if (entry.occupancy !== null) {
        districtOccupancies.push(entry.occupancy);
      }
    }

    const bikesScore =
      districtOccupancies.length > 0
        ? districtOccupancies.reduce((sum, value) => sum + value, 0) /
          districtOccupancies.length
        : null;

    const relativeScore =
      bikesScore === null ? null : Number((bikesScore - cityAverage).toFixed(4));

    return {
      ...district,
      properties: {
        ...(district.properties ?? {}),
        bikesScore,
        relativeScore,
        stationCount,
      },
    };
  });

  return {
    districts: {
      ...districts,
      features,
    },
    cityAverage,
  };
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
        const response = await fetch(DISTRICTS_GEOJSON_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as unknown;

        if (!isDistrictCollection(payload)) {
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

  const districtStats = useMemo<DistrictStatsResult | null>(() => {
    if (!districts) {
      return null;
    }

    return buildDistrictStats(districts, stations);
  }, [districts, stations]);

  const districtRows = useMemo<DistrictRow[]>(() => {
    if (!districtStats) {
      return [];
    }

    return districtStats.districts.features
      .map((district: DistrictFeature) => {
        const score = district.properties?.bikesScore;
        const stationCount = district.properties?.stationCount;
        const districtName = district.properties?.distrito;

        if (
          typeof score !== 'number' ||
          !Number.isFinite(score) ||
          typeof stationCount !== 'number' ||
          stationCount <= 0
        ) {
          return null;
        }

        return {
          name:
            typeof districtName === 'string' ? districtName : 'Distrito sin nombre',
          bikesScore: score,
          stationCount,
        };
      })
      .filter((row: DistrictRow | null): row is DistrictRow => row !== null)
      .sort((a: DistrictRow, b: DistrictRow) => a.bikesScore - b.bikesScore);
  }, [districtStats]);

  const highestDistrict = districtRows[districtRows.length - 1] ?? null;
  const lowestDistrict = districtRows[0] ?? null;

  const stationPoints = useMemo<StationPointCollection>(
    () => ({
      type: 'FeatureCollection',
      features: stations
        .filter(
          (station) => Number.isFinite(station.lon) && Number.isFinite(station.lat)
        )
        .map((station) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [station.lon, station.lat],
          },
          properties: {
            occupancy: toOccupancy(station) ?? -1,
            selected: station.id === selectedStationId ? 1 : 0,
          },
        })),
    }),
    [selectedStationId, stations]
  );

  return (
    <section className="flex h-full flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <header>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Mapa rapido de barrios
        </h2>
        <p className="text-xs text-[var(--muted)]">
          Colores segun disponibilidad media de bicis frente al promedio de ciudad.
        </p>
      </header>

      <div className="h-[280px] overflow-hidden rounded-2xl border border-[var(--border)]">
        {districtStats ? (
          <Map
            initialViewState={{
              latitude: 41.65,
              longitude: -0.88,
              zoom: 10.6,
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
            attributionControl={false}
            dragPan={false}
            scrollZoom={false}
            doubleClickZoom={false}
            touchZoomRotate={false}
          >
            <Source
              id="districts-source"
              type="geojson"
              data={districtStats.districts as unknown as GeoJSON.FeatureCollection}
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
          </Map>
        ) : errorMessage ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-[var(--muted)]">
            {errorMessage}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-[var(--muted)]">
            Cargando mapa de barrios...
          </div>
        )}
      </div>

      <div className="grid gap-3 text-xs text-[var(--muted)] sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[#f9f6f1] px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.16em]">Media ciudad</p>
          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
            {formatPercent(districtStats?.cityAverage ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[#f9f6f1] px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.16em]">Barrios con estaciones</p>
          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
            {districtRows.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[#f9f6f1] px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.16em]">Mas bicis</p>
          <p className="mt-1 font-semibold text-[var(--foreground)]">
            {highestDistrict
              ? `${highestDistrict.name} (${formatPercent(highestDistrict.bikesScore)})`
              : 'Sin datos'}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[#f9f6f1] px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.16em]">Menos bicis</p>
          <p className="mt-1 font-semibold text-[var(--foreground)]">
            {lowestDistrict
              ? `${lowestDistrict.name} (${formatPercent(lowestDistrict.bikesScore)})`
              : 'Sin datos'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--muted)]">
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-[#a6412b]" />
          Menos bicis
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-[#d4c3a3]" />
          Cerca de la media
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-[#1f7a8c]" />
          Mas bicis
        </span>
      </div>
    </section>
  );
}
