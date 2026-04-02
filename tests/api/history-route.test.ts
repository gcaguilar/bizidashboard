import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  withCacheMock,
  getHistoryMetadataMock,
  getPipelineStatusSummaryMock,
  queryRawMock,
  enforcePublicApiAccessMock,
} = vi.hoisted(() => ({
  withCacheMock: vi.fn(),
  getHistoryMetadataMock: vi.fn(),
  getPipelineStatusSummaryMock: vi.fn(),
  queryRawMock: vi.fn(),
  enforcePublicApiAccessMock: vi.fn(),
}));

vi.mock('@/lib/cache/cache', () => ({
  withCache: withCacheMock,
}));

vi.mock('@/services/shared-data', () => ({
  getHistoryMetadata: getHistoryMetadataMock,
  getPipelineStatusSummary: getPipelineStatusSummaryMock,
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    $queryRaw: queryRawMock,
  },
  getCity: () => 'zaragoza',
}));

vi.mock('@/lib/security/public-api', () => ({
  enforcePublicApiAccess: enforcePublicApiAccessMock,
}));

import { GET } from '@/app/api/history/route';

describe('GET /api/history', () => {
  beforeEach(() => {
    withCacheMock.mockReset();
    getHistoryMetadataMock.mockReset();
    getPipelineStatusSummaryMock.mockReset();
    queryRawMock.mockReset();
    enforcePublicApiAccessMock.mockReset();

    withCacheMock.mockImplementation(async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
      return fetcher();
    });
    enforcePublicApiAccessMock.mockResolvedValue({
      ok: true,
      headers: {},
    });

    getPipelineStatusSummaryMock.mockResolvedValue({
      pipeline: {
        healthStatus: 'healthy',
      },
      quality: {
        freshness: {
          isFresh: true,
        },
      },
    });
  });

  it('returns shared coverage metadata and daily history rows', async () => {
    getHistoryMetadataMock.mockResolvedValue({
      source: {
        provider: 'Bizi Zaragoza GBFS',
        gbfsDiscoveryUrl: 'https://example.com/gbfs.json',
      },
      coverage: {
        firstRecordedAt: '2026-03-01T00:00:00.000Z',
        lastRecordedAt: '2026-03-09T10:30:00.000Z',
        totalSamples: 1440,
        totalStations: 276,
        totalDays: 9,
        generatedAt: '2026-03-09T10:35:00.000Z',
      },
      generatedAt: '2026-03-09T10:35:00.000Z',
    });

    queryRawMock.mockResolvedValue([
      {
        day: '2026-03-09',
        demandScore: 321,
        avgOccupancy: 0.54,
        balanceIndex: 0.81,
        sampleCount: 144,
      },
    ]);

    const response = await GET(new Request('http://localhost/api/history') as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.coverage).toEqual({
      firstRecordedAt: '2026-03-01T00:00:00.000Z',
      lastRecordedAt: '2026-03-09T10:30:00.000Z',
      totalSamples: 1440,
      totalStations: 276,
      totalDays: 9,
      generatedAt: '2026-03-09T10:35:00.000Z',
    });
    expect(payload.generatedAt).toBe('2026-03-09T10:35:00.000Z');
    expect(payload.history).toEqual([
      {
        day: '2026-03-09',
        demandScore: 321,
        avgOccupancy: 0.54,
        balanceIndex: 0.81,
        sampleCount: 144,
      },
    ]);
    expect(payload.dataState).toBe('partial');
  });

  it('exports the history as csv when requested', async () => {
    getHistoryMetadataMock.mockResolvedValue({
      source: {
        provider: 'Bizi Zaragoza GBFS',
        gbfsDiscoveryUrl: 'https://example.com/gbfs.json',
      },
      coverage: {
        firstRecordedAt: '2026-03-01T00:00:00.000Z',
        lastRecordedAt: '2026-03-09T10:30:00.000Z',
        totalSamples: 1440,
        totalStations: 276,
        totalDays: 9,
        generatedAt: '2026-03-09T10:35:00.000Z',
      },
      generatedAt: '2026-03-09T10:35:00.000Z',
    });

    queryRawMock.mockResolvedValue([
      {
        day: '2026-03-09',
        demandScore: 321,
        avgOccupancy: 0.54,
        balanceIndex: 0.81,
        sampleCount: 144,
      },
    ]);

    const response = await GET(new Request('http://localhost/api/history?format=csv') as never);
    const payload = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/csv');
    expect(payload).toContain('"day","demandScore","avgOccupancy","balanceIndex","sampleCount"');
    expect(payload).toContain('"2026-03-09","321","0.54","0.81","144"');
  });

  it('returns 500 when the history aggregation fails', async () => {
    withCacheMock.mockRejectedValue(new Error('history failed'));

    const response = await GET(new Request('http://localhost/api/history') as never);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('Failed to fetch historical data');
    expect(payload.dataState).toBe('error');
  });
});
