import { describe, expect, it } from 'vitest';
import { roundDashboardMapViewState } from '@/lib/map-view-state';

describe('map view state helpers', () => {
  it('rounds map state with normalized precision', () => {
    expect(
      roundDashboardMapViewState({ latitude: 41.654321, longitude: -0.876543, zoom: 12.345 })
    ).toEqual({
      latitude: 41.6543,
      longitude: -0.8765,
      zoom: 12.3,
    });
  });

  it('leaves already rounded values untouched', () => {
    expect(roundDashboardMapViewState({ latitude: 41.65, longitude: -0.88, zoom: 12 })).toEqual({
      latitude: 41.65,
      longitude: -0.88,
      zoom: 12,
    });
  });
});
