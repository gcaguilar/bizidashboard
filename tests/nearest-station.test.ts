import { describe, expect, it } from 'vitest';
import { distanceMeters, findNearestStation } from '@/lib/nearest-station';

const origin = { lat: 41.65, lon: -0.88 };
const stations = [
  { id: 'near-empty', lat: 41.651, lon: -0.88, bikesAvailable: 0, anchorsFree: 5 },
  { id: 'mid-full', lat: 41.655, lon: -0.88, bikesAvailable: 4, anchorsFree: 0 },
  { id: 'far', lat: 41.7, lon: -0.88, bikesAvailable: 3, anchorsFree: 3 },
];

describe('findNearestStation', () => {
  it('picks the nearest station with bikes', () => {
    expect(findNearestStation(stations, origin, 'bikes')?.id).toBe('mid-full');
  });

  it('picks the nearest station with free anchors', () => {
    expect(findNearestStation(stations, origin, 'anchors')?.id).toBe('near-empty');
  });

  it('returns null when no station meets the criterion', () => {
    expect(findNearestStation([stations[0]], origin, 'bikes')).toBeNull();
    expect(findNearestStation([stations[1]], origin, 'anchors')).toBeNull();
    expect(findNearestStation([], origin, 'bikes')).toBeNull();
  });

  it('computes haversine distance', () => {
    expect(distanceMeters(origin, origin)).toBe(0);
    const d = distanceMeters(origin, { lat: 41.66, lon: -0.88 });
    expect(d).toBeGreaterThan(1100);
    expect(d).toBeLessThan(1120);
  });
});
