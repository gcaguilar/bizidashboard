import { NextRequest, NextResponse } from 'next/server';
import { getStationPredictions } from '@/lib/predictions';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';

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

  try {
    const payload = await getStationPredictions(stationId);

    if (!payload) {
      return NextResponse.json(
        {
          error: 'station not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    captureExceptionWithContext(error, {
      area: 'api.predictions',
      operation: 'GET /api/predictions',
      extra: { stationId },
    });
    console.error('[API Predictions] Error generating predictions:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate predictions',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
