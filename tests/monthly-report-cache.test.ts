import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { withCacheMock, deleteCachedJsonMock } = vi.hoisted(() => ({
  withCacheMock: vi.fn(),
  deleteCachedJsonMock: vi.fn(),
}));

vi.mock('@/lib/cache/cache', () => ({
  withCache: withCacheMock,
  deleteCachedJson: deleteCachedJsonMock,
}));

vi.mock('@/lib/monthly-report-sources', () => ({
  createLiveMonthlyReportSources: () => ({}),
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
    deleteCachedJsonMock.mockReset();
    withCacheMock.mockResolvedValue({ hasReport: true });
  });

  it('seals a closed month with no expiry', async () => {
    await buildMonthlyReport('2026-03', NOW);

    expect(withCacheMock).toHaveBeenCalledWith(
      expect.stringContaining('reports:monthly'),
      null,
      expect.any(Function)
    );
  });

  it('keeps a short TTL for the month still in progress', async () => {
    await buildMonthlyReport('2026-04', NOW);

    expect(withCacheMock).toHaveBeenCalledWith(
      expect.stringContaining('reports:monthly'),
      600,
      expect.any(Function)
    );
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

  it('drops the persisted month on demand', async () => {
    await invalidateMonthlyReport('2026-03');

    expect(deleteCachedJsonMock).toHaveBeenCalledWith(
      expect.stringContaining('reports:monthly')
    );
  });

  it('knows which months are closed', () => {
    expect(isClosedReportMonth('2026-03', NOW)).toBe(true);
    expect(isClosedReportMonth('2026-04', NOW)).toBe(false);
    expect(isClosedReportMonth('2026-05', NOW)).toBe(false);
  });
});
