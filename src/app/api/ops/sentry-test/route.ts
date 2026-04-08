import { randomUUID } from 'node:crypto';
import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { withApiRequest } from '@/lib/security/http';
import { enforceOperationalAccess } from '@/lib/security/ops-api';

export const dynamic = 'force-dynamic';

const RATE_LIMIT_MAX = 6;
const RATE_LIMIT_WINDOW_MS = 60_000;

function resolveSentryDsnSource(): 'SENTRY_DSN' | 'NEXT_PUBLIC_SENTRY_DSN' | null {
  if (process.env.SENTRY_DSN?.trim()) {
    return 'SENTRY_DSN';
  }

  if (process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()) {
    return 'NEXT_PUBLIC_SENTRY_DSN';
  }

  return null;
}

export async function POST(request: Request): Promise<Response> {
  return withApiRequest(
    request,
    {
      route: '/api/ops/sentry-test',
      routeGroup: 'ops.sentry',
    },
    async ({ clientIp }) => {
      const access = await enforceOperationalAccess({
        request,
        clientIp,
        namespace: 'ops-sentry-test',
        limit: RATE_LIMIT_MAX,
        windowMs: RATE_LIMIT_WINDOW_MS,
        unauthorizedError: 'Unauthorized Sentry test trigger.',
        rateLimitError: 'Too many requests for /api/ops/sentry-test.',
        misconfiguredError:
          'Server misconfigured: OPS_API_KEY or COLLECT_API_KEY is required.',
      });

      if ('response' in access) {
        return access.response;
      }

      const dsnSource = resolveSentryDsnSource();

      if (!dsnSource) {
        return NextResponse.json(
          {
            success: false,
            error: 'Sentry DSN is not configured on the server runtime.',
            timestamp: new Date().toISOString(),
          },
          {
            status: 503,
            headers: {
              ...access.headers,
              'Cache-Control': 'no-store',
            },
          }
        );
      }

      const marker = randomUUID();
      const eventId = captureExceptionWithContext(
        new Error(`Manual Sentry probe from /api/ops/sentry-test (${marker})`),
        {
          area: 'api.ops.sentry-test',
          operation: 'POST /api/ops/sentry-test',
          extra: {
            marker,
            dsnSource,
          },
        }
      );
      const flushed = await Sentry.flush(2_000);

      logger.warn('api.ops.sentry_test.triggered', {
        eventId,
        flushed,
        dsnSource,
      });

      return NextResponse.json(
        {
          success: true,
          eventId,
          flushed,
          marker,
          dsnSource,
          timestamp: new Date().toISOString(),
        },
        {
          status: 202,
          headers: {
            ...access.headers,
            'Cache-Control': 'no-store',
          },
        }
      );
    }
  );
}
