import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { consumeRateLimitMock } = vi.hoisted(() => ({
  consumeRateLimitMock: vi.fn(),
}));

const { captureExceptionWithContextMock, flushMock } = vi.hoisted(() => ({
  captureExceptionWithContextMock: vi.fn(),
  flushMock: vi.fn(),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  consumeRateLimit: consumeRateLimitMock,
  getRateLimitHeaders: (decision: { limit: number; remaining: number; resetAt: number }) => ({
    'X-RateLimit-Limit': String(decision.limit),
    'X-RateLimit-Remaining': String(decision.remaining),
    'X-RateLimit-Reset': String(Math.ceil(decision.resetAt / 1000)),
  }),
}));

vi.mock('@/lib/sentry-reporting', () => ({
  captureExceptionWithContext: captureExceptionWithContextMock,
}));

vi.mock('@sentry/nextjs', () => ({
  flush: flushMock,
}));

import { POST } from '@/app/api/ops/sentry-test/route';

type EnvKey = 'OPS_API_KEY' | 'COLLECT_API_KEY' | 'SENTRY_DSN' | 'NEXT_PUBLIC_SENTRY_DSN';

const originalEnv: Record<EnvKey, string | undefined> = {
  OPS_API_KEY: process.env.OPS_API_KEY,
  COLLECT_API_KEY: process.env.COLLECT_API_KEY,
  SENTRY_DSN: process.env.SENTRY_DSN,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
};

function restoreEnvValue(key: EnvKey, value: string | undefined): void {
  const env = process.env as Record<string, string | undefined>;

  if (value === undefined) {
    delete env[key];
    return;
  }

  env[key] = value;
}

describe('POST /api/ops/sentry-test', () => {
  beforeEach(() => {
    captureExceptionWithContextMock.mockReset();
    flushMock.mockReset();
    consumeRateLimitMock.mockReset();

    delete process.env.OPS_API_KEY;
    delete process.env.COLLECT_API_KEY;
    delete process.env.SENTRY_DSN;
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;

    consumeRateLimitMock.mockResolvedValue({
      allowed: true,
      limit: 6,
      remaining: 5,
      resetAt: Date.now() + 60_000,
      retryAfterSeconds: 0,
      backend: 'bypass',
    });
    captureExceptionWithContextMock.mockReturnValue('evt_test_123');
    flushMock.mockResolvedValue(true);
  });

  afterAll(() => {
    restoreEnvValue('OPS_API_KEY', originalEnv.OPS_API_KEY);
    restoreEnvValue('COLLECT_API_KEY', originalEnv.COLLECT_API_KEY);
    restoreEnvValue('SENTRY_DSN', originalEnv.SENTRY_DSN);
    restoreEnvValue('NEXT_PUBLIC_SENTRY_DSN', originalEnv.NEXT_PUBLIC_SENTRY_DSN);
  });

  it('rejects requests without a valid ops key', async () => {
    process.env.OPS_API_KEY = 'top-secret';

    const response = await POST(
      new Request('http://localhost/api/ops/sentry-test', {
        method: 'POST',
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe('Unauthorized Sentry test trigger.');
    expect(captureExceptionWithContextMock).not.toHaveBeenCalled();
  });

  it('fails closed when no runtime DSN is configured', async () => {
    process.env.OPS_API_KEY = 'top-secret';

    const response = await POST(
      new Request('http://localhost/api/ops/sentry-test', {
        method: 'POST',
        headers: {
          'x-ops-api-key': 'top-secret',
        },
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error).toContain('Sentry DSN');
    expect(captureExceptionWithContextMock).not.toHaveBeenCalled();
  });

  it('captures and flushes a server-side Sentry probe', async () => {
    process.env.OPS_API_KEY = 'top-secret';
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://public@example.ingest.sentry.io/123';

    const response = await POST(
      new Request('http://localhost/api/ops/sentry-test', {
        method: 'POST',
        headers: {
          'x-ops-api-key': 'top-secret',
          'x-forwarded-for': '198.51.100.30',
        },
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload.success).toBe(true);
    expect(payload.eventId).toBe('evt_test_123');
    expect(payload.flushed).toBe(true);
    expect(payload.dsnSource).toBe('NEXT_PUBLIC_SENTRY_DSN');
    expect(captureExceptionWithContextMock).toHaveBeenCalledTimes(1);
    expect(flushMock).toHaveBeenCalledWith(2000);
  });
});
