import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getStationsWithLatestStatusMock, withCacheMock } = vi.hoisted(() => ({
  getStationsWithLatestStatusMock: vi.fn(),
  withCacheMock: vi.fn(),
}));

vi.mock('@/analytics/queries/read', () => ({
  getStationsWithLatestStatus: getStationsWithLatestStatusMock,
}));

vi.mock('@/lib/cache/cache', () => ({
  withCache: withCacheMock,
}));

import { GET } from '@/app/api/stations/route';

describe('GET /api/stations', () => {
  beforeEach(() => {
    getStationsWithLatestStatusMock.mockReset();
    withCacheMock.mockReset();
  });

  it('returns stations payload through cache wrapper', async () => {
    getStationsWithLatestStatusMock.mockResolvedValue([
      {
        id: '101',
        name: 'Plaza Espana',
        lat: 41.6488,
        lon: -0.8891,
        capacity: 20,
        bikesAvailable: 9,
        anchorsFree: 11,
        recordedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    withCacheMock.mockImplementation(async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => {
      return fetcher();
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(withCacheMock).toHaveBeenCalledWith('stations:current', 60, expect.any(Function));
    expect(payload.stations).toHaveLength(1);
    expect(payload.generatedAt).toBeTypeOf('string');
  });

  it('returns 500 when station retrieval fails', async () => {
    withCacheMock.mockRejectedValue(new Error('redis unavailable'));

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe('Failed to fetch stations');
  });
});
