import { NextResponse } from 'next/server';
import { getOpsApiKey } from '@/lib/security/config';
import { isApiKeyValid, readOpsApiKey } from '@/lib/security/http';
import {
  consumeRateLimit,
  getRateLimitHeaders,
  type RateLimitDecision,
} from '@/lib/security/rate-limit';

type OperationalAccessOptions = {
  request: Request;
  clientIp: string;
  namespace: string;
  limit: number;
  windowMs: number;
  unauthorizedError: string;
  rateLimitError: string;
  misconfiguredError: string;
};

export type OperationalAccessResult =
  | {
      headers: Record<string, string>;
      providedKey: string;
      decision: RateLimitDecision;
    }
  | {
      response: NextResponse;
    };

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

export async function enforceOperationalAccess(
  options: OperationalAccessOptions
): Promise<OperationalAccessResult> {
  const expectedApiKey = getOpsApiKey();

  if (!expectedApiKey) {
    return {
      response: errorResponse(503, options.misconfiguredError),
    };
  }

  const providedKey = readOpsApiKey(options.request.headers) ?? '';
  const [ipDecision, keyDecision] = await Promise.all([
    consumeRateLimit({
      namespace: `${options.namespace}:ip`,
      identifierParts: [options.clientIp],
      limit: options.limit,
      windowMs: options.windowMs,
    }),
    consumeRateLimit({
      namespace: `${options.namespace}:key`,
      identifierParts: [providedKey || 'missing'],
      limit: options.limit,
      windowMs: options.windowMs,
    }),
  ]);

  const effectiveDecision = !ipDecision.allowed ? ipDecision : keyDecision;
  const headers = getRateLimitHeaders(effectiveDecision);

  if (effectiveDecision.backend === 'unavailable') {
    return {
      response: errorResponse(503, 'Rate limiting backend unavailable.', headers),
    };
  }

  if (!effectiveDecision.allowed) {
    return {
      response: errorResponse(429, options.rateLimitError, {
        ...headers,
        'Retry-After': String(effectiveDecision.retryAfterSeconds),
      }),
    };
  }

  if (!isApiKeyValid(providedKey, expectedApiKey)) {
    return {
      response: errorResponse(401, options.unauthorizedError, headers),
    };
  }

  return {
    headers,
    providedKey,
    decision: effectiveDecision,
  };
}
