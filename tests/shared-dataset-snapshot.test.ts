import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const {
  cacheMock,
  captureWarningWithContextMock,
  getCoverageSummaryMock,
  getHistoryMetadataMock,
  getPipelineStatusSummaryMock,
  getSharedDataSourceMock,
} = vi.hoisted(() => ({
  cacheMock: vi.fn(),
  captureWarningWithContextMock: vi.fn(),
  getCoverageSummaryMock: vi.fn(),
  getHistoryMetadataMock: vi.fn(),
  getPipelineStatusSummaryMock: vi.fn(),
  getSharedDataSourceMock: vi.fn(),
}));

vi.mock('react', () => ({
  cache: cacheMock,
}));

vi.mock('@/services/shared-data/coverage-service', () => ({
  getCoverageSummary: getCoverageSummaryMock,
  getHistoryMetadata: getHistoryMetadataMock,
  getSharedDataSource: getSharedDataSourceMock,
}));

vi.mock('@/services/shared-data/pipeline-status-service', () => ({
  getPipelineStatusSummary: getPipelineStatusSummaryMock,
}));

vi.mock('@/lib/sentry-reporting', () => ({
  captureWarningWithContext: captureWarningWithContextMock,
}));

const SHARED_SOURCE = {
  provider: 'Bizi Zaragoza GBFS',
  gbfsDiscoveryUrl: 'https://example.com/gbfs.json',
} as const;

const SHARED_COVERAGE = {
  firstRecordedAt: '2026-03-01T00:00:00.000Z',
  lastRecordedAt: '2026-03-09T10:30:00.000Z',
  totalSamples: 1440,
  totalStations: 276,
  totalDays: 9,
  generatedAt: '2026-03-09T10:35:00.000Z',
} as const;

const PIPELINE_SUMMARY = {
  pipeline: {
    lastSuccessfulPoll: SHARED_COVERAGE.lastRecordedAt,
    totalRowsCollected: SHARED_COVERAGE.totalSamples,
    pollsLast24Hours: 288,
    validationErrors: 0,
    consecutiveFailures: 0,
    lastDataFreshness: true,
    lastStationCount: SHARED_COVERAGE.totalStations,
    averageStationsPerPoll: SHARED_COVERAGE.totalStations,
    healthStatus: 'healthy' as const,
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
    lastCheck: SHARED_COVERAGE.generatedAt,
  },
  system: {
    uptime: SHARED_COVERAGE.generatedAt,
    version: '0.1.0',
    environment: 'test',
  },
  operations: {
    cache: {
      configured: true,
      available: true,
      backend: 'redis' as const,
    },
    recentCollections: [],
    security: {
      failedAuthLast24Hours: 0,
      rateLimitedLast24Hours: 0,
      refreshTokenReuseLast24Hours: 0,
    },
  },
  timestamp: SHARED_COVERAGE.generatedAt,
} as const;

async function loadGetSharedDatasetSnapshot() {
  const sharedDataModule = await import('@/services/shared-data');
  return sharedDataModule.getSharedDatasetSnapshot;
}

describe('getSharedDatasetSnapshot', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-08T19:06:07.000Z'));

    cacheMock.mockReset();
    captureWarningWithContextMock.mockReset();
    getCoverageSummaryMock.mockReset();
    getHistoryMetadataMock.mockReset();
    getPipelineStatusSummaryMock.mockReset();
    getSharedDataSourceMock.mockReset();

    cacheMock.mockImplementation((fn: unknown) => fn);
    getSharedDataSourceMock.mockReturnValue(SHARED_SOURCE);
    getPipelineStatusSummaryMock.mockResolvedValue(PIPELINE_SUMMARY);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('derives lastUpdated and stats from a single coverage read', async () => {
    getCoverageSummaryMock.mockResolvedValue(SHARED_COVERAGE);
    const getSharedDatasetSnapshot = await loadGetSharedDatasetSnapshot();

    const snapshot = await getSharedDatasetSnapshot();

    expect(getCoverageSummaryMock).toHaveBeenCalledTimes(1);
    expect(getPipelineStatusSummaryMock).toHaveBeenCalledTimes(1);
    expect(snapshot).toEqual({
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
      pipeline: PIPELINE_SUMMARY,
    });
  });

  it('uses a coherent zeroed fallback when coverage fails', async () => {
    getCoverageSummaryMock.mockRejectedValue(new Error('coverage unavailable'));
    const getSharedDatasetSnapshot = await loadGetSharedDatasetSnapshot();

    const snapshot = await getSharedDatasetSnapshot();

    expect(snapshot.source).toEqual(SHARED_SOURCE);
    expect(snapshot.coverage).toEqual({
      firstRecordedAt: null,
      lastRecordedAt: null,
      totalSamples: 0,
      totalStations: 0,
      totalDays: 0,
      generatedAt: '2026-04-08T19:06:07.000Z',
    });
    expect(snapshot.lastUpdated).toEqual({
      lastSampleAt: null,
      generatedAt: '2026-04-08T19:06:07.000Z',
    });
    expect(snapshot.stats).toEqual({
      totalSamples: 0,
      totalStations: 0,
      totalDays: 0,
      generatedAt: '2026-04-08T19:06:07.000Z',
    });
    expect(snapshot.pipeline).toEqual(PIPELINE_SUMMARY);
    expect(captureWarningWithContextMock).toHaveBeenCalledWith(
      'Shared dataset snapshot degraded: coverage fallback applied.',
      expect.objectContaining({
        area: 'shared-data.snapshot',
        operation: 'getSharedDatasetSnapshot',
        dedupeKey: 'shared-data.snapshot.coverage-fallback',
      })
    );
  });
});
