import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fetchTransitStopsMock } = vi.hoisted(() => ({
  fetchTransitStopsMock: vi.fn(),
}));

vi.mock('@/lib/transit-api', () => ({
  fetchTransitStops: fetchTransitStopsMock,
}));

import { GET } from '@/app/api/transit/stops/route';

describe('GET /api/transit/stops', () => {
  beforeEach(() => {
    fetchTransitStopsMock.mockReset();
  });

  it('returns transit stop payload', async () => {
    fetchTransitStopsMock.mockResolvedValue({
      mode: 'bus',
      stops: [{ id: 'BUS:1', name: 'Stop', externalId: '1' }],
      generatedAt: '2026-03-10T00:00:00.000Z',
    });

    const response = await GET(new Request('http://localhost/api/transit/stops?mode=bus') as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(fetchTransitStopsMock).toHaveBeenCalledWith('bus');
    expect(payload.mode).toBe('bus');
  });

  it('returns 400 when mode is invalid', async () => {
    const response = await GET(new Request('http://localhost/api/transit/stops?mode=metro') as never);
    expect(response.status).toBe(400);
  });
});
