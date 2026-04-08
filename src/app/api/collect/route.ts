import { NextResponse } from 'next/server';
import { getJobState, isCollectionScheduled, runCollection } from '@/jobs/bizi-collection';
import { logger } from '@/lib/logger';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { recordSecurityEvent } from '@/lib/security/audit';
import { withApiRequest } from '@/lib/security/http';
import { enforceOperationalAccess } from '@/lib/security/ops-api';

const DEFAULT_RATE_LIMIT_MAX = 6;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;

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

function getRateLimitConfig(): { max: number; windowMs: number } {
  return {
    max: readPositiveInteger(process.env.COLLECT_RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_MAX),
    windowMs: readPositiveInteger(
      process.env.COLLECT_RATE_LIMIT_WINDOW_MS,
      DEFAULT_RATE_LIMIT_WINDOW_MS
    ),
  };
}

export async function POST(request: Request): Promise<Response> {
  return withApiRequest(
    request,
    {
      route: '/api/collect',
      routeGroup: 'ops.collect',
    },
    async ({ requestId, clientIp, userAgent }) => {
      const { max, windowMs } = getRateLimitConfig();
      const access = await enforceOperationalAccess({
        request,
        clientIp,
        namespace: 'collect',
        limit: max,
        windowMs,
        unauthorizedError: 'Unauthorized collect trigger.',
        rateLimitError: 'Too many requests for /api/collect.',
        misconfiguredError:
          'Server misconfigured: OPS_API_KEY or COLLECT_API_KEY is required.',
      });

      if ('response' in access) {
        const status = access.response.status;
        const eventType =
          status === 429 ? 'rate_limit_exceeded' : status === 401 ? 'auth_failed' : 'ops_unavailable';

        await recordSecurityEvent({
          eventType,
          route: '/api/collect',
          requestId,
          ip: clientIp,
          userAgent,
          outcome: status === 429 ? 'denied' : 'error',
          reasonCode: access.response.statusText || String(status),
        });

        return access.response;
      }

      try {
        const result = await runCollection({
          trigger: 'manual',
          requestId,
        });

        await recordSecurityEvent({
          eventType: 'manual_collect_triggered',
          route: '/api/collect',
          requestId,
          collectionId: result.collectionId,
          ip: clientIp,
          userAgent,
          outcome: result.success ? 'success' : 'error',
          metadata: {
            stationCount: result.stationCount,
            durationMs: result.duration,
          },
        });

        if (!result.success) {
          return NextResponse.json(
            {
              success: false,
              error: result.error ?? 'Collection failed',
              collectionId: result.collectionId,
              timestamp: new Date().toISOString(),
            },
            {
              status: 500,
              headers: access.headers,
            }
          );
        }

        return NextResponse.json(
          {
            success: true,
            collectionId: result.collectionId,
            stationCount: result.stationCount,
            recordedAt: toIsoString(result.recordedAt),
            quality: result.quality,
            duration: result.duration,
            warnings: result.warnings,
            timestamp: result.timestamp.toISOString(),
          },
          {
            headers: access.headers,
          }
        );
      } catch (error) {
        captureExceptionWithContext(error, {
          area: 'api.collect',
          operation: 'POST /api/collect',
          extra: {
            clientIp,
          },
        });
        logger.error('api.collect.post_failed', { error });

        return NextResponse.json(
          {
            success: false,
            error: 'Collection failed',
            timestamp: new Date().toISOString(),
          },
          {
            status: 500,
            headers: access.headers,
          }
        );
      }
    }
  );
}

export async function GET(request?: Request): Promise<Response> {
  const req = request ?? new Request('http://localhost/api/collect');
  return withApiRequest(
    req,
    {
      route: '/api/collect',
      routeGroup: 'ops.collect',
    },
    async ({ requestId, clientIp, userAgent }) => {
      const { max, windowMs } = getRateLimitConfig();
      const access = await enforceOperationalAccess({
        request: req,
        clientIp,
        namespace: 'collect',
        limit: max,
        windowMs,
        unauthorizedError: 'Unauthorized collect trigger.',
        rateLimitError: 'Too many requests for /api/collect.',
        misconfiguredError:
          'Server misconfigured: OPS_API_KEY or COLLECT_API_KEY is required.',
      });

      if ('response' in access) {
        await recordSecurityEvent({
          eventType: access.response.status === 429 ? 'rate_limit_exceeded' : 'auth_failed',
          route: '/api/collect',
          requestId,
          ip: clientIp,
          userAgent,
          outcome: 'denied',
          reasonCode: String(access.response.status),
        });
        return access.response;
      }

      const state = getJobState();

      return NextResponse.json(
        {
          lastRun: toIsoString(state.lastRun),
          lastSuccess: toIsoString(state.lastSuccess),
          consecutiveFailures: state.consecutiveFailures,
          totalRuns: state.totalRuns,
          totalSuccesses: state.totalSuccesses,
          isScheduled: isCollectionScheduled(),
        },
        {
          headers: access.headers,
        }
      );
    }
  );
}
