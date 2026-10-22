import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getRedisClientMock, execMock, pExpireMock, multiMock } = vi.hoisted(() => {
  const execMock = vi.fn();
  const pExpireMock = vi.fn();
  const chain = {
    incr: vi.fn(() => chain),
    pTTL: vi.fn(() => chain),
    exec: execMock,
  };
  return {
    getRedisClientMock: vi.fn(),
    execMock,
    pExpireMock,
    multiMock: vi.fn(() => chain),
  };
});

vi.mock('@/lib/cache/redis', () => ({ getRedisClient: getRedisClientMock }));
vi.mock('@/lib/db', () => ({ getCity: () => 'zaragoza' }));
vi.mock('@/lib/request-context', () => ({ updateExecutionContext: vi.fn() }));
vi.mock('@/lib/sentry-reporting', () => ({ captureWarningWithContext: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));

import { consumeRateLimit } from '@/lib/security/rate-limit';

const OPTIONS = { namespace: 'public-test', identifierParts: ['1.2.3.4'], limit: 2, windowMs: 60_000 };

describe('redis rate limit', () => {
  beforeEach(() => {
    execMock.mockReset();
    pExpireMock.mockReset();
    multiMock.mockClear();
    getRedisClientMock.mockResolvedValue({ multi: multiMock, pExpire: pExpireMock });
  });

  it('counts and reads the ttl in a single round trip once the window exists', async () => {
    execMock.mockResolvedValue([2, 30_000]);

    const decision = await consumeRateLimit(OPTIONS);

    expect(multiMock).toHaveBeenCalledTimes(1);
    expect(pExpireMock).not.toHaveBeenCalled();
    expect(decision).toMatchObject({ allowed: true, remaining: 0, backend: 'redis' });
  });

  it('sets the window ttl on the first request of a window', async () => {
    execMock.mockResolvedValue([1, -1]);

    const decision = await consumeRateLimit(OPTIONS);

    expect(pExpireMock).toHaveBeenCalledWith('ratelimit:zaragoza:public-test:1_2_3_4', 60_000);
    expect(decision.allowed).toBe(true);
  });

  it('rejects past the limit with a retry-after from the remaining ttl', async () => {
    execMock.mockResolvedValue([3, 12_500]);

    const decision = await consumeRateLimit(OPTIONS);

    expect(decision).toMatchObject({ allowed: false, retryAfterSeconds: 13 });
  });
});
