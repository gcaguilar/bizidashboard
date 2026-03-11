import { describe, expect, it } from 'vitest';
import type { StationSnapshot } from '@/lib/api';
import { buildStationFeatureCollection } from '@/lib/map-features';

function buildStation(index: number): StationSnapshot {
  return {
    id: String(index),
    name: `Station ${index}`,
    lat: 41.65 + index * 0.0001,
    lon: -0.88 - index * 0.0001,
    capacity: 20,
    bikesAvailable: index % 20,
    anchorsFree: 20 - (index % 20),
    recordedAt: new Date().toISOString(),
  };
}

describe('buildStationFeatureCollection', () => {
  it('builds feature collections for large station sets quickly enough', () => {
    const stations = Array.from({ length: 140 }, (_, index) => buildStation(index));
    const start = performance.now();

    const collection = buildStationFeatureCollection({
      stations,
      getMarkerColor: () => '#ea0615',
      favoriteStationIds: new Set(['1', '2']),
      selectedStationId: '5',
      frictionByStationId: { '5': 12 },
    });

    const elapsed = performance.now() - start;

    expect(collection.features).toHaveLength(140);
    expect(collection.features[5]?.properties.isSelected).toBe(1);
    expect(collection.features[1]?.properties.isFavorite).toBe(1);
    expect(collection.features[5]?.properties.frictionScore).toBe(12);
    expect(elapsed).toBeLessThan(100);
  });
});
