import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';

export const dynamic = 'force-dynamic';

const COLLECTION_LAG_THRESHOLD_SECONDS = 600; // 10 minutes (allows for some missed internal cycles)

export async function GET(): Promise<NextResponse> {
  let dbStatus = 'ok';
  let collectionLag: number | null = null;

  try {
    // Basic connectivity check
    await prisma.$queryRaw`SELECT 1`;

    // Freshness check
    const latest = await prisma.stationStatus.findFirst({
      orderBy: { recordedAt: 'desc' },
      select: { recordedAt: true }
    });

    if (latest) {
      collectionLag = Math.floor((Date.now() - latest.recordedAt.getTime()) / 1000);
    }
  } catch (error) {
    captureExceptionWithContext(error, {
      area: 'api.health-live',
      operation: 'GET /api/health/live',
    });
    console.error('[Health] Check failed:', error);
    dbStatus = 'error';
  }

  const isHealthy = dbStatus === 'ok' && (collectionLag === null || collectionLag < COLLECTION_LAG_THRESHOLD_SECONDS);

  return NextResponse.json(
    {
      status: isHealthy ? 'ok' : 'error',
      ready: isHealthy,
      checks: {
        process: 'ok',
        database: dbStatus,
        collectionLagSeconds: collectionLag,
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
