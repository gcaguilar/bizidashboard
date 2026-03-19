import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';

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
    console.error('[Health] Readiness check failed:', error);
    return false;
  }
}

export async function GET(): Promise<NextResponse> {
  const databaseReady = await isDatabaseReady();

  if (!databaseReady) {
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
