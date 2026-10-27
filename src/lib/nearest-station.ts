export type NearestCriterion = 'bikes' | 'anchors';

export type NearestCandidateStation = {
  id: string;
  lat: number;
  lon: number;
  bikesAvailable: number;
  anchorsFree: number;
};

export type GeoPoint = { lat: number; lon: number };

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Estación más cercana a `origin` que cumple el criterio: `bikes` (al menos una bici)
 * o `anchors` (al menos un hueco libre). Devuelve null si ninguna lo cumple.
 */
export function findNearestStation<T extends NearestCandidateStation>(
  stations: T[],
  origin: GeoPoint,
  criterion: NearestCriterion,
): T | null {
  let best: T | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const station of stations) {
    const available = criterion === 'bikes' ? station.bikesAvailable : station.anchorsFree;
    if (!(available > 0)) continue;
    const distance = distanceMeters(origin, station);
    if (distance < bestDistance) {
      best = station;
      bestDistance = distance;
    }
  }

  return best;
}
