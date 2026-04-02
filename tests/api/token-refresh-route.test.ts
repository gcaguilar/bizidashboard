import { beforeEach, describe, expect, it, vi } from 'vitest';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.APP_URL = 'https://datosbizi.com';

const {
  findUniqueMock,
  updateInstallMock,
  consumeRateLimitMock,
  recordSecurityEventMock,
} = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  updateInstallMock: vi.fn(),
  consumeRateLimitMock: vi.fn(),
  recordSecurityEventMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    install: {
      findUnique: findUniqueMock,
      update: updateInstallMock,
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

import { hashToken, issueRefreshToken } from '@/lib/auth/jwt';
import { OPTIONS, POST } from '@/app/api/token/refresh/route';

function allowDecision() {
  return {
    allowed: true,
    limit: 30,
    remaining: 29,
    resetAt: Date.now() + 60_000,
    retryAfterSeconds: 0,
    backend: 'redis' as const,
  };
}

describe('POST /api/token/refresh', () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    updateInstallMock.mockReset();
    consumeRateLimitMock.mockReset();
    recordSecurityEventMock.mockReset();
    consumeRateLimitMock.mockResolvedValue(allowDecision());
    updateInstallMock.mockResolvedValue({});
  });

  it('rotates the refresh token using its hash', async () => {
    const issued = await issueRefreshToken('install-1');
    findUniqueMock.mockResolvedValue({
      installId: 'install-1',
      isActive: true,
      revokedAt: null,
      refreshTokenHash: hashToken(issued.token),
    });

    const response = await POST(
      new Request('http://localhost/api/token/refresh', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: issued.token,
        }),
      }) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.accessToken).toBeTruthy();
    expect(payload.refreshToken).toBeTruthy();
    expect(payload.refreshToken).not.toBe(issued.token);
    expect(payload.expiresIn).toBe(900);
    expect(updateInstallMock).toHaveBeenCalledTimes(1);
    expect(updateInstallMock.mock.calls[0]?.[0]?.data.refreshTokenHash).toBe(
      hashToken(payload.refreshToken)
    );
  });

  it('revokes the installation when a reused refresh token is detected', async () => {
    const issued = await issueRefreshToken('install-2');
    findUniqueMock.mockResolvedValue({
      installId: 'install-2',
      isActive: true,
      revokedAt: null,
      refreshTokenHash: hashToken('different-token'),
    });

    const response = await POST(
      new Request('http://localhost/api/token/refresh', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: issued.token,
        }),
      }) as never
    );

    expect(response.status).toBe(401);
    expect(updateInstallMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isActive: false,
          revokedAt: expect.any(Date),
        }),
      })
    );
    expect(recordSecurityEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'token_reuse_detected',
      })
    );
  });

  it('returns 429 when the rate limiter blocks refresh attempts', async () => {
    consumeRateLimitMock.mockResolvedValue({
      allowed: false,
      limit: 30,
      remaining: 0,
      resetAt: Date.now() + 60_000,
      retryAfterSeconds: 60,
      backend: 'redis',
    });

    const response = await POST(
      new Request('http://localhost/api/token/refresh', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: 'fake-token-value',
        }),
      }) as never
    );

    expect(response.status).toBe(429);
  });
});

describe('OPTIONS /api/token/refresh', () => {
  it('returns allowlisted CORS headers', async () => {
    const response = await OPTIONS(
      new Request('http://localhost/api/token/refresh', {
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

