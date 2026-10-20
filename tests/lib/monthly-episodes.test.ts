import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const {
  queryRawMock,
  transactionMock,
  deleteManyMock,
  createManyMock,
  findWatermarkMock,
  setWatermarkMock,
} = vi.hoisted(() => ({
  queryRawMock: vi.fn(),
  transactionMock: vi.fn(),
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

describe('monthly critical episodes', () => {
  beforeEach(() => {
    queryRawMock.mockReset();
    transactionMock.mockReset();
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

    expect(result).toEqual({ monthKey: MONTH, episodes: 1 });
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
});
