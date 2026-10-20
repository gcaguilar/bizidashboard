import { beforeEach, describe, expect, it, vi } from 'vitest';

type QueryResult = Record<string, unknown>[];

const { queryRawMock, withCacheMock } = vi.hoisted(() => ({
  queryRawMock: vi.fn(),
  withCacheMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: { $queryRaw: queryRawMock },
}));

vi.mock('@/lib/cache/cache', () => ({
  withCache: withCacheMock,
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/lib/sentry-reporting', () => ({
  captureExceptionWithContext: vi.fn(),
}));

const { getHistorySeries, mergeDailySeries } = await import('@/lib/history-read-model');

function sqlOf(strings: TemplateStringsArray): string {
  return Array.from(strings).join(' ');
}

function mockQueries(options: {
  stored?: QueryResult | Error;
  today?: QueryResult | Error;
  raw?: QueryResult | Error;
}): void {
  queryRawMock.mockImplementation((strings: TemplateStringsArray) => {
    const sql = sqlOf(strings);

    if (sql.includes('"DailySystemStat"')) {
      return options.stored instanceof Error
        ? Promise.reject(options.stored)
        : Promise.resolve(options.stored ?? []);
    }

    if (sql.includes('bucket_date')) {
      return options.raw instanceof Error
        ? Promise.reject(options.raw)
        : Promise.resolve(options.raw ?? []);
    }

    return options.today instanceof Error
      ? Promise.reject(options.today)
      : Promise.resolve(options.today ?? []);
  });
}

const STORED_ROWS = [
  { day: '2026-05-01', demandScore: 12, avgOccupancy: 0.5, balanceIndex: 0.8, sampleCount: 24 },
  { day: '2026-05-02', demandScore: 14, avgOccupancy: 0.6, balanceIndex: 0.7, sampleCount: 26 },
];

const TODAY_ROW = {
  day: '2026-05-03',
  demandScore: 16,
  avgOccupancy: 0.55,
  balanceIndex: 0.75,
  sampleCount: 28,
};

describe('getHistorySeries', () => {
  beforeEach(() => {
    queryRawMock.mockReset();
    withCacheMock.mockReset();
    withCacheMock.mockImplementation(
      (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()
    );
  });

  it('reads closed days from DailySystemStat and appends today', async () => {
    mockQueries({ stored: STORED_ROWS, today: [TODAY_ROW] });

    const rows = await getHistorySeries();

    expect(rows).toEqual([...STORED_ROWS, TODAY_ROW]);
    expect(withCacheMock).toHaveBeenCalledWith(
      'history:daily-series:finalized',
      6 * 60 * 60,
      expect.any(Function)
    );
    expect(withCacheMock).toHaveBeenCalledWith(
      'history:daily-series:today',
      2 * 60,
      expect.any(Function)
    );
  });

  it('normalizes missing values', async () => {
    mockQueries({
      stored: [
        { day: '2026-05-01', demandScore: null, avgOccupancy: null, balanceIndex: null, sampleCount: null },
      ],
      today: [],
    });

    await expect(getHistorySeries()).resolves.toEqual([
      { day: '2026-05-01', demandScore: 0, avgOccupancy: 0, balanceIndex: 0, sampleCount: 0 },
    ]);
  });

  it('falls back to the raw series when DailySystemStat is empty', async () => {
    mockQueries({ stored: [], today: [TODAY_ROW], raw: STORED_ROWS });

    const rows = await getHistorySeries();

    expect(rows).toEqual([...STORED_ROWS, TODAY_ROW]);
  });

  it('falls back to the raw series when DailySystemStat does not exist yet', async () => {
    mockQueries({
      stored: new Error('relation "DailySystemStat" does not exist'),
      today: [TODAY_ROW],
      raw: STORED_ROWS,
    });

    const rows = await getHistorySeries();

    expect(rows).toEqual([...STORED_ROWS, TODAY_ROW]);
  });

  it('trims the merged series to the requested window', async () => {
    mockQueries({
      stored: Array.from({ length: 10 }, (_, index) => ({
        day: `2026-05-${String(index + 1).padStart(2, '0')}`,
        demandScore: index,
        avgOccupancy: 0.5,
        balanceIndex: 0.5,
        sampleCount: 10,
      })),
      today: [],
    });

    const rows = await getHistorySeries({ days: 3 });

    expect(rows.map((row) => row.day)).toEqual(['2026-05-08', '2026-05-09', '2026-05-10']);
  });

  it('returns an empty series instead of throwing when the query fails', async () => {
    mockQueries({ stored: new Error('statement timeout') });

    await expect(getHistorySeries()).resolves.toEqual([]);
  });
});

describe('mergeDailySeries', () => {
  it('replaces the stored row when today is already persisted', () => {
    const merged = mergeDailySeries(STORED_ROWS, { ...TODAY_ROW, day: '2026-05-02' });

    expect(merged).toHaveLength(2);
    expect(merged[1]).toEqual({ ...TODAY_ROW, day: '2026-05-02' });
  });

  it('ignores a today row older than the stored series', () => {
    const merged = mergeDailySeries(STORED_ROWS, { ...TODAY_ROW, day: '2026-04-01' });

    expect(merged).toEqual(STORED_ROWS);
  });

  it('returns the stored series when there is no today row', () => {
    expect(mergeDailySeries(STORED_ROWS, null)).toEqual(STORED_ROWS);
  });
});
