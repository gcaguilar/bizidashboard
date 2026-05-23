import { describe, expect, it, vi, beforeEach } from 'vitest';

const { queryRawMock, getPipelineStatusSummaryMock } = vi.hoisted(() => ({
  queryRawMock: vi.fn(),
  getPipelineStatusSummaryMock: vi.fn(),
}));

vi.mock('@/db', () => ({
  prisma: { $queryRaw: queryRawMock },
}));

vi.mock('@/services/shared-data', () => ({
  getPipelineStatusSummary: getPipelineStatusSummaryMock,
}));

vi.mock('@/lib/security/public-api-route', () => ({
  withPublicApiRoute: (_opts: unknown, handler: () => Promise<Response>) => handler,
}));

import { GET } from '@/app/api/health/ready';

describe('GET /api/health/ready', () => {
  beforeEach(() => {
    queryRawMock.mockReset();
    getPipelineStatusSummaryMock.mockReset();
  });

  it('returns ok when database and pipeline are healthy', async () => {
    queryRawMock.mockResolvedValue([{ '?column?': 1 }]);
    getPipelineStatusSummaryMock.mockResolvedValue({
      quality: {
        freshness: { lastUpdated: new Date().toISOString() },
      },
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe('ok');
    expect(payload.timestamp).toBeDefined();
    expect(payload.checks).toHaveLength(2);
    expect(payload.checks[0].name).toBe('database');
    expect(payload.checks[0].ok).toBe(true);
  });

  it('returns degraded when database fails', async () => {
    queryRawMock.mockRejectedValue(new Error('connection refused'));
    getPipelineStatusSummaryMock.mockResolvedValue({
      quality: {
        freshness: { lastUpdated: new Date().toISOString() },
      },
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.status).toBe('degraded');
    expect(payload.checks[0].ok).toBe(false);
    expect(payload.checks[0].error).toContain('connection refused');
  });

  it('returns degraded when pipeline data is stale', async () => {
    queryRawMock.mockResolvedValue([{ '?column?': 1 }]);
    getPipelineStatusSummaryMock.mockResolvedValue({
      quality: {
        freshness: { lastUpdated: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
      },
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.status).toBe('degraded');
    expect(payload.checks[1].name).toBe('pipeline');
    expect(payload.checks[1].ok).toBe(false);
  });
});