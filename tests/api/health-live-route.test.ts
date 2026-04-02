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

import { GET } from '@/app/api/health/live/route';

describe('GET /api/health/live', () => {
  beforeEach(() => {
    queryRawMock.mockReset();
    findFirstMock.mockReset();
  });

  it('returns health status with dependency checks', async () => {
    queryRawMock.mockResolvedValue([1]);
    findFirstMock.mockResolvedValue({ recordedAt: new Date() });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(payload.status).toBe('ok');
    expect(payload.ready).toBe(true);
    expect(payload.checks.process).toBe('ok');
    expect(payload.checks.database).toBe('ok');
    expect(payload.checks.pipeline).toBe('ok');
    expect(response.headers.get('x-request-id')).toBeTruthy();
  });

  it('returns 503 when database is down', async () => {
    queryRawMock.mockRejectedValue(new Error('Connection failed'));

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.status).toBe('error');
    expect(payload.checks.database).toBe('error');
  });
});
