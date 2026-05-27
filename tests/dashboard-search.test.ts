import { describe, expect, it } from 'vitest';
import { dashboardSearchSchema } from '@/lib/dashboard-search';

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
});
