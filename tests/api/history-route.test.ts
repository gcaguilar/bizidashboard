import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryRawMock, getHistoryMetadataMock, getPipelineStatusSummaryMock } = vi.hoisted(() => ({
  queryRawMock: vi.fn(),
  getHistoryMetadataMock: vi.fn(),
  getPipelineStatusSummaryMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    $queryRaw: queryRawMock,
  },
}));

vi.mock('@/services/shared-data', () => ({
  getHistoryMetadata: getHistoryMetadataMock,
  getPipelineStatusSummary: getPipelineStatusSummaryMock,
}));

vi.mock('@/lib/security/public-api-route', () => ({
  withPublicApiRoute: (_opts: unknown, handler: (args: { request: Request; access: { headers: Record<string, string> } }) => Promise<Response>) => handler,
}));

describe('GET /api/history', () => {
  beforeEach(() => {
    queryRawMock.mockReset();
    getHistoryMetadataMock.mockReset();
    getPipelineStatusSummaryMock.mockReset();
  });

  it('exposes GET handler through server options', async () => {
    const { Route } = await import('@/app/api/history/index');
    expect(Route.options.server).toBeDefined();
    expect(Route.options.server!.handlers!.GET).toBeDefined();
    expect(typeof Route.options.server!.handlers!.GET).toBe('function');
  });

  it('returns 200 with fallback payload when history metadata fails', async () => {
    getHistoryMetadataMock.mockRejectedValue(new Error('metadata unavailable'));
    getPipelineStatusSummaryMock.mockRejectedValue(new Error('status unavailable'));
    queryRawMock.mockResolvedValue([
      {
        day: '2026-05-01',
        demandScore: 12,
        avgOccupancy: 0.5,
        balanceIndex: 0.8,
        sampleCount: 24,
      },
    ]);

    const { Route } = await import('@/app/api/history/index');
    const handler = Route.options.server!.handlers!.GET!;
    const response = await handler({
      request: new Request('http://localhost/api/history'),
      access: { headers: {} },
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(payload.history)).toBe(true);
    expect(payload.history).toHaveLength(1);
    expect(payload.coverage).toBeDefined();
    expect(payload.generatedAt).toBeDefined();
  });
});
