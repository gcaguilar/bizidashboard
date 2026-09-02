import { describe, expect, it } from 'vitest';
import { resolveDashboardViewMode } from '@/lib/dashboard-modes';
import { getNetworkBalanceSummary } from '@/lib/product-copy';

describe('resolveDashboardViewMode', () => {
  it('returns overview by default', () => {
    expect(resolveDashboardViewMode(null)).toBe('overview');
    expect(resolveDashboardViewMode('')).toBe('overview');
  });

  it('accepts valid modes only', () => {
    expect(resolveDashboardViewMode('operations')).toBe('operations');
    expect(resolveDashboardViewMode('research')).toBe('research');
    expect(resolveDashboardViewMode('data')).toBe('data');
    expect(resolveDashboardViewMode('invalid')).toBe('overview');
  });
});

describe('network balance status', () => {
  it('reports tension when a fresh station snapshot has an empty or full station', () => {
    const summary = getNetworkBalanceSummary([
      { id: 'empty', name: 'Vacía', lat: 41.65, lon: -0.88, capacity: 20, bikesAvailable: 0, anchorsFree: 20, recordedAt: '2026-04-01T14:35:00.000Z' },
      { id: 'full', name: 'Llena', lat: 41.66, lon: -0.87, capacity: 20, bikesAvailable: 20, anchorsFree: 0, recordedAt: '2026-04-01T14:35:00.000Z' },
    ]);

    expect(summary).toMatchObject({ state: 'tense', label: 'tensionado', criticalStationsCount: 2 });
  });
});
