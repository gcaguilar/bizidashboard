import { describe, expect, it } from 'vitest';
import {
  buildDashboardClientSearch,
  dashboardSearchSchema,
  resolveDashboardMapViewFromSearch,
} from '@/lib/dashboard-search';
import { normalizeStationIdValue } from '@/lib/dashboard-url-state';

const BASE_STATE = {
  activeWindowId: '30d',
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
} as const;

describe('dashboard search schema', () => {
  it('accepts valid dashboard URL params', () => {
    const parsed = dashboardSearchSchema.parse({
      mode: 'data',
      stationId: '101',
      q: 'plaza españa',
      timeWindow: '30d',
      onlyWithBikes: '1',
      onlyWithAnchors: 'true',
      mapLat: '41.6512',
      mapLng: '-0.8812',
      mapZoom: '12.3',
      month: '2026-05',
      period: 'night',
      rankingTab: 'turnover',
      rankingSearch: 'delicias',
      rankingShowAll: '1',
      density: 'quick',
    });

    expect(parsed.mode).toBe('data');
    expect(parsed.timeWindow).toBe('30d');
    expect(parsed.mapLat).toBe(41.6512);
    expect(parsed.mapLng).toBe(-0.8812);
    expect(parsed.mapZoom).toBe(12.3);
    expect(parsed.rankingTab).toBe('turnover');
    expect(parsed.density).toBe('quick');
  });

  it('rejects invalid numeric and enum params', () => {
    const result = dashboardSearchSchema.safeParse({
      timeWindow: '90d',
      mapLat: '999',
      rankingTab: 'invalid',
      density: 'compact',
    });

    expect(result.success).toBe(false);
  });

  it('accepts numeric stationId values from router JSON parsing', () => {
    const schemaParsed = dashboardSearchSchema.shape.stationId.safeParse(2);

    expect(schemaParsed.success).toBe(true);
    if (schemaParsed.success) {
      expect(schemaParsed.data).toBe('2');
    }
  });

  it('strips repeated wrapping quotes from station ids', () => {
    expect(normalizeStationIdValue('""2""')).toBe('2');
    expect(normalizeStationIdValue('"2"')).toBe('2');
    expect(normalizeStationIdValue(null)).toBeNull();
  });
});

describe('resolveDashboardMapViewFromSearch', () => {
  it('falls back to the default view when the params are absent', () => {
    expect(resolveDashboardMapViewFromSearch({})).toEqual({
      latitude: 41.65,
      longitude: -0.88,
      zoom: 12,
    });
  });

  it('uses the validated params when present', () => {
    expect(
      resolveDashboardMapViewFromSearch({ mapLat: 41.7, mapLng: -0.9, mapZoom: 14 })
    ).toEqual({
      latitude: 41.7,
      longitude: -0.9,
      zoom: 14,
    });
  });
});

describe('buildDashboardClientSearch', () => {
  it('serializes dashboard state into the route search', () => {
    const next = buildDashboardClientSearch(
      { month: '2026-05', rankingTab: 'turnover' },
      {
        ...BASE_STATE,
        activeWindowId: '7d',
        viewMode: 'operations',
        selectedStationId: '123',
        searchQuery: ' centro ',
        onlyWithBikes: true,
        mapViewState: { latitude: 41.65123, longitude: -0.88123, zoom: 12.34 },
      }
    );

    expect(next.month).toBe('2026-05');
    expect(next.rankingTab).toBe('turnover');
    expect(next.timeWindow).toBe('7d');
    expect(next.mode).toBe('operations');
    expect(next.stationId).toBe('123');
    expect(next.q).toBe('centro');
    expect(next.onlyWithBikes).toBe('1');
    expect(next.onlyWithAnchors).toBeUndefined();
    expect(next.mapLat).toBe(41.6512);
    expect(next.mapLng).toBe(-0.8812);
    expect(next.mapZoom).toBe(12.3);
  });

  it('drops empty optional params', () => {
    const next = buildDashboardClientSearch(
      { stationId: '1', q: 'test', onlyWithBikes: '1' },
      BASE_STATE
    );

    expect(next.stationId).toBeUndefined();
    expect(next.q).toBeUndefined();
    expect(next.onlyWithBikes).toBeUndefined();
  });

  it('normalizes quoted station ids before writing them to the URL', () => {
    const next = buildDashboardClientSearch({}, { ...BASE_STATE, selectedStationId: '"2"' });

    expect(next.stationId).toBe('2');
  });

  it('preserves params owned by other dashboard widgets', () => {
    const next = buildDashboardClientSearch(
      { density: 'quick', month: '2026-05', period: 'night', rankingShowAll: '1' },
      BASE_STATE
    );

    expect(next.density).toBe('quick');
    expect(next.month).toBe('2026-05');
    expect(next.period).toBe('night');
    expect(next.rankingShowAll).toBe('1');
  });
});
