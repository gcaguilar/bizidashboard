import { describe, expect, it, vi, beforeEach } from 'vitest';

const { queryRawMock, findFirstMock } = vi.hoisted(() => ({
  queryRawMock: vi.fn(),
  findFirstMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    $queryRaw: queryRawMock,
    stationStatus: {
      findFirst: findFirstMock,
    },
  },
  getCity: () => 'zaragoza',
}));

import { GET } from '@/app/api/health/live';

describe('GET /api/health/live', () => {
  beforeEach(() => {
    queryRawMock.mockReset();
    findFirstMock.mockReset();
  });

  it('returns a simple ok status', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe('ok');
    expect(payload.timestamp).toBeDefined();
  });
});
