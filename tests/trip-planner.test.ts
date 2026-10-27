import { describe, expect, it } from 'vitest';
import {
  distanceMeters,
  estimateWalkMinutes,
  findDropoffStations,
  findPickupStations,
  pickPredictionHorizon,
  planTrip,
  type PlannerStation,
} from '@/lib/trip-planner';

function station(id: string, lat: number, lon: number, bikes: number, anchors: number): PlannerStation {
  return { id, name: `S${id}`, lat, lon, capacity: bikes + anchors, bikesAvailable: bikes, anchorsFree: anchors };
}

const origin = { lat: 41.65, lon: -0.88 };
const destination = { lat: 41.66, lon: -0.9 };

describe('trip planner', () => {
  it('computes haversine distance', () => {
    expect(distanceMeters(origin, origin)).toBe(0);
    const d = distanceMeters(origin, { lat: 41.66, lon: -0.88 });
    expect(d).toBeGreaterThan(1100);
    expect(d).toBeLessThan(1125);
  });

  it('skips empty stations when picking up', () => {
    const stations = [station('near-empty', 41.6501, -0.88, 0, 10), station('far-bikes', 41.655, -0.88, 4, 6)];
    expect(findPickupStations(stations, origin).map((r) => r.station.id)).toEqual(['far-bikes']);
  });

  it('skips full stations when dropping off', () => {
    const stations = [station('near-full', 41.6601, -0.9, 10, 0), station('far-free', 41.665, -0.9, 3, 7)];
    expect(findDropoffStations(stations, destination).map((r) => r.station.id)).toEqual(['far-free']);
  });

  it('plans pickup, dropoff and alternatives', () => {
    const stations = [
      station('a', 41.6502, -0.88, 5, 5),
      station('b', 41.651, -0.88, 2, 8),
      station('c', 41.6602, -0.9, 5, 5),
      station('d', 41.67, -0.9, 5, 5),
    ];
    const plan = planTrip(stations, origin, destination);
    expect(plan.pickup?.station.id).toBe('a');
    expect(plan.dropoff?.station.id).toBe('c');
    expect(plan.alternativePickups[0]?.station.id).toBe('b');
    expect(plan.rideMinutes).toBeGreaterThan(0);
    expect(plan.dropoffArrivalMinutes).toBe((plan.pickupArrivalMinutes ?? 0) + (plan.rideMinutes ?? 0));
  });

  it('returns nulls when no station qualifies', () => {
    const plan = planTrip([station('x', 41.65, -0.88, 0, 0)], origin, destination);
    expect(plan.pickup).toBeNull();
    expect(plan.dropoff).toBeNull();
    expect(plan.rideMinutes).toBeNull();
    expect(plan.dropoffArrivalMinutes).toBeNull();
  });

  it('estimates at least one minute of walking', () => {
    expect(estimateWalkMinutes(0)).toBe(1);
    expect(estimateWalkMinutes(800)).toBe(13);
  });

  it('picks a prediction horizon only when useful', () => {
    expect(pickPredictionHorizon(null)).toBeNull();
    expect(pickPredictionHorizon(5)).toBeNull();
    expect(pickPredictionHorizon(20)).toBe(30);
    expect(pickPredictionHorizon(50)).toBe(60);
    expect(pickPredictionHorizon(120)).toBeNull();
  });
});
