import { describe, expect, it } from 'vitest';
import { buildDashboardUrlSearchParams } from '@/lib/dashboard-url-state';

describe('buildDashboardUrlSearchParams', () => {
  it('serializes dashboard state to URL params', () => {
    const params = buildDashboardUrlSearchParams(new URLSearchParams('foo=bar'), {
      activeWindowId: '7d',
      viewMode: 'operations',
      selectedStationId: '123',
      searchQuery: ' centro ',
      onlyWithBikes: true,
      onlyWithAnchors: false,
      mapViewState: {
        latitude: 41.65123,
        longitude: -0.88123,
        zoom: 12.34,
      },
    });

    expect(params.get('foo')).toBe('bar');
    expect(params.get('timeWindow')).toBe('7d');
    expect(params.get('mode')).toBe('operations');
    expect(params.get('stationId')).toBe('123');
    expect(params.get('q')).toBe('centro');
    expect(params.get('onlyWithBikes')).toBe('1');
    expect(params.get('onlyWithAnchors')).toBeNull();
    expect(params.get('mapLat')).toBe('41.6512');
    expect(params.get('mapLng')).toBe('-0.8812');
    expect(params.get('mapZoom')).toBe('12.3');
  });

  it('removes empty optional params', () => {
    const params = buildDashboardUrlSearchParams(new URLSearchParams('stationId=1&q=test&onlyWithBikes=1'), {
      activeWindowId: '24h',
      viewMode: 'overview',
      selectedStationId: '',
      searchQuery: '',
      onlyWithBikes: false,
      onlyWithAnchors: false,
      mapViewState: {
        latitude: 41.65,
        longitude: -0.88,
        zoom: 12,
      },
    });

    expect(params.get('stationId')).toBeNull();
    expect(params.get('q')).toBeNull();
    expect(params.get('onlyWithBikes')).toBeNull();
  });
});
