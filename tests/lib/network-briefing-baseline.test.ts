import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryRawMock, withCacheMock } = vi.hoisted(() => ({
  queryRawMock: vi.fn(),
  withCacheMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ prisma: { $queryRaw: queryRawMock } }));
vi.mock('@/lib/cache/cache', () => ({ withCache: withCacheMock }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));

import { fetchComparableNetworkBaseline } from '@/lib/network-briefing-baseline';

// Miercoles 22 de octubre de 2026, 10:20 UTC (12:20 en Madrid).
const REFERENCE = new Date('2026-10-22T10:20:00.000Z');

function tagged(call: unknown[]): { sql: string; values: unknown[] } {
  const [strings, ...values] = call as [TemplateStringsArray, ...unknown[]];
  return { sql: strings.join('?'), values };
}

describe('comparable network baseline', () => {
  beforeEach(() => {
    queryRawMock.mockReset();
    withCacheMock.mockReset();
    withCacheMock.mockImplementation(
      async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()
    );
  });

  it('reads only the candidate buckets of the last six weeks', async () => {
    queryRawMock
      .mockResolvedValueOnce([
        { bucketStart: new Date('2026-10-15T10:00:00.000Z'), stationCount: 276, criticalStationsCount: 12 },
      ])
      .mockResolvedValueOnce([{ alertCount: 4 }]);

    const baseline = await fetchComparableNetworkBaseline(REFERENCE, 276);

    expect(baseline).toMatchObject({ criticalStationsCount: 12, activeAlertsCount: 4 });
    const { sql, values } = tagged(queryRawMock.mock.calls[0]);
    expect(sql).toContain('"bucketStart" = ANY(?::timestamp[])');
    const candidates = values[0] as string[];
    expect(candidates).toHaveLength(18);
    expect(candidates).toContain('2026-10-15T10:00:00.000Z');
    expect(candidates).toContain('2026-09-10T11:00:00.000Z');
  });

  it('caches "no comparable slot" instead of retrying both scans on every render', async () => {
    queryRawMock.mockResolvedValue([]);

    const baseline = await fetchComparableNetworkBaseline(REFERENCE, 276);

    expect(baseline).toBeNull();
    // Hourly candidates, then the raw-snapshot fallback; nothing else.
    expect(queryRawMock).toHaveBeenCalledTimes(2);
    await expect(withCacheMock.mock.results[0].value).resolves.toEqual({ baseline: null });
  });

  it('does not cache a database failure', async () => {
    queryRawMock.mockRejectedValue(new Error('db down'));

    await expect(fetchComparableNetworkBaseline(REFERENCE, 276)).resolves.toBeNull();
    await expect(withCacheMock.mock.results[0].value).rejects.toThrow('unavailable');
  });
});
