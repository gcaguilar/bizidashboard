import { NextRequest, NextResponse } from 'next/server';
import { getActiveAlerts } from '@/analytics/queries/read';
import { withCache } from '@/lib/cache/cache';

export const dynamic = 'force-dynamic';

const CACHE_TTL_SECONDS = 300;
const DEFAULT_LIMIT = 50;

function parseLimit(value: string | null, fallback: number): number | null {
  if (value === null) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const limit = parseLimit(searchParams.get('limit'), DEFAULT_LIMIT);

  if (limit === null) {
    return NextResponse.json(
      { error: 'Invalid limit. Provide a positive integer.' },
      { status: 400 }
    );
  }

  try {
    const cacheKey = `alerts:limit=${limit}`;
    const payload = await withCache(cacheKey, CACHE_TTL_SECONDS, async () => {
      const alerts = await getActiveAlerts(limit);
      return {
        limit,
        alerts,
        generatedAt: new Date().toISOString(),
      };
    });

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[API Alerts] Error fetching alerts:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch alerts',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
