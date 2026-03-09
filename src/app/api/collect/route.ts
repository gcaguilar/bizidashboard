import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { runCollection, getJobState, isCollectionScheduled } from '@/jobs/bizi-collection';

const COLLECT_API_KEY_HEADER = 'x-collect-api-key';
const DEFAULT_RATE_LIMIT_MAX = 6;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;

type RateLimitState = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

const rateLimitByClient = new Map<string, RateLimitState>();

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function getCollectApiKey(): string | null {
  const rawKey = process.env.COLLECT_API_KEY;
  const apiKey = rawKey?.trim();
  return apiKey ? apiKey : null;
}

function getRateLimitConfig(): { max: number; windowMs: number } {
  return {
    max: readPositiveInteger(process.env.COLLECT_RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_MAX),
    windowMs: readPositiveInteger(
      process.env.COLLECT_RATE_LIMIT_WINDOW_MS,
      DEFAULT_RATE_LIMIT_WINDOW_MS
    ),
  };
}

function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');

  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();

    if (firstIp) {
      return firstIp;
    }
  }

  const fallbackHeaders = ['x-real-ip', 'cf-connecting-ip'];

  for (const header of fallbackHeaders) {
    const value = request.headers.get(header)?.trim();
    if (value) {
      return value;
    }
  }

  return 'unknown';
}

function consumeRateLimit(request: Request): RateLimitResult {
  const { max, windowMs } = getRateLimitConfig();
  const now = Date.now();
  const clientIdentifier = getClientIdentifier(request);
  const currentState = rateLimitByClient.get(clientIdentifier);

  if (!currentState || currentState.resetAt <= now) {
    const nextState: RateLimitState = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitByClient.set(clientIdentifier, nextState);

    return {
      allowed: true,
      limit: max,
      remaining: Math.max(0, max - nextState.count),
      resetAt: nextState.resetAt,
      retryAfterSeconds: 0,
    };
  }

  currentState.count += 1;
  rateLimitByClient.set(clientIdentifier, currentState);

  if (currentState.count > max) {
    return {
      allowed: false,
      limit: max,
      remaining: 0,
      resetAt: currentState.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((currentState.resetAt - now) / 1000)),
    };
  }

  return {
    allowed: true,
    limit: max,
    remaining: Math.max(0, max - currentState.count),
    resetAt: currentState.resetAt,
    retryAfterSeconds: 0,
  };
}

function getRateLimitHeaders(rateLimit: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(rateLimit.limit),
    'X-RateLimit-Remaining': String(rateLimit.remaining),
    'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetAt / 1000)),
  };
}

function isApiKeyValid(providedApiKey: string, expectedApiKey: string): boolean {
  const providedBuffer = Buffer.from(providedApiKey);
  const expectedBuffer = Buffer.from(expectedApiKey);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

function errorResponse(
  status: number,
  error: string,
  headers?: Record<string, string>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers,
    }
  );
}

export async function POST(request: Request) {
  console.log('[API] Collection triggered via POST /api/collect');

  const expectedApiKey = getCollectApiKey();

  if (process.env.NODE_ENV === 'production' && expectedApiKey === null) {
    return errorResponse(
      503,
      'Server misconfigured: COLLECT_API_KEY is required in production.'
    );
  }

  const rateLimit = consumeRateLimit(request);
  const rateLimitHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return errorResponse(429, 'Too many requests for /api/collect.', {
      ...rateLimitHeaders,
      'Retry-After': String(rateLimit.retryAfterSeconds),
    });
  }

  if (expectedApiKey !== null) {
    const providedApiKey = request.headers.get(COLLECT_API_KEY_HEADER)?.trim() ?? '';

    if (!isApiKeyValid(providedApiKey, expectedApiKey)) {
      return errorResponse(401, 'Unauthorized collect trigger.', rateLimitHeaders);
    }
  }

  try {
    const result = await runCollection();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error ?? 'Collection failed',
          timestamp: new Date().toISOString(),
        },
        {
          status: 500,
          headers: rateLimitHeaders,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        stationCount: result.stationCount,
        recordedAt: toIsoString(result.recordedAt),
        quality: result.quality,
        duration: result.duration,
        warnings: result.warnings,
        timestamp: result.timestamp.toISOString(),
      },
      {
        headers: rateLimitHeaders,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Collection failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: rateLimitHeaders,
      }
    );
  }
}

export async function GET() {
  const state = getJobState();

  return NextResponse.json({
    lastRun: toIsoString(state.lastRun),
    lastSuccess: toIsoString(state.lastSuccess),
    consecutiveFailures: state.consecutiveFailures,
    totalRuns: state.totalRuns,
    totalSuccesses: state.totalSuccesses,
    isScheduled: isCollectionScheduled(),
  });
}
