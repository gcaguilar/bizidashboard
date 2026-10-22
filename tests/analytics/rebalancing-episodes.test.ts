import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryRawMock, findWatermarkMock } = vi.hoisted(() => ({
  queryRawMock: vi.fn(),
  findWatermarkMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: { $queryRaw: queryRawMock },
}));

vi.mock('@/analytics/watermarks', () => ({
  findWatermark: findWatermarkMock,
}));

import { getCriticalEpisodes } from '@/analytics/queries/rebalancing';

const ROW = {
  stationId: 'a',
  avgEmptyMinutes: 12,
  avgFullMinutes: 3,
  maxEmptyMinutes: 40,
  maxFullMinutes: 5,
  episodeCount: 4,
};

function sqlOf(call: unknown[]): string {
  return (call[0] as TemplateStringsArray).join('?');
}

describe('rebalancing critical episodes', () => {
  beforeEach(() => {
    queryRawMock.mockReset();
    findWatermarkMock.mockReset();
    queryRawMock.mockResolvedValue([ROW]);
  });

  it('reads the precomputed episode table when every month of the window is covered', async () => {
    findWatermarkMock.mockResolvedValue(new Date());

    const episodes = await getCriticalEpisodes(15);

    expect(queryRawMock).toHaveBeenCalledTimes(1);
    expect(sqlOf(queryRawMock.mock.calls[0])).toContain('FROM "StationCriticalEpisode"');
    expect(episodes.a).toEqual({
      stationId: 'a',
      avgEmptyEpisodeMinutes: 12,
      avgFullEpisodeMinutes: 3,
      maxEmptyEpisodeMinutes: 40,
      maxFullEpisodeMinutes: 5,
      episodeCount: 4,
    });
  });

  it('falls back to the raw snapshots when a month has not been computed yet', async () => {
    findWatermarkMock.mockResolvedValueOnce(null).mockResolvedValue(new Date());

    const episodes = await getCriticalEpisodes(15);

    expect(queryRawMock).toHaveBeenCalledTimes(1);
    expect(sqlOf(queryRawMock.mock.calls[0])).toContain('FROM "StationStatus"');
    expect(episodes.a?.episodeCount).toBe(4);
  });
});
