import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { withCacheMock } = vi.hoisted(() => ({
  withCacheMock: vi.fn(),
}));

vi.mock('@/lib/cache/cache', () => ({
  withCache: withCacheMock,
}));

import { buildRebalancingReport } from '@/lib/rebalancing-report';

describe('buildRebalancingReport', () => {
  beforeEach(() => {
    withCacheMock.mockReset();
  });

  it('reuses a district-agnostic base cache key and filters the cached report afterwards', async () => {
    withCacheMock.mockResolvedValue({
      generatedAt: '2026-04-01T10:00:00.000Z',
      modelVersion: 'rebalancing-v1-historical-baseline',
      analysisWindowDays: 15,
      districtFilter: null,
      summary: {
        totalStations: 2,
        byClassification: {
          overstock: 1,
          deficit: 1,
          peak_saturation: 0,
          peak_emptying: 0,
          balanced: 0,
          data_review: 0,
        },
        byAction: {
          donor: 1,
          receptor: 1,
          peak_remove: 0,
          peak_fill: 0,
          stable: 0,
          review: 0,
        },
        criticalUrgencyCount: 1,
        highUrgencyCount: 1,
        stationsWithTransfer: 1,
      },
      diagnostics: [
        {
          stationId: 'a',
          stationName: 'Centro 1',
          districtName: 'Centro',
          classification: 'deficit',
          actionGroup: 'receptor',
          urgency: 'critical',
        },
        {
          stationId: 'b',
          stationName: 'Delicias 1',
          districtName: 'Delicias',
          classification: 'overstock',
          actionGroup: 'donor',
          urgency: 'high',
        },
      ],
      transfers: [
        {
          originStationId: 'b',
          destinationStationId: 'a',
        },
      ],
      kpis: {
        service: {
          systemPctTimeEmpty: 0.12,
          systemPctTimeFull: 0.08,
        },
      },
      baselineComparison: {
        transferCountDelta: 0,
      },
    });

    const report = await buildRebalancingReport({ days: 15, district: 'Centro' });

    expect(withCacheMock).toHaveBeenCalledWith(
      'rebalancing-report:days=15:base',
      300,
      expect.any(Function)
    );
    expect(report.districtFilter).toBe('Centro');
    expect(report.diagnostics).toHaveLength(1);
    expect(report.diagnostics[0]?.stationId).toBe('a');
    expect(report.transfers).toHaveLength(1);
    expect(report.summary.totalStations).toBe(1);
    expect(report.summary.stationsWithTransfer).toBe(1);
    expect(report.summary.byClassification.deficit).toBe(1);
    expect(report.summary.byClassification.overstock).toBe(0);
  });
});
