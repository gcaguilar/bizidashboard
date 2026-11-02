import { isIP } from 'node:net';
import { getCity } from '@/lib/db';
import { logger } from '@/lib/logger';
import { updateExecutionContext } from '@/lib/request-context';
import { getRedisClient } from '@/lib/cache/redis';
import { captureWarningWithContext } from '@/lib/sentry-reporting';

export type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
  backend: 'redis' | 'bypass' | 'unavailable' | 'local';
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

/**
 * Collapse an IPv6 address to its /64 prefix so one host cannot multiply its
 * rate-limit budget by rotating addresses inside a delegated prefix. IPv4 and
 * non-IP identifiers are left as-is.
 */
function normalizeIdentifierPart(value: string | number | null | undefined): string {
  if (typeof value === 'string') {
    const candidate = value.trim();
    if (isIP(candidate) === 6 && !candidate.includes('.')) {
      const [head, tail] = candidate.split('::');
      const headGroups = head ? head.split(':') : [];
      const tailGroups = tail ? tail.split(':') : [];
      const missing = 8 - headGroups.length - tailGroups.length;
      if (missing >= 0) {
        const groups = [
          ...headGroups,
          ...Array.from({ length: missing }, () => '0'),
          ...tailGroups,
        ]
          .slice(0, 4)
          .map((group) => group.padStart(4, '0'));
        return `${groups.join(':')}::/64`;
      }
    }
  }

  return normalizeKeyPart(value);
}

export function getRateLimitHeaders(decision: RateLimitDecision): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(decision.limit),
    'X-RateLimit-Remaining': String(decision.remaining),
    'X-RateLimit-Reset': String(Math.ceil(decision.resetAt / 1000)),
  };
}

type LocalBucket = { count: number; resetAt: number };
const localBuckets = new Map<string, LocalBucket>();
const LOCAL_BUCKET_MAX_ENTRIES = 10_000;

function consumeLocalRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number
): RateLimitDecision {
  if (localBuckets.size >= LOCAL_BUCKET_MAX_ENTRIES) {
    for (const [entryKey, bucket] of localBuckets) {
      if (bucket.resetAt <= now) localBuckets.delete(entryKey);
    }
    if (localBuckets.size >= LOCAL_BUCKET_MAX_ENTRIES) localBuckets.clear();
  }

  const existing = localBuckets.get(key);
  const bucket = existing && existing.resetAt > now
    ? existing
    : { count: 0, resetAt: now + windowMs };
  bucket.count += 1;
  localBuckets.set(key, bucket);

  const allowed = bucket.count <= limit;
  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
    retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    backend: 'local',
  };
}

export async function consumeRateLimit(
  options: ConsumeRateLimitOptions
): Promise<RateLimitDecision> {
  const now = Date.now();
  const resetAt = now + options.windowMs;
  const key = [
    'ratelimit',
    getCity(),
    normalizeKeyPart(options.namespace),
    ...options.identifierParts.map((part) => normalizeIdentifierPart(part)),
  ].join(':');
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
      fallback: 'process-local',
    });

    captureWarningWithContext('Redis is unavailable: using the process-local rate-limit fallback', {
      area: 'security.rate-limit',
      operation: 'consumeRateLimit',
      tags: { namespace: options.namespace },
      dedupeKey: 'rate_limit.redis_unavailable',
    });

    return consumeLocalRateLimit(key, options.limit, options.windowMs, now);
  }

  // INCR y PTTL en un solo viaje (MULTI): cada peticion publica pasa por aqui,
  // incluidas las servidas de cache o con 304. Solo la primera de la ventana
  // (o una clave que perdio su TTL) necesita un segundo viaje para fijarlo.
  const [counterReply, ttlReply] = await client.multi().incr(key).pTTL(key).exec();
  const counter = Number(counterReply);

  let ttlMs = Number(ttlReply);
  if (!(ttlMs >= 0)) {
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

