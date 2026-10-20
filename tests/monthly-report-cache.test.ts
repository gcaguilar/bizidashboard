import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const {
  withCacheMock,
  withStaleCacheMock,
  deleteCachedJsonMock,
  getCachedJsonMock,
  readSnapshotMock,
  writeSnapshotMock,
} = vi.hoisted(() => ({
  withCacheMock: vi.fn(),
  withStaleCacheMock: vi.fn(),
  deleteCachedJsonMock: vi.fn(),
  getCachedJsonMock: vi.fn(),
  readSnapshotMock: vi.fn(),
  writeSnapshotMock: vi.fn(),
}));

vi.mock('@/lib/cache/cache', () => ({
  withCache: withCacheMock,
  withStaleCache: withStaleCacheMock,
  deleteCachedJson: deleteCachedJsonMock,
  getCachedJson: getCachedJsonMock,
}));

vi.mock('@/lib/monthly-report-sources', () => ({
  createLiveMonthlyReportSources: () => ({}),
}));

vi.mock('@/lib/monthly-report-snapshot', () => ({
  readMonthlyReportSnapshot: readSnapshotMock,
  writeMonthlyReportSnapshot: writeSnapshotMock,
  deleteMonthlyReportSnapshot: vi.fn().mockResolvedValue(undefined),
}));

import {
  buildMonthlyReport,
  invalidateMonthlyReport,
  isClosedReportMonth,
} from '@/lib/monthly-report';

const NOW = '2026-04-15T10:00:00.000Z';

describe('monthly report cache policy', () => {
  beforeEach(() => {
    withCacheMock.mockReset();
    withStaleCacheMock.mockReset();
    deleteCachedJsonMock.mockReset();
    getCachedJsonMock.mockReset();
    readSnapshotMock.mockReset();
    writeSnapshotMock.mockReset();
    withCacheMock.mockResolvedValue({ hasReport: true });
    withStaleCacheMock.mockResolvedValue({ hasReport: true });
    getCachedJsonMock.mockResolvedValue(null);
    readSnapshotMock.mockResolvedValue(null);
    writeSnapshotMock.mockResolvedValue(undefined);
  });

  it('seals a closed month with no expiry', async () => {
    await buildMonthlyReport('2026-03', NOW);

    expect(withCacheMock).toHaveBeenCalledWith(
      expect.stringContaining('reports:monthly'),
      null,
      expect.any(Function)
    );
    expect(withCacheMock.mock.calls[0]?.[0]).toContain('sealed');
  });

  it('keeps a short soft TTL with stale-while-revalidate for the month in progress', async () => {
    await buildMonthlyReport('2026-04', NOW);

    expect(withStaleCacheMock).toHaveBeenCalledWith(
      expect.stringContaining('reports:monthly'),
      { softTtlSeconds: 600, hardTtlSeconds: 21600 },
      expect.any(Function)
    );
    expect(withStaleCacheMock.mock.calls[0]?.[0]).toContain('live');
  });

  it('keys the cache by month so reports never collide', async () => {
    await buildMonthlyReport('2026-03', NOW);
    await buildMonthlyReport('2026-02', NOW);

    const [firstKey] = withCacheMock.mock.calls[0] as [string];
    const [secondKey] = withCacheMock.mock.calls[1] as [string];

    expect(firstKey).toContain('2026-03');
    expect(secondKey).toContain('2026-02');
    expect(firstKey).not.toEqual(secondKey);
  });

  it('reuses a legacy sealed report before rebuilding it without historical episodes', async () => {
    const legacyReport = {
      monthKey: '2026-03',
      hasReport: true,
      generatedAt: '2026-04-01T00:00:00.000Z',
    };
    getCachedJsonMock.mockResolvedValue(legacyReport);
    withCacheMock.mockImplementation(
      (_key: string, _ttl: number | null, fetcher: () => Promise<unknown>) => fetcher()
    );

    const report = await buildMonthlyReport('2026-03', NOW);

    expect(report).toBe(legacyReport);
    expect(getCachedJsonMock).toHaveBeenCalledWith('reports:monthly:v1:2026-03');
    expect(writeSnapshotMock).toHaveBeenCalledWith('2026-03', legacyReport);
  });

  it('drops the persisted month on demand', async () => {
    await invalidateMonthlyReport('2026-03');

    expect(deleteCachedJsonMock).toHaveBeenCalledWith(
      expect.stringContaining('reports:monthly')
    );
    expect(deleteCachedJsonMock).toHaveBeenCalledTimes(3);
  });

  it('knows which months are closed', () => {
    expect(isClosedReportMonth('2026-03', NOW)).toBe(true);
    expect(isClosedReportMonth('2026-04', NOW)).toBe(false);
    expect(isClosedReportMonth('2026-05', NOW)).toBe(false);
  });
});