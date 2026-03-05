export const DISTRICTS_GEOJSON_URL =
  'https://raw.githubusercontent.com/bislai/bislai/master/mapas/distritos-ciudadanos-zaragoza.geojson';

export type Coordinate = number[];

export type DistrictGeometry =
  | {
      type: 'Polygon';
      coordinates: Coordinate[][];
    }
  | {
      type: 'MultiPolygon';
      coordinates: Coordinate[][][];
    };

export type DistrictFeature = {
  type: 'Feature';
  id?: string | number;
  geometry: DistrictGeometry;
  properties?: {
    distrito?: string;
    [key: string]: unknown;
  };
};

export type DistrictCollection = {
  type: 'FeatureCollection';
  features: DistrictFeature[];
};

type StationPoint = {
  id: string;
  lon: number;
  lat: number;
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

export function isDistrictCollection(value: unknown): value is DistrictCollection {
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

    const geometryType = maybeFeature.geometry?.type;
    return geometryType === 'Polygon' || geometryType === 'MultiPolygon';
  });
}

export function isPointInDistrict(point: [number, number], district: DistrictFeature): boolean {
  if (district.geometry.type === 'Polygon') {
    return isPointInPolygon(point, district.geometry.coordinates);
  }

  return district.geometry.coordinates.some((polygon: Coordinate[][]) =>
    isPointInPolygon(point, polygon)
  );
}

export function findDistrictName(
  point: [number, number],
  districts: DistrictCollection
): string | null {
  for (const district of districts.features) {
    if (!isPointInDistrict(point, district)) {
      continue;
    }

    return district.properties?.distrito ?? 'Distrito sin nombre';
  }

  return null;
}

export function buildStationDistrictMap(
  stations: StationPoint[],
  districts: DistrictCollection
): Map<string, string> {
  const stationDistrictMap = new Map<string, string>();

  for (const station of stations) {
    if (!Number.isFinite(station.lon) || !Number.isFinite(station.lat)) {
      continue;
    }

    const districtName = findDistrictName([station.lon, station.lat], districts);

    if (!districtName) {
      continue;
    }

    stationDistrictMap.set(station.id, districtName);
  }

  return stationDistrictMap;
}
