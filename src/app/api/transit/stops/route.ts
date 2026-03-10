import { NextRequest, NextResponse } from 'next/server';
import { fetchTransitStops } from '@/lib/transit-api';
import { parseTransitMode } from '../_lib';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const mode = parseTransitMode(new URL(request.url).searchParams.get('mode'));

  if (!mode) {
    return NextResponse.json({ error: 'Invalid mode. Use bus or tram.' }, { status: 400 });
  }

  try {
    const payload = await fetchTransitStops(mode);
    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[API Transit Stops] Error fetching stops:', error);
    return NextResponse.json({ error: 'Failed to fetch transit stops' }, { status: 500 });
  }
}
