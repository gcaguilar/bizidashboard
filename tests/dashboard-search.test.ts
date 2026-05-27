import { describe, expect, it } from 'vitest';
import {
  dashboardSearchSchema,
  parseDashboardClientSearch,
  parseDashboardMonthPeriodSearch,
  parseDashboardRankingSearch,
} from '@/lib/dashboard-search';

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
    });

    expect(parsed.mode).toBe('data');
    expect(parsed.timeWindow).toBe('30d');
    expect(parsed.mapLat).toBe(41.6512);
    expect(parsed.mapLng).toBe(-0.8812);
    expect(parsed.mapZoom).toBe(12.3);
    expect(parsed.rankingTab).toBe('turnover');
  });

  it('rejects invalid numeric and enum params', () => {
    const result = dashboardSearchSchema.safeParse({
      timeWindow: '90d',
      mapLat: '999',
      rankingTab: 'invalid',
    });

    expect(result.success).toBe(false);
  });

  it('normalizes client search state with safe defaults', () => {
    const parsed = parseDashboardClientSearch(
      new URLSearchParams('mode=operations&timeWindow=7d&onlyWithBikes=true&q=  plaza  ')
    );

    expect(parsed).toEqual({
      mode: 'operations',
      stationId: null,
      q: 'plaza',
      timeWindow: '7d',
      onlyWithBikes: true,
      onlyWithAnchors: false,
      mapViewState: {
        latitude: 41.65,
        longitude: -0.88,
        zoom: 12,
      },
    });
  });

  it('keeps independent client params when map values are invalid', () => {
    const parsed = parseDashboardClientSearch(
      new URLSearchParams('mode=operations&timeWindow=7d&mapLat=999&mapLng=abc&mapZoom=-1')
    );

    expect(parsed.mode).toBe('operations');
    expect(parsed.timeWindow).toBe('7d');
    expect(parsed.mapViewState).toEqual({
      latitude: 41.65,
      longitude: -0.88,
      zoom: 12,
    });
  });

  it('normalizes ranking search state with safe defaults', () => {
    const parsed = parseDashboardRankingSearch(
      new URLSearchParams('rankingTab=turnover&rankingSearch= 101 &rankingShowAll=1')
    );

    expect(parsed).toEqual({
      tab: 'turnover',
      search: '101',
      showAll: true,
    });
  });

  it('normalizes month and period search state', () => {
    const parsed = parseDashboardMonthPeriodSearch(
      new URLSearchParams('month=2026-05&period=night')
    );

    expect(parsed).toEqual({
      month: '2026-05',
      period: 'night',
    });
  });

  it('falls back for invalid month and period values', () => {
    const parsed = parseDashboardMonthPeriodSearch(
      new URLSearchParams('month=bad&period=invalid')
    );

    expect(parsed).toEqual({
      month: null,
      period: 'all',
    });
  });
});
