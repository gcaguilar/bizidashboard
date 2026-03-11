import { NextRequest, NextResponse } from 'next/server';
import { getEmptyStationPredictions } from '@/lib/predictions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const stationId = new URL(request.url).searchParams.get('stationId')?.trim() ?? '';

  if (!stationId) {
    return NextResponse.json(
      {
        error: 'stationId is required',
      },
      { status: 400 }
    );
  }

  return NextResponse.json(getEmptyStationPredictions(stationId), {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=60',
    },
  });
}
