import { createHash, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getCity } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  resolveRequestId,
  runWithExecutionContext,
  type ExecutionContext,
} from '@/lib/request-context';
import { getMobileAllowedHeaders, getMobileAllowedOrigins } from '@/lib/security/config';

function readHeader(
  headers: Headers,
  names: string[]
): string | null {
  for (const name of names) {
    const value = headers.get(name)?.trim();
    if (value) {
      return value;
    }
  }

  return null;
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');

  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  return (
    readHeader(headers, ['x-real-ip', 'cf-connecting-ip', 'fly-client-ip']) ??
    'unknown'
  );
}

export function hashSensitiveValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const salt =
    process.env.SIGNATURE_SECRET ||
    process.env.JWT_SECRET ||
    'bizidashboard-fallback-security-salt';

  return createHash('sha256').update(`${salt}:${value}`).digest('hex');
}

export function isApiKeyValid(
  providedApiKey: string | null | undefined,
  expectedApiKey: string
): boolean {
  if (!providedApiKey) {
    return false;
  }

  const providedBuffer = Buffer.from(providedApiKey);
  const expectedBuffer = Buffer.from(expectedApiKey);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function readOpsApiKey(headers: Headers): string | null {
  return readHeader(headers, ['x-ops-api-key', 'x-collect-api-key']);
}

export function readPublicApiKey(headers: Headers): string | null {
  return readHeader(headers, ['x-public-api-key']);
}

export type RequestExecution = {
  requestId: string;
  clientIp: string;
  userAgent: string | null;
  startedAt: number;
};

export async function withApiRequest<T extends Response>(
  request: Request | NextRequest,
  meta: Pick<ExecutionContext, 'route' | 'routeGroup'>,
  handler: (execution: RequestExecution) => Promise<T>
): Promise<T> {
  const requestId = resolveRequestId(request.headers);
  const clientIp = getClientIp(request.headers);
  const userAgent = request.headers.get('user-agent');
  const startedAt = Date.now();
  const context: ExecutionContext = {
    requestId,
    route: meta.route,
    routeGroup: meta.routeGroup,
    method: request.method,
    city: getCity(),
    ipHash: hashSensitiveValue(clientIp),
    userAgentHash: hashSensitiveValue(userAgent),
  };

  return runWithExecutionContext(context, async () => {
    logger.info('request.started', {
      route: meta.route,
      method: request.method,
    });

    try {
      const response = await handler({
        requestId,
        clientIp,
        userAgent,
        startedAt,
      });

      response.headers.set('X-Request-Id', requestId);
      logger.info('request.completed', {
        route: meta.route,
        method: request.method,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });

      return response;
    } catch (error) {
      logger.error('request.failed', {
        route: meta.route,
        method: request.method,
        durationMs: Date.now() - startedAt,
        error,
      });
      throw error;
    }
  });
}

export function buildMobileCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  const allowedOrigins = getMobileAllowedOrigins();

  if (!origin) {
    return {
      Vary: 'Origin',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': getMobileAllowedHeaders(),
    };
  }

  if (!allowedOrigins.includes(origin)) {
    return {};
  }

  return {
    Vary: 'Origin',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': getMobileAllowedHeaders(),
  };
}

export function rejectDisallowedMobileOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get('origin');

  if (!origin) {
    return null;
  }

  const allowedOrigins = getMobileAllowedOrigins();
  if (allowedOrigins.includes(origin)) {
    return null;
  }

  return NextResponse.json(
    { error: 'Origin not allowed' },
    {
      status: 403,
      headers: {
        Vary: 'Origin',
      },
    }
  );
}

