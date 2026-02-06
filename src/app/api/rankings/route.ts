import { NextRequest, NextResponse } from 'next/server';
import { getStationRankings, type RankingType } from '@/analytics/queries/read';
import { withCache } from '@/lib/cache/cache';

export const dynamic = 'force-dynamic';

const CACHE_TTL_SECONDS = 300;
const DEFAULT_LIMIT = 20;

function parseLimit(value: string | null, fallback: number): number | null {
  if (value === null) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get('type');
  const limit = parseLimit(searchParams.get('limit'), DEFAULT_LIMIT);

  if (typeParam !== 'turnover' && typeParam !== 'availability') {
    return NextResponse.json(
      { error: 'Invalid type. Use turnover or availability.' },
      { status: 400 }
    );
  }

  if (limit === null) {
    return NextResponse.json(
      { error: 'Invalid limit. Provide a positive integer.' },
      { status: 400 }
    );
  }

  try {
    const cacheKey = `rankings:type=${typeParam}:limit=${limit}`;
    const payload = await withCache(cacheKey, CACHE_TTL_SECONDS, async () => {
      const rankings = await getStationRankings(typeParam as RankingType, limit);
      return {
        type: typeParam,
        limit,
        rankings,
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
    console.error('[API Rankings] Error fetching rankings:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch rankings',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
