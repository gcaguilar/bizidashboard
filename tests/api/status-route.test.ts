import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getStatusMock } = vi.hoisted(() => ({
  getStatusMock: vi.fn(),
}));

vi.mock('@/services/shared-data', () => ({
  getPipelineStatusSummary: getStatusMock,
}));

import { Route } from '@/app/api/status/index';

const handler = Route.options.server!.handlers!.GET!

describe('GET /api/status', () => {
  beforeEach(() => {
    getStatusMock.mockReset();
  });

  it('returns pipeline status payload with cache headers', async () => {
    getStatusMock.mockResolvedValue({
      pipeline: {
        lastSuccessfulPoll: null,
        totalRowsCollected: 42,
        pollsLast24Hours: 4,
        validationErrors: 0,
        consecutiveFailures: 0,
        lastDataFreshness: true,
        lastStationCount: 120,
        averageStationsPerPoll: 118,
        healthStatus: 'healthy',
        healthReason: null,
      },
      quality: {
        freshness: {
          isFresh: true,
          lastUpdated: null,
          maxAgeSeconds: 3600,
        },
        volume: {
          recentStationCount: 120,
          averageStationsPerPoll: 118,
          expectedRange: { min: 100, max: 140 },
        },
        lastCheck: null,
      },
      system: {
        uptime: new Date('2026-01-01T00:00:00.000Z'),
        version: '1.0.0',
        environment: 'test',
      },
      operations: {
        cache: {
          configured: true,
          available: true,
          backend: 'redis',
        },
        recentCollections: [
          {
            collectionId: 'col-1',
            trigger: 'manual',
            status: 'succeeded',
            requestId: 'req-1',
            snapshotRecordedAt: '2026-01-01T00:00:00.000Z',
            insertedCount: 42,
            duplicateCount: 0,
            warningCount: 0,
            errorCount: 0,
            startedAt: '2026-01-01T00:00:00.000Z',
            finishedAt: '2026-01-01T00:05:00.000Z',
          },
        ],
        security: {
          failedAuthLast24Hours: 0,
          rateLimitedLast24Hours: 0,
          refreshTokenReuseLast24Hours: 0,
        },
      },
      timestamp: new Date('2026-01-01T00:05:00.000Z'),
    });

    const response = await handler({ request: new Request('http://localhost/api/status') });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('max-age=60');
    expect(payload.pipeline.totalRowsCollected).toBe(42);
    expect(payload.operations.cache.available).toBe(true);
    expect(payload.operations.recentCollections[0].warnings).toBeUndefined();
    expect(payload.dataState).toBe('ok');
  });

  it('returns 500 when status aggregation throws', async () => {
    getStatusMock.mockRejectedValue(new Error('metrics failed'));

    const response = await handler({ request: new Request('http://localhost/api/status') });
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('Internal server error');
  });

  it('exports status as csv when requested', async () => {
    getStatusMock.mockResolvedValue({
      pipeline: { lastSuccessfulPoll: '2026-01-01T00:00:00.000Z', totalRowsCollected: 42, healthStatus: 'healthy' },
      quality: { freshness: { lastUpdated: '2026-01-01T00:00:00.000Z', isFresh: true }, volume: { expectedRange: { min: 1, max: 400 } } },
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
    });
    const response = await handler({ request: new Request('http://localhost/api/status?format=csv') });
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('csv');
    const body = await response.text();
    expect(body).toContain('timestamp');
  });
});
