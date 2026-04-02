import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { withApiRequest } from '@/lib/security/http';

export const dynamic = 'force-dynamic';

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

async function isDatabaseReady(): Promise<boolean> {
  if (isBuildPhase()) {
    return true;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    captureExceptionWithContext(error, {
      area: 'api.health-ready',
      operation: 'GET /api/health/ready',
    });
    logger.error('api.health_ready.check_failed', { error });
    return false;
  }
}

export async function GET(request?: Request): Promise<Response> {
  const req = request ?? new Request('http://localhost/api/health/ready');
  return withApiRequest(
    req,
    {
      route: '/api/health/ready',
      routeGroup: 'health.probe',
    },
    async () => {
      const databaseReady = await isDatabaseReady();

      if (!databaseReady) {
        logger.warn('api.health_ready.degraded');
        return NextResponse.json(
          {
            status: 'degraded',
            ready: false,
            checks: {
              database: 'down',
            },
            timestamp: new Date().toISOString(),
          },
          {
            status: 503,
            headers: {
              'Cache-Control': 'no-store',
            },
          }
        );
      }

      return NextResponse.json(
        {
          status: 'ok',
          ready: true,
          checks: {
            database: 'ok',
          },
          timestamp: new Date().toISOString(),
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }
  );
}
