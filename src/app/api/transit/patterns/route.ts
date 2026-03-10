import { NextRequest, NextResponse } from 'next/server';
import { fetchTransitPatterns } from '@/lib/transit-api';
import { parseTransitMode } from '../_lib';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = new URL(request.url).searchParams;
  const mode = parseTransitMode(searchParams.get('mode'));
  const transitStopId = searchParams.get('transitStopId');

  if (!mode) {
    return NextResponse.json({ error: 'Invalid mode. Use bus or tram.' }, { status: 400 });
  }

  if (!transitStopId) {
    return NextResponse.json({ error: 'transitStopId query parameter is required.' }, { status: 400 });
  }

  try {
    const payload = await fetchTransitPatterns(mode, transitStopId);
    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[API Transit Patterns] Error fetching patterns:', error);
    return NextResponse.json({ error: 'Failed to fetch transit patterns' }, { status: 500 });
  }
}
