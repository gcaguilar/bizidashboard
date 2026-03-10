import { NextRequest, NextResponse } from 'next/server';
import { fetchTransitStatus } from '@/lib/transit-api';
import { parseTransitMode } from '../_lib';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const mode = parseTransitMode(new URL(request.url).searchParams.get('mode'));

  if (!mode) {
    return NextResponse.json({ error: 'Invalid mode. Use bus or tram.' }, { status: 400 });
  }

  try {
    const payload = await fetchTransitStatus(mode);
    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[API Transit Status] Error fetching transit status:', error);
    return NextResponse.json({ error: 'Failed to fetch transit status' }, { status: 500 });
  }
}
