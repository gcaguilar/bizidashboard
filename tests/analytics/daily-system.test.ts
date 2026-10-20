import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryRawMock, executeRawMock } = vi.hoisted(() => ({
  queryRawMock: vi.fn(),
  executeRawMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: { $queryRaw: queryRawMock, $executeRaw: executeRawMock },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn() },
}));

const { syncDailySystemStats, startOfUtcDay } = await import(
  '@/analytics/queries/daily-system'
);

const TODAY = new Date('2026-10-20T00:00:00.000Z');

function mockState(options: { count: number; nextDay?: string | null }): void {
  queryRawMock.mockImplementation((strings: TemplateStringsArray) => {
    const sql = Array.from(strings).join(' ');

    if (sql.includes('COUNT(*)')) {
      return Promise.resolve([{ count: options.count }]);
    }

    return Promise.resolve([{ nextDay: options.nextDay ?? null }]);
  });
}

describe('syncDailySystemStats', () => {
  beforeEach(() => {
    queryRawMock.mockReset();
    executeRawMock.mockReset();
    executeRawMock.mockResolvedValue(1);
  });

  it('seeds the exact window first and then the full history when the table is empty', async () => {
    mockState({ count: 0 });

    const result = await syncDailySystemStats(TODAY);

    expect(result).toEqual({ seeded: true, days: 1 });
    // Exact refresh + approximate backfill, no gap query needed.
    expect(executeRawMock).toHaveBeenCalledTimes(2);
    expect(queryRawMock).toHaveBeenCalledTimes(1);

    const [, from, to] = executeRawMock.mock.calls[0] as unknown[];
    expect(from).toEqual(new Date('2026-07-22T00:00:00.000Z'));
    expect(to).toEqual(TODAY);
  });

  it('does nothing but the idempotent backfill when yesterday is already persisted', async () => {
    mockState({ count: 10, nextDay: '2026-10-20' });

    const result = await syncDailySystemStats(TODAY);

    expect(result).toEqual({ seeded: false, days: 0 });
    expect(executeRawMock).toHaveBeenCalledTimes(1);
  });

  it('fills the gap when the job missed one or more days', async () => {
    mockState({ count: 10, nextDay: '2026-10-18' });
    executeRawMock.mockResolvedValue(2);

    const result = await syncDailySystemStats(TODAY);

    expect(result).toEqual({ seeded: false, days: 2 });
    // Backfill + exact refresh of the missing window.
    expect(executeRawMock).toHaveBeenCalledTimes(2);
  });

  it('computes the UTC day boundary', () => {
    expect(startOfUtcDay(new Date('2026-10-20T23:59:59.000Z'))).toEqual(TODAY);
  });
});
