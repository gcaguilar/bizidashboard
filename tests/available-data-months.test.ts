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

  it('returns valid month keys from aggregated month candidates', async () => {
    queryRawMock.mockResolvedValue([
      { monthKey: '2026-03' },
      { monthKey: '2026-02' },
      { monthKey: null },
      { monthKey: 'invalid' },
    ]);

    const months = await getAvailableDataMonths();

    expect(months).toEqual(['2026-03', '2026-02']);
  });
});
