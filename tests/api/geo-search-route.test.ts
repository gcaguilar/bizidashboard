import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

process.env.APP_URL = 'https://datosbizi.com';

const {
  searchLocationsMock,
  verifyMobileRequestMock,
  consumeRateLimitMock,
  recordSecurityEventMock,
} = vi.hoisted(() => ({
  searchLocationsMock: vi.fn(),
  verifyMobileRequestMock: vi.fn(),
  consumeRateLimitMock: vi.fn(),
  recordSecurityEventMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  getCity: () => 'zaragoza',
}));

vi.mock('@/lib/geo/nominatim', () => ({
  searchLocations: searchLocationsMock,
}));

vi.mock('@/lib/security/mobile-auth', () => ({
  verifyMobileRequest: verifyMobileRequestMock,
}));

vi.mock('@/lib/security/rate-limit', () => ({
  consumeRateLimit: consumeRateLimitMock,
  getRateLimitHeaders: (decision: { limit: number; remaining: number; resetAt: number }) => ({
    'X-RateLimit-Limit': String(decision.limit),
    'X-RateLimit-Remaining': String(decision.remaining),
    'X-RateLimit-Reset': String(Math.ceil(decision.resetAt / 1000)),
  }),
}));

vi.mock('@/lib/security/audit', () => ({
  recordSecurityEvent: recordSecurityEventMock,
}));

import { OPTIONS, POST } from '@/app/api/geo/search/route';

function allowDecision() {
  return {
    allowed: true,
    limit: 60,
    remaining: 59,
    resetAt: Date.now() + 60_000,
    retryAfterSeconds: 0,
    backend: 'redis' as const,
  };
}

describe('POST /api/geo/search', () => {
  beforeEach(() => {
    searchLocationsMock.mockReset();
    verifyMobileRequestMock.mockReset();
    consumeRateLimitMock.mockReset();
    recordSecurityEventMock.mockReset();
    searchLocationsMock.mockResolvedValue([
      { id: '1', name: 'Centro', address: 'Zaragoza', lat: 41.65, lon: -0.88, type: 'place' },
    ]);
    verifyMobileRequestMock.mockResolvedValue({
      ok: true,
      installId: 'install-1',
    });
    consumeRateLimitMock.mockResolvedValue(allowDecision());
  });

  it('returns search results when auth succeeds', async () => {
    const response = await POST(
      new Request('http://localhost/api/geo/search', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          query: 'Centro',
          timestamp: Date.now(),
          signature: 'signed-request',
        }),
      }) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.results).toHaveLength(1);
    expect(searchLocationsMock).toHaveBeenCalledWith('Centro', 10);
  });

  it('bubbles up auth failures from the mobile auth layer', async () => {
    verifyMobileRequestMock.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'Invalid signature' }, { status: 401 }),
    });

    const response = await POST(
      new Request('http://localhost/api/geo/search', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          query: 'Centro',
          timestamp: Date.now(),
          signature: 'bad-signature',
        }),
      }) as never
    );

    expect(response.status).toBe(401);
  });

  it('returns 429 when geo search is rate limited', async () => {
    consumeRateLimitMock.mockResolvedValue({
      allowed: false,
      limit: 60,
      remaining: 0,
      resetAt: Date.now() + 60_000,
      retryAfterSeconds: 60,
      backend: 'redis',
    });

    const response = await POST(
      new Request('http://localhost/api/geo/search', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          query: 'Centro',
          timestamp: Date.now(),
          signature: 'signed-request',
        }),
      }) as never
    );

    expect(response.status).toBe(429);
    expect(recordSecurityEventMock).toHaveBeenCalled();
  });
});

describe('OPTIONS /api/geo/search', () => {
  it('returns allowlisted CORS headers', async () => {
    const response = await OPTIONS(
      new Request('http://localhost/api/geo/search', {
        method: 'OPTIONS',
        headers: {
          origin: 'https://datosbizi.com',
        },
      }) as never
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe('https://datosbizi.com');
  });
});

