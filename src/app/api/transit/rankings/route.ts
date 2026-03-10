import { NextRequest, NextResponse } from 'next/server';
import { fetchTransitRankings } from '@/lib/transit-api';
import { parsePositiveInteger, parseTransitMode } from '../_lib';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = new URL(request.url).searchParams;
  const mode = parseTransitMode(searchParams.get('mode'));
  const limit = parsePositiveInteger(searchParams.get('limit'), 50);

  if (!mode) {
    return NextResponse.json({ error: 'Invalid mode. Use bus or tram.' }, { status: 400 });
  }

  if (limit === null) {
    return NextResponse.json({ error: 'Invalid limit. Provide a positive integer.' }, { status: 400 });
  }

  try {
    const payload = await fetchTransitRankings(mode, limit);
    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[API Transit Rankings] Error fetching rankings:', error);
    return NextResponse.json({ error: 'Failed to fetch transit rankings' }, { status: 500 });
  }
}
