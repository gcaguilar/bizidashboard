import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { withCacheMock, getStatusMock } = vi.hoisted(() => ({
  withCacheMock: vi.fn(),
  getStatusMock: vi.fn(),
}));

const {
  getRedisHealthSummaryMock,
  getRecentCollectionRunsMock,
  getSecurityEventSummaryMock,
} = vi.hoisted(() => ({
  getRedisHealthSummaryMock: vi.fn(),
  getRecentCollectionRunsMock: vi.fn(),
  getSecurityEventSummaryMock: vi.fn(),
}));

vi.mock('@/lib/cache/cache', () => ({
  withCache: withCacheMock,
}));

vi.mock('@/lib/metrics', () => ({
  getStatus: getStatusMock,
}));

vi.mock('@/lib/cache/redis', () => ({
  getRedisHealthSummary: getRedisHealthSummaryMock,
}));

vi.mock('@/lib/collection-runs', () => ({
  getRecentCollectionRuns: getRecentCollectionRunsMock,
}));

vi.mock('@/lib/security/audit', () => ({
  getSecurityEventSummary: getSecurityEventSummaryMock,
}));

import { getPipelineStatusSummary } from '@/services/shared-data/pipeline-status-service';

describe('pipeline status service', () => {
  beforeEach(() => {
    withCacheMock.mockReset();
    getStatusMock.mockReset();

    withCacheMock.mockImplementation(async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
      return fetcher();
    });
    getRedisHealthSummaryMock.mockResolvedValue({
      configured: true,
      available: true,
      backend: 'redis',
    });
    getRecentCollectionRunsMock.mockResolvedValue([]);
    getSecurityEventSummaryMock.mockResolvedValue({
      failedAuthLast24Hours: 0,
      rateLimitedLast24Hours: 0,
      refreshTokenReuseLast24Hours: 0,
    });
  });

  it('serializes Date fields into ISO strings explicitly', async () => {
    getStatusMock.mockResolvedValue({
      pipeline: {
        lastSuccessfulPoll: new Date('2026-04-01T14:35:00.000Z'),
        totalRowsCollected: 1200,
        pollsLast24Hours: 288,
        validationErrors: 0,
        consecutiveFailures: 0,
        lastDataFreshness: true,
        lastStationCount: 276,
        averageStationsPerPoll: 275,
        healthStatus: 'healthy',
        healthReason: null,
      },
      quality: {
        freshness: {
          isFresh: true,
          lastUpdated: new Date('2026-04-01T14:35:00.000Z'),
          maxAgeSeconds: 600,
        },
        volume: {
          recentStationCount: 276,
          averageStationsPerPoll: 275,
          expectedRange: { min: 200, max: 500 },
        },
        lastCheck: new Date('2026-04-01T14:35:30.000Z'),
      },
      system: {
        uptime: new Date('2026-04-01T00:00:00.000Z'),
        version: '1.0.0',
        environment: 'test',
      },
      timestamp: new Date('2026-04-01T14:36:00.000Z'),
    });

    const summary = await getPipelineStatusSummary();

    expect(summary.pipeline.lastSuccessfulPoll).toBe('2026-04-01T14:35:00.000Z');
    expect(summary.quality.freshness.lastUpdated).toBe('2026-04-01T14:35:00.000Z');
    expect(summary.quality.lastCheck).toBe('2026-04-01T14:35:30.000Z');
    expect(summary.system.uptime).toBe('2026-04-01T00:00:00.000Z');
    expect(summary.operations.cache.backend).toBe('redis');
    expect(summary.timestamp).toBe('2026-04-01T14:36:00.000Z');
  });
});
