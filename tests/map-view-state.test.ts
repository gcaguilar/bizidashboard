import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DASHBOARD_MAP_VIEW,
  resolveDashboardMapViewState,
  serializeDashboardMapViewState,
} from '@/lib/map-view-state';

describe('map view state helpers', () => {
  it('falls back to defaults when url params are invalid', () => {
    const params = new URLSearchParams({ mapLat: 'abc', mapLng: '999', mapZoom: '1' });
    expect(resolveDashboardMapViewState(params)).toEqual(DEFAULT_DASHBOARD_MAP_VIEW);
  });

  it('serializes map state with normalized precision', () => {
    expect(
      serializeDashboardMapViewState({ latitude: 41.654321, longitude: -0.876543, zoom: 12.345 })
    ).toEqual({
      mapLat: '41.6543',
      mapLng: '-0.8765',
      mapZoom: '12.3',
    });
  });
});
