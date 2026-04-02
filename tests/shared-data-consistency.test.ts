import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const SHARED_COVERAGE = {
  firstRecordedAt: '2026-03-01T00:00:00.000Z',
  lastRecordedAt: '2026-03-09T10:30:00.000Z',
  totalSamples: 1440,
  totalStations: 276,
  totalDays: 9,
  generatedAt: '2026-03-09T10:35:00.000Z',
} as const;

const SHARED_SOURCE = {
  provider: 'Bizi Zaragoza GBFS',
  gbfsDiscoveryUrl: 'https://example.com/gbfs.json',
} as const;

const {
  withCacheMock,
  getSharedDatasetSnapshotMock,
  getHistoryMetadataMock,
  getPipelineStatusSummaryMock,
  getCoverageSummaryMock,
  queryRawMock,
  stationFindManyMock,
  enforcePublicApiAccessMock,
} = vi.hoisted(() => ({
  withCacheMock: vi.fn(),
  getSharedDatasetSnapshotMock: vi.fn(),
  getHistoryMetadataMock: vi.fn(),
  getPipelineStatusSummaryMock: vi.fn(),
  getCoverageSummaryMock: vi.fn(),
  queryRawMock: vi.fn(),
  stationFindManyMock: vi.fn(),
  enforcePublicApiAccessMock: vi.fn(),
}));

vi.mock('@/lib/cache/cache', () => ({
  withCache: withCacheMock,
}));

vi.mock('@/services/shared-data', async () => {
  const actual = await vi.importActual<typeof import('@/services/shared-data')>('@/services/shared-data');

  return {
    ...actual,
    getSharedDatasetSnapshot: getSharedDatasetSnapshotMock,
    getCoverageSummary: getCoverageSummaryMock,
    getHistoryMetadata: getHistoryMetadataMock,
    getPipelineStatusSummary: getPipelineStatusSummaryMock,
  };
});

vi.mock('@/lib/db', () => ({
  prisma: {
    $queryRaw: queryRawMock,
    station: {
      findMany: stationFindManyMock,
    },
  },
  getCity: () => 'zaragoza',
}));

vi.mock('@/lib/security/public-api', () => ({
  enforcePublicApiAccess: enforcePublicApiAccessMock,
}));

import { fetchHistoryMetadata, fetchSharedDatasetSnapshot } from '@/lib/api';
import { GET as getHistoryRoute } from '@/app/api/history/route';
import { getDailyMobilityConclusions } from '@/lib/mobility-conclusions';

function normalizeReportsCoverage(payload: Awaited<ReturnType<typeof getDailyMobilityConclusions>>['payload']) {
  return {
    firstRecordedAt: payload.sourceFirstDay,
    lastRecordedAt: payload.sourceLastDay,
    totalSamples: SHARED_COVERAGE.totalSamples,
    totalStations: payload.stationsWithData,
    totalDays: payload.totalHistoricalDays,
    generatedAt: payload.generatedAt,
  };
}

describe('shared data consistency', () => {
  beforeEach(() => {
    withCacheMock.mockReset();
    getSharedDatasetSnapshotMock.mockReset();
    getHistoryMetadataMock.mockReset();
    getPipelineStatusSummaryMock.mockReset();
    getCoverageSummaryMock.mockReset();
    queryRawMock.mockReset();
    stationFindManyMock.mockReset();
    enforcePublicApiAccessMock.mockReset();

    withCacheMock.mockImplementation(async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
      return fetcher();
    });
    enforcePublicApiAccessMock.mockResolvedValue({
      ok: true,
      headers: {},
    });

    getSharedDatasetSnapshotMock.mockResolvedValue({
      source: SHARED_SOURCE,
      coverage: SHARED_COVERAGE,
      lastUpdated: {
        lastSampleAt: SHARED_COVERAGE.lastRecordedAt,
        generatedAt: SHARED_COVERAGE.generatedAt,
      },
      stats: {
        totalSamples: SHARED_COVERAGE.totalSamples,
        totalStations: SHARED_COVERAGE.totalStations,
        totalDays: SHARED_COVERAGE.totalDays,
        generatedAt: SHARED_COVERAGE.generatedAt,
      },
      pipeline: {
        pipeline: {
          lastSuccessfulPoll: SHARED_COVERAGE.lastRecordedAt,
          totalRowsCollected: 1440,
          pollsLast24Hours: 288,
          validationErrors: 0,
          consecutiveFailures: 0,
          lastDataFreshness: true,
          lastStationCount: SHARED_COVERAGE.totalStations,
          averageStationsPerPoll: SHARED_COVERAGE.totalStations,
          healthStatus: 'healthy',
          healthReason: null,
        },
        quality: {
          freshness: {
            isFresh: true,
            lastUpdated: SHARED_COVERAGE.lastRecordedAt,
            maxAgeSeconds: 600,
          },
          volume: {
            recentStationCount: SHARED_COVERAGE.totalStations,
            averageStationsPerPoll: SHARED_COVERAGE.totalStations,
            expectedRange: { min: 200, max: 500 },
          },
          lastCheck: SHARED_COVERAGE.lastRecordedAt,
        },
        system: {
          uptime: SHARED_COVERAGE.generatedAt,
          version: '0.1.0',
          environment: 'test',
        },
        timestamp: SHARED_COVERAGE.generatedAt,
      },
    });

    getHistoryMetadataMock.mockResolvedValue({
      source: SHARED_SOURCE,
      coverage: SHARED_COVERAGE,
      generatedAt: SHARED_COVERAGE.generatedAt,
    });

    getPipelineStatusSummaryMock.mockResolvedValue({
      pipeline: {
        lastSuccessfulPoll: SHARED_COVERAGE.lastRecordedAt,
        totalRowsCollected: SHARED_COVERAGE.totalSamples,
        pollsLast24Hours: 288,
        validationErrors: 0,
        consecutiveFailures: 0,
        lastDataFreshness: true,
        lastStationCount: SHARED_COVERAGE.totalStations,
        averageStationsPerPoll: SHARED_COVERAGE.totalStations,
        healthStatus: 'healthy',
        healthReason: null,
      },
      quality: {
        freshness: {
          isFresh: true,
          lastUpdated: SHARED_COVERAGE.lastRecordedAt,
          maxAgeSeconds: 600,
        },
        volume: {
          recentStationCount: SHARED_COVERAGE.totalStations,
          averageStationsPerPoll: SHARED_COVERAGE.totalStations,
          expectedRange: { min: 200, max: 500 },
        },
        lastCheck: SHARED_COVERAGE.lastRecordedAt,
      },
      system: {
        uptime: SHARED_COVERAGE.generatedAt,
        version: '0.1.0',
        environment: 'test',
      },
      timestamp: SHARED_COVERAGE.generatedAt,
    });

    getCoverageSummaryMock.mockResolvedValue(SHARED_COVERAGE);

    stationFindManyMock.mockResolvedValue([
      { id: '1', lat: 41.65, lon: -0.88 },
      { id: '2', lat: 41.66, lon: -0.87 },
    ]);

    queryRawMock
      .mockResolvedValueOnce([{ value: 320 }])
      .mockResolvedValueOnce([{ value: 300 }])
      .mockResolvedValueOnce([{ value: 0.54 }])
      .mockResolvedValueOnce([{ value: 0.52 }])
      .mockResolvedValueOnce([
        { stationId: '1', stationName: 'Plaza Espana', avgDemand: 12 },
        { stationId: '2', stationName: 'Paraninfo', avgDemand: 10 },
      ])
      .mockResolvedValueOnce([
        { stationId: '2', stationName: 'Paraninfo', avgDemand: 2 },
        { stationId: '1', stationName: 'Plaza Espana', avgDemand: 3 },
      ])
      .mockResolvedValueOnce([
        { dayType: 'weekday', avgDemand: 15, avgOccupancy: 0.55, daysCount: 5 },
        { dayType: 'weekend', avgDemand: 9, avgOccupancy: 0.48, daysCount: 2 },
      ])
      .mockResolvedValueOnce([
        { hour: 8, demandScore: 120 },
        { hour: 14, demandScore: 110 },
      ])
      .mockResolvedValueOnce([
        { stationId: '1', demandScore: 240 },
        { stationId: '2', demandScore: 180 },
      ])
      .mockResolvedValueOnce([
        {
          day: '2026-03-09',
          demandScore: 321,
          avgOccupancy: 0.54,
          balanceIndex: 0.81,
          sampleCount: 144,
        },
      ]);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
      })
    );
  });

  it('keeps dashboard and help coverage in sync', async () => {
    const dashboard = await fetchSharedDatasetSnapshot();
    const help = await fetchHistoryMetadata();

    expect(dashboard.coverage).toEqual(help.coverage);
    expect(dashboard.coverage.generatedAt).toBe(help.generatedAt);
  });

  it('keeps reports, api history, and the shared coverage contract aligned', async () => {
    const dashboard = await fetchSharedDatasetSnapshot();
    const report = await getDailyMobilityConclusions('2026-03');
    const historyResponse = await getHistoryRoute(new Request('http://localhost/api/history') as never);
    const historyPayload = await historyResponse.json();

    expect(normalizeReportsCoverage(report.payload)).toEqual(SHARED_COVERAGE);
    expect(historyPayload.coverage).toEqual(SHARED_COVERAGE);
    expect(normalizeReportsCoverage(report.payload)).toEqual(historyPayload.coverage);
    expect(normalizeReportsCoverage(report.payload)).toEqual(dashboard.coverage);
  });

  it('keeps date boundaries monotonic across dashboard, reports, and history metadata', async () => {
    const dashboard = await fetchSharedDatasetSnapshot();
    const help = await fetchHistoryMetadata();
    const report = await getDailyMobilityConclusions('2026-03');

    const firstRecordedAt = Date.parse(dashboard.coverage.firstRecordedAt ?? '');
    const lastRecordedAt = Date.parse(dashboard.coverage.lastRecordedAt ?? '');
    const generatedAt = Date.parse(dashboard.coverage.generatedAt ?? '');
    const reportLastDay = Date.parse(report.payload.sourceLastDay ?? '');

    expect(Number.isNaN(firstRecordedAt)).toBe(false);
    expect(Number.isNaN(lastRecordedAt)).toBe(false);
    expect(Number.isNaN(generatedAt)).toBe(false);
    expect(Number.isNaN(reportLastDay)).toBe(false);

    expect(firstRecordedAt).toBeLessThanOrEqual(lastRecordedAt);
    expect(lastRecordedAt).toBe(reportLastDay);
    expect(generatedAt).toBeGreaterThanOrEqual(lastRecordedAt);
    expect(help.generatedAt).toBe(dashboard.coverage.generatedAt);
    expect(help.coverage.firstRecordedAt).toBe(dashboard.coverage.firstRecordedAt);
    expect(help.coverage.lastRecordedAt).toBe(dashboard.coverage.lastRecordedAt);
  });
});
