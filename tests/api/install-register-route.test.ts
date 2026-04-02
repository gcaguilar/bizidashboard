import { beforeEach, describe, expect, it, vi } from 'vitest';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.APP_URL = 'https://datosbizi.com';

const {
  createInstallMock,
  consumeRateLimitMock,
  recordSecurityEventMock,
} = vi.hoisted(() => ({
  createInstallMock: vi.fn(),
  consumeRateLimitMock: vi.fn(),
  recordSecurityEventMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    install: {
      create: createInstallMock,
    },
  },
  getCity: () => 'zaragoza',
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

import { OPTIONS, POST } from '@/app/api/install/register/route';

function allowDecision() {
  return {
    allowed: true,
    limit: 10,
    remaining: 9,
    resetAt: Date.now() + 60_000,
    retryAfterSeconds: 0,
    backend: 'redis' as const,
  };
}

describe('POST /api/install/register', () => {
  beforeEach(() => {
    createInstallMock.mockReset();
    consumeRateLimitMock.mockReset();
    recordSecurityEventMock.mockReset();
    consumeRateLimitMock.mockResolvedValue(allowDecision());
    createInstallMock.mockResolvedValue({});
  });

  it('stores hashed token data and returns the raw refresh token', async () => {
    const response = await POST(
      new Request('http://localhost/api/install/register', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://datosbizi.com',
        },
        body: JSON.stringify({
          platform: 'ios',
          appVersion: '1.2.3',
          osVersion: '18.0',
          publicKey: 'QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo9QUJDREVGR0g=',
        }),
      }) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.installId).toBeTruthy();
    expect(payload.refreshToken).toBeTruthy();
    expect(response.headers.get('access-control-allow-origin')).toBe('https://datosbizi.com');
    expect(createInstallMock).toHaveBeenCalledTimes(1);
    expect(createInstallMock.mock.calls[0]?.[0]?.data.publicKeyFingerprint).toHaveLength(64);
    expect(createInstallMock.mock.calls[0]?.[0]?.data.refreshTokenHash).toHaveLength(64);
    expect(createInstallMock.mock.calls[0]?.[0]?.data.refreshTokenHash).not.toBe(payload.refreshToken);
  });

  it('rejects disallowed browser origins', async () => {
    const response = await POST(
      new Request('http://localhost/api/install/register', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://evil.example',
        },
        body: JSON.stringify({
          platform: 'ios',
          appVersion: '1.2.3',
          osVersion: '18.0',
          publicKey: 'QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo9QUJDREVGR0g=',
        }),
      }) as never
    );

    expect(response.status).toBe(403);
    expect(createInstallMock).not.toHaveBeenCalled();
  });

  it('returns 429 when the shared rate limiter blocks the request', async () => {
    let callCount = 0;
    consumeRateLimitMock.mockImplementation(async () => {
      callCount += 1;
      return {
        allowed: callCount < 2,
        limit: 10,
        remaining: 0,
        resetAt: Date.now() + 60_000,
        retryAfterSeconds: 60,
        backend: 'redis',
      };
    });

    const response = await POST(
      new Request('http://localhost/api/install/register', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'android',
          appVersion: '1.2.3',
          osVersion: '14',
          publicKey: 'QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo9QUJDREVGR0g=',
        }),
      }) as never
    );

    expect(response.status).toBe(429);
    expect(recordSecurityEventMock).toHaveBeenCalled();
  });
});

describe('OPTIONS /api/install/register', () => {
  it('returns allowlisted CORS headers', async () => {
    const response = await OPTIONS(
      new Request('http://localhost/api/install/register', {
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

