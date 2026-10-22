import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const {
  queryRawMock,
  transactionMock,
  executeRawMock,
  deleteManyMock,
  createManyMock,
  findWatermarkMock,
  setWatermarkMock,
} = vi.hoisted(() => ({
  queryRawMock: vi.fn(),
  transactionMock: vi.fn(),
  executeRawMock: vi.fn(),
  deleteManyMock: vi.fn(),
  createManyMock: vi.fn(),
  findWatermarkMock: vi.fn(),
  setWatermarkMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    $queryRaw: queryRawMock,
    $transaction: transactionMock,
  },
}));

vi.mock('@/analytics/watermarks', () => ({
  findWatermark: findWatermarkMock,
  setWatermark: setWatermarkMock,
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  getMonthlyCriticalEpisodes,
  refreshMonthlyCriticalEpisodes,
} from '@/analytics/queries/monthly-report';

const MONTH = '2026-03';

/** `$queryRaw` como tagged template: aplana el texto y los valores (incluidos fragmentos `Prisma.sql`). */
function flattenTaggedCall(call: unknown[]): { sql: string; values: unknown[] } {
  const [strings, ...params] = call as [TemplateStringsArray, ...unknown[]];
  const values: unknown[] = [];
  let sql = strings[0];
  params.forEach((param, index) => {
    if (param && typeof param === 'object' && 'sql' in param && 'values' in param) {
      sql += (param as { sql: string }).sql;
      values.push(...(param as { values: unknown[] }).values);
    } else {
      sql += '?';
      values.push(param);
    }
    sql += strings[index + 1];
  });
  return { sql, values };
}

describe('monthly critical episodes', () => {
  beforeEach(() => {
    queryRawMock.mockReset();
    transactionMock.mockReset();
    executeRawMock.mockReset();
    deleteManyMock.mockReset();
    createManyMock.mockReset();
    findWatermarkMock.mockReset();
    setWatermarkMock.mockReset();
  });

  it('aggregates exact episode rows when the precomputed table is missing', async () => {
    findWatermarkMock.mockResolvedValue(null);
    queryRawMock.mockResolvedValue([
      {
        stationId: 'a',
        kind: 'empty',
        startedAt: '2026-03-01T10:00:00.000Z',
        endedAt: '2026-03-01T10:10:00.000Z',
        durationMinutes: 10,
      },
      {
        stationId: 'a',
        kind: 'empty',
        startedAt: '2026-03-02T10:00:00.000Z',
        endedAt: '2026-03-02T10:20:00.000Z',
        durationMinutes: 20,
      },
      {
        stationId: 'a',
        kind: 'full',
        startedAt: '2026-03-03T10:00:00.000Z',
        endedAt: '2026-03-03T10:05:00.000Z',
        durationMinutes: 5,
      },
      {
        stationId: 'b',
        kind: 'empty',
        startedAt: '2026-03-04T10:00:00.000Z',
        endedAt: '2026-03-04T10:30:00.000Z',
        durationMinutes: 30,
      },
    ]);

    const episodes = await getMonthlyCriticalEpisodes(MONTH);

    expect(episodes.a).toMatchObject({
      stationId: 'a',
      avgEmptyEpisodeMinutes: 15,
      avgFullEpisodeMinutes: 5,
      maxEmptyEpisodeMinutes: 20,
      maxFullEpisodeMinutes: 5,
      episodeCount: 3,
    });
    expect(episodes.b).toMatchObject({
      stationId: 'b',
      avgEmptyEpisodeMinutes: 30,
      avgFullEpisodeMinutes: 0,
      maxEmptyEpisodeMinutes: 30,
      maxFullEpisodeMinutes: 0,
      episodeCount: 1,
    });
  });

  it('reads the precomputed aggregate when the watermark exists', async () => {
    findWatermarkMock.mockResolvedValue(new Date('2026-04-01T00:00:00.000Z'));
    queryRawMock.mockResolvedValue([
      {
        stationId: 'a',
        avgEmptyMinutes: 15,
        avgFullMinutes: 5,
        maxEmptyMinutes: 20,
        maxFullMinutes: 5,
        episodeCount: 3,
      },
    ]);

    const episodes = await getMonthlyCriticalEpisodes(MONTH);

    expect(episodes.a).toEqual({
      stationId: 'a',
      avgEmptyEpisodeMinutes: 15,
      avgFullEpisodeMinutes: 5,
      maxEmptyEpisodeMinutes: 20,
      maxFullEpisodeMinutes: 5,
      episodeCount: 3,
    });
  });

  it('replaces the month table atomically and marks it as computed', async () => {
    findWatermarkMock.mockResolvedValue(null);
    queryRawMock.mockResolvedValue([
      {
        stationId: 'a',
        kind: 'empty',
        startedAt: '2026-03-01T10:00:00.000Z',
        endedAt: '2026-03-01T10:10:00.000Z',
        durationMinutes: 10,
      },
    ]);
    transactionMock.mockImplementation(async (callback: (tx: unknown) => Promise<void>) =>
      callback({
        stationCriticalEpisode: {
          deleteMany: deleteManyMock,
          createMany: createManyMock,
        },
      })
    );

    const result = await refreshMonthlyCriticalEpisodes(MONTH);

    expect(result).toEqual({ monthKey: MONTH, episodes: 1, mode: 'full' });
    expect(deleteManyMock).toHaveBeenCalledWith({ where: { monthKey: MONTH } });
    expect(createManyMock).toHaveBeenCalledWith({
      data: [
        {
          stationId: 'a',
          kind: 'empty',
          startedAt: new Date('2026-03-01T10:00:00.000Z'),
          endedAt: new Date('2026-03-01T10:10:00.000Z'),
          durationMinutes: 10,
          monthKey: MONTH,
        },
      ],
    });
    expect(setWatermarkMock).toHaveBeenCalledWith(
      `critical-episodes:${MONTH}`,
      expect.any(Date)
    );
  });

  it('only rereads each station from its last non-critical sample after a recent refresh', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T12:00:00.000Z'));
    try {
      findWatermarkMock.mockResolvedValue(new Date('2026-03-15T11:10:00.000Z'));
      queryRawMock
        // Anclas: `a` tuvo una muestra sana; `b` lleva critica toda la ventana.
        .mockResolvedValueOnce([
          { stationId: 'a', anchorAt: '2026-03-15T09:58:00.000Z' },
          { stationId: 'b', anchorAt: null },
        ])
        .mockResolvedValueOnce([
          {
            stationId: 'a',
            kind: 'empty',
            startedAt: '2026-03-15T10:00:00.000Z',
            endedAt: '2026-03-15T11:30:00.000Z',
            durationMinutes: 90,
          },
        ]);
      transactionMock.mockImplementation(async (callback: (tx: unknown) => Promise<void>) =>
        callback({
          $executeRaw: executeRawMock,
          stationCriticalEpisode: { deleteMany: deleteManyMock, createMany: createManyMock },
        })
      );

      const result = await refreshMonthlyCriticalEpisodes(MONTH);

      expect(result).toEqual({ monthKey: MONTH, episodes: 1, mode: 'incremental' });
      expect(deleteManyMock).not.toHaveBeenCalled();
      expect(executeRawMock).toHaveBeenCalledTimes(1);

      const anchorQuery = flattenTaggedCall(queryRawMock.mock.calls[0]);
      expect(anchorQuery.sql).toContain('LEFT JOIN LATERAL');
      // Frontera = ultimo refresco - 1 h; el ancla se busca hasta 48 h antes.
      expect(anchorQuery.values).toEqual(['2026-03-13T10:10:00.000Z', '2026-03-15T10:10:00.000Z']);

      const episodeQuery = flattenTaggedCall(queryRawMock.mock.calls[1]);
      expect(episodeQuery.sql).toContain('CROSS JOIN LATERAL');
      expect(episodeQuery.sql).toContain('OFFSET 0');
      expect(episodeQuery.values).toEqual(
        expect.arrayContaining(['a', '2026-03-15T09:58:00.000Z', 'b', '2026-03-01T00:00:00.000Z'])
      );
      expect(createManyMock).toHaveBeenCalledWith({
        data: [expect.objectContaining({ stationId: 'a', durationMinutes: 90, monthKey: MONTH })],
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('falls back to a full refresh when the last one is too old', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T12:00:00.000Z'));
    try {
      findWatermarkMock.mockResolvedValue(new Date('2026-03-13T12:00:00.000Z'));
      queryRawMock.mockResolvedValue([]);
      transactionMock.mockImplementation(async (callback: (tx: unknown) => Promise<void>) =>
        callback({ stationCriticalEpisode: { deleteMany: deleteManyMock, createMany: createManyMock } })
      );

      const result = await refreshMonthlyCriticalEpisodes(MONTH);

      expect(result.mode).toBe('full');
      expect(queryRawMock).toHaveBeenCalledTimes(1);
      expect(deleteManyMock).toHaveBeenCalledWith({ where: { monthKey: MONTH } });
    } finally {
      vi.useRealTimers();
    }
  });
});
