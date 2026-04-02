import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { withApiRequest } from '@/lib/security/http';

export const dynamic = 'force-dynamic';

const COLLECTION_LAG_THRESHOLD_SECONDS = 600; // 10 minutes (allows for some missed internal cycles)

export async function GET(request?: Request): Promise<Response> {
  const req = request ?? new Request('http://localhost/api/health/live');
  return withApiRequest(
    req,
    {
      route: '/api/health/live',
      routeGroup: 'health.probe',
    },
    async () => {
      let dbStatus = 'ok';
      let pipelineStatus: 'ok' | 'lagging' | 'unknown' = 'unknown';

      try {
        await prisma.$queryRaw`SELECT 1`;

        const latest = await prisma.stationStatus.findFirst({
          orderBy: { recordedAt: 'desc' },
          select: { recordedAt: true }
        });

        if (!latest) {
          pipelineStatus = 'unknown';
        } else {
          const collectionLag = Math.floor((Date.now() - latest.recordedAt.getTime()) / 1000);
          pipelineStatus =
            collectionLag < COLLECTION_LAG_THRESHOLD_SECONDS ? 'ok' : 'lagging';
        }
      } catch (error) {
        captureExceptionWithContext(error, {
          area: 'api.health-live',
          operation: 'GET /api/health/live',
        });
        logger.error('api.health_live.failed', { error });
        dbStatus = 'error';
      }

      const isHealthy = dbStatus === 'ok' && pipelineStatus !== 'lagging';

      return NextResponse.json(
        {
          status: isHealthy ? 'ok' : 'error',
          ready: isHealthy,
          checks: {
            process: 'ok',
            database: dbStatus,
            pipeline: pipelineStatus,
          },
          uptimeSeconds: Math.floor(process.uptime()),
          timestamp: new Date().toISOString(),
        },
        {
          status: isHealthy ? 200 : 503,
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }
  );
}
