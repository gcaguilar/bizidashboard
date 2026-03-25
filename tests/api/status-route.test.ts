import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getStatusMock } = vi.hoisted(() => ({
  getStatusMock: vi.fn(),
}));

vi.mock('@/services/shared-data', () => ({
  getPipelineStatusSummary: getStatusMock,
}));

import { GET } from '@/app/api/status/route';

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
      timestamp: new Date('2026-01-01T00:05:00.000Z'),
    });

    const response = await GET(new Request('http://localhost/api/status') as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('max-age=30');
    expect(payload.pipeline.totalRowsCollected).toBe(42);
  });

  it('returns 500 when status aggregation throws', async () => {
    getStatusMock.mockRejectedValue(new Error('metrics failed'));

    const response = await GET(new Request('http://localhost/api/status') as never);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('Failed to fetch pipeline status');
  });

  it('exports status as csv when requested', async () => {
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
      timestamp: new Date('2026-01-01T00:05:00.000Z'),
    });

    const response = await GET(new Request('http://localhost/api/status?format=csv') as never);
    const payload = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/csv');
    expect(payload).toContain('metric,value');
    expect(payload).toContain('healthStatus,"healthy"');
  });
});
