/**
 * Planificador origen -> destino: lógica pura (sin red ni DOM).
 */
import { distanceMeters } from '@/lib/nearest-station';
import type { PredictionHorizonMinutes } from '@/lib/predictions';

export { distanceMeters };

export type LatLon = { lat: number; lon: number };

export type PlannerStation = LatLon & {
  id: string;
  name: string;
  capacity: number;
  bikesAvailable: number;
  anchorsFree: number;
};

export type StationSuggestion<T extends PlannerStation = PlannerStation> = {
  station: T;
  /** Distancia en línea recta desde el punto de referencia, en metros. */
  straightMeters: number;
  /** Distancia a pie estimada (línea recta x factor de rodeo), en metros. */
  walkMeters: number;
  walkMinutes: number;
};

export type TripPlan<T extends PlannerStation = PlannerStation> = {
  pickup: StationSuggestion<T> | null;
  dropoff: StationSuggestion<T> | null;
  alternativePickups: StationSuggestion<T>[];
  alternativeDropoffs: StationSuggestion<T>[];
  rideMinutes: number | null;
  /** Minutos desde ahora hasta llegar a la estación de recogida. */
  pickupArrivalMinutes: number | null;
  /** Minutos desde ahora hasta llegar a la estación de devolución. */
  dropoffArrivalMinutes: number | null;
};

/** Las calles no van en línea recta: se infla la distancia un 25 %. */
export const WALK_DETOUR_FACTOR = 1.25;
export const WALK_SPEED_METERS_PER_MINUTE = 80; // ~4,8 km/h
export const RIDE_SPEED_METERS_PER_MINUTE = 230; // ~14 km/h urbano
export const RIDE_DETOUR_FACTOR = 1.3;

export function estimateWalkMinutes(straightMeters: number): number {
  return Math.max(1, Math.round((straightMeters * WALK_DETOUR_FACTOR) / WALK_SPEED_METERS_PER_MINUTE));
}

export function estimateRideMinutes(straightMeters: number): number {
  return Math.max(1, Math.round((straightMeters * RIDE_DETOUR_FACTOR) / RIDE_SPEED_METERS_PER_MINUTE));
}

function rankStations<T extends PlannerStation>(
  stations: T[],
  point: LatLon,
  isEligible: (station: T) => boolean,
  limit: number,
): StationSuggestion<T>[] {
  return stations
    .filter(
      (station) =>
        Number.isFinite(station.lat) && Number.isFinite(station.lon) && isEligible(station),
    )
    .map((station) => {
      const straightMeters = distanceMeters(point, station);
      return {
        station,
        straightMeters,
        walkMeters: Math.round(straightMeters * WALK_DETOUR_FACTOR),
        walkMinutes: estimateWalkMinutes(straightMeters),
      };
    })
    .sort((a, b) => a.straightMeters - b.straightMeters)
    .slice(0, Math.max(0, limit));
}

/** Estaciones con al menos una bici, de más cerca a más lejos de `origin`. */
export function findPickupStations<T extends PlannerStation>(
  stations: T[],
  origin: LatLon,
  limit = 3,
): StationSuggestion<T>[] {
  return rankStations(stations, origin, (s) => s.bikesAvailable > 0, limit);
}

/** Estaciones con al menos un hueco libre, de más cerca a más lejos de `destination`. */
export function findDropoffStations<T extends PlannerStation>(
  stations: T[],
  destination: LatLon,
  limit = 3,
): StationSuggestion<T>[] {
  return rankStations(stations, destination, (s) => s.anchorsFree > 0, limit);
}

export function planTrip<T extends PlannerStation>(
  stations: T[],
  origin: LatLon,
  destination: LatLon,
): TripPlan<T> {
  const pickups = findPickupStations(stations, origin, 3);
  const dropoffs = findDropoffStations(stations, destination, 3);
  const pickup = pickups[0] ?? null;
  const dropoff = dropoffs[0] ?? null;

  const rideMinutes =
    pickup && dropoff ? estimateRideMinutes(distanceMeters(pickup.station, dropoff.station)) : null;
  const pickupArrivalMinutes = pickup ? pickup.walkMinutes : null;
  const dropoffArrivalMinutes =
    pickup && dropoff && rideMinutes !== null ? pickup.walkMinutes + rideMinutes : null;

  return {
    pickup,
    dropoff,
    alternativePickups: pickups.slice(1),
    alternativeDropoffs: dropoffs.slice(1),
    rideMinutes,
    pickupArrivalMinutes,
    dropoffArrivalMinutes,
  };
}

/**
 * Horizonte de predicción (30 o 60 min) más adecuado para una llegada a los
 * `minutes` desde ahora, o null si es demasiado pronto (vale el estado actual)
 * o queda fuera del alcance del modelo.
 */
export function pickPredictionHorizon(minutes: number | null): PredictionHorizonMinutes | null {
  if (minutes === null || !Number.isFinite(minutes)) return null;
  if (minutes < 15) return null;
  if (minutes > 90) return null;
  return minutes < 45 ? 30 : 60;
}
