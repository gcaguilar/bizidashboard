import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

process.env.APP_URL = 'https://datosbizi.com';

const {
  reverseGeocodeMock,
  verifyMobileRequestMock,
  consumeRateLimitMock,
  recordSecurityEventMock,
} = vi.hoisted(() => ({
  reverseGeocodeMock: vi.fn(),
  verifyMobileRequestMock: vi.fn(),
  consumeRateLimitMock: vi.fn(),
  recordSecurityEventMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  getCity: () => 'zaragoza',
}));

vi.mock('@/lib/geo/nominatim', () => ({
  reverseGeocode: reverseGeocodeMock,
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

import { OPTIONS, POST } from '@/app/api/geo/reverse/route';

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

describe('POST /api/geo/reverse', () => {
  beforeEach(() => {
    reverseGeocodeMock.mockReset();
    verifyMobileRequestMock.mockReset();
    consumeRateLimitMock.mockReset();
    recordSecurityEventMock.mockReset();
    reverseGeocodeMock.mockResolvedValue({
      address: 'Plaza España',
      city: 'Zaragoza',
      lat: 41.65,
      lon: -0.88,
    });
    verifyMobileRequestMock.mockResolvedValue({
      ok: true,
      installId: 'install-1',
    });
    consumeRateLimitMock.mockResolvedValue(allowDecision());
  });

  it('returns reverse geocoding results when auth succeeds', async () => {
    const response = await POST(
      new Request('http://localhost/api/geo/reverse', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          lat: 41.65,
          lon: -0.88,
          timestamp: Date.now(),
          signature: 'signed-request',
        }),
      }) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.city).toBe('Zaragoza');
    expect(reverseGeocodeMock).toHaveBeenCalledWith(41.65, -0.88);
  });

  it('returns validation errors for out-of-range coordinates', async () => {
    const response = await POST(
      new Request('http://localhost/api/geo/reverse', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          lat: 120,
          lon: -0.88,
        }),
      }) as never
    );

    expect(response.status).toBe(400);
  });

  it('bubbles up auth failures from the mobile auth layer', async () => {
    verifyMobileRequestMock.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'Request timestamp expired' }, { status: 401 }),
    });

    const response = await POST(
      new Request('http://localhost/api/geo/reverse', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          lat: 41.65,
          lon: -0.88,
          timestamp: Date.now(),
          signature: 'bad-signature',
        }),
      }) as never
    );

    expect(response.status).toBe(401);
  });
});

describe('OPTIONS /api/geo/reverse', () => {
  it('returns allowlisted CORS headers', async () => {
    const response = await OPTIONS(
      new Request('http://localhost/api/geo/reverse', {
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

