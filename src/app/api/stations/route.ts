import { NextResponse } from 'next/server';
import { getStationsWithLatestStatus } from '@/analytics/queries/read';
import { withCache } from '@/lib/cache/cache';

export const dynamic = 'force-dynamic';

const CACHE_KEY = 'stations:current';
const CACHE_TTL_SECONDS = 300;

export async function GET(): Promise<NextResponse> {
  try {
    const payload = await withCache(CACHE_KEY, CACHE_TTL_SECONDS, async () => {
      const stations = await getStationsWithLatestStatus();
      return {
        stations,
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
    console.error('[API Stations] Error fetching stations:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch stations',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
