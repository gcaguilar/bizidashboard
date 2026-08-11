import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryRawMock } = vi.hoisted(() => ({
  queryRawMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    $queryRaw: queryRawMock,
  },
}));

import { getAvailableDataMonths } from '@/analytics/queries/read';

describe('getAvailableDataMonths', () => {
  beforeEach(() => {
    queryRawMock.mockReset();
  });

  it('enumerates every month between each source min and max, deduplicated and sorted desc', async () => {
    queryRawMock
      .mockResolvedValueOnce([
        { minAt: new Date('2026-02-10T08:00:00Z'), maxAt: new Date('2026-03-05T21:00:00Z') },
      ])
      .mockResolvedValueOnce([{ minAt: null, maxAt: null }])
      .mockResolvedValueOnce([
        { minAt: new Date('2026-01-20T00:00:00Z'), maxAt: new Date('2026-02-01T00:00:00Z') },
      ]);

    const months = await getAvailableDataMonths();

    expect(months).toEqual(['2026-03', '2026-02', '2026-01']);
  });

  it('accepts string bounds and ignores unparseable values', async () => {
    queryRawMock
      .mockResolvedValueOnce([{ minAt: '2026-03-01T00:00:00Z', maxAt: '2026-03-15T00:00:00Z' }])
      .mockResolvedValueOnce([{ minAt: 'invalid', maxAt: '2026-04-01T00:00:00Z' }])
      .mockResolvedValueOnce([]);

    const months = await getAvailableDataMonths();

    expect(months).toEqual(['2026-03']);
  });

  it('returns an empty list when every source fails or is empty', async () => {
    queryRawMock
      .mockRejectedValueOnce(new Error('missing table'))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ minAt: null, maxAt: null }]);

    const months = await getAvailableDataMonths();

    expect(months).toEqual([]);
  });
});
