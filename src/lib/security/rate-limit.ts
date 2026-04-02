import { getCity } from '@/lib/db';
import { logger } from '@/lib/logger';
import { updateExecutionContext } from '@/lib/request-context';
import { getRedisClient } from '@/lib/cache/redis';

export type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
  backend: 'redis' | 'bypass' | 'unavailable';
};

type ConsumeRateLimitOptions = {
  namespace: string;
  identifierParts: Array<string | number | null | undefined>;
  limit: number;
  windowMs: number;
};

function normalizeKeyPart(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'unknown';
  }

  return String(value).replace(/[^a-zA-Z0-9:_-]/g, '_');
}

export function getRateLimitHeaders(decision: RateLimitDecision): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(decision.limit),
    'X-RateLimit-Remaining': String(decision.remaining),
    'X-RateLimit-Reset': String(Math.ceil(decision.resetAt / 1000)),
  };
}

export async function consumeRateLimit(
  options: ConsumeRateLimitOptions
): Promise<RateLimitDecision> {
  const now = Date.now();
  const resetAt = now + options.windowMs;
  const client = await getRedisClient();

  if (!client) {
    updateExecutionContext({
      cacheBackend: process.env.NODE_ENV === 'test' ? 'test-bypass' : 'redis-unavailable',
    });

    if (process.env.NODE_ENV === 'test') {
      return {
        allowed: true,
        limit: options.limit,
        remaining: options.limit - 1,
        resetAt,
        retryAfterSeconds: 0,
        backend: 'bypass',
      };
    }

    logger.warn('rate_limit.redis_unavailable', {
      namespace: options.namespace,
    });

    return {
      allowed: false,
      limit: options.limit,
      remaining: 0,
      resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil(options.windowMs / 1000)),
      backend: 'unavailable',
    };
  }

  const key = [
    'ratelimit',
    getCity(),
    normalizeKeyPart(options.namespace),
    ...options.identifierParts.map((part) => normalizeKeyPart(part)),
  ].join(':');

  const counter = await client.incr(key);

  if (counter === 1) {
    await client.pExpire(key, options.windowMs);
  }

  let ttlMs = await client.pTTL(key);
  if (ttlMs < 0) {
    ttlMs = options.windowMs;
    await client.pExpire(key, options.windowMs);
  }

  const decision: RateLimitDecision = {
    allowed: counter <= options.limit,
    limit: options.limit,
    remaining: Math.max(0, options.limit - counter),
    resetAt: now + ttlMs,
    retryAfterSeconds: counter <= options.limit ? 0 : Math.max(1, Math.ceil(ttlMs / 1000)),
    backend: 'redis',
  };

  updateExecutionContext({
    cacheBackend: 'redis',
    rateLimited: !decision.allowed,
  });

  return decision;
}

