import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { withStaleCacheMock } = vi.hoisted(() => ({
  withStaleCacheMock: vi.fn(),
}));

vi.mock('@/lib/cache/cache', () => ({
  withStaleCache: withStaleCacheMock,
  withCache: (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher(),
}));

import { buildRebalancingReport, compactRebalancingReport } from '@/lib/rebalancing-report';

describe('buildRebalancingReport', () => {
  beforeEach(() => {
    withStaleCacheMock.mockReset();
  });

  it('reuses a district-agnostic base cache key and filters the cached report afterwards', async () => {
    withStaleCacheMock.mockResolvedValue({
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

    expect(withStaleCacheMock).toHaveBeenCalledWith(
      'rebalancing-report:days=15:base',
      { softTtlSeconds: 300, hardTtlSeconds: 21_600 },
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

describe('compactRebalancingReport', () => {
  it('drops per-station neighbour lists and time bands but keeps the 500 m neighbour count', () => {
    const neighbor = (stationId: string, distanceMeters: number) => ({
      stationId,
      distanceMeters,
      walkingTimeMinutes: 0,
      currentOccupancy: 0,
      historicalRobustness: 0,
    });
    const report = {
      diagnostics: [
        {
          stationId: 'a',
          timeBandMetrics: [{ timeBand: 'night' }],
          network: {
            nearbyStations: [neighbor('b', 120), neighbor('c', 500), neighbor('d', 2400)],
            urgencyAdjustment: 0.5,
          },
        },
      ],
      transfers: [],
    } as unknown as Parameters<typeof compactRebalancingReport>[0];

    const [diagnostic] = compactRebalancingReport(report).diagnostics;

    expect(diagnostic.timeBandMetrics).toEqual([]);
    expect(diagnostic.network.nearbyStations).toEqual([]);
    expect(diagnostic.network.nearbyStationCount).toBe(2);
    expect(diagnostic.network.urgencyAdjustment).toBe(0.5);
  });
});
