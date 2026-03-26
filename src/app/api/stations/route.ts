import { NextRequest, NextResponse } from 'next/server';
import { getStationsWithLatestStatus } from '@/analytics/queries/read';
import { withCache } from '@/lib/cache/cache';
import { resolveStationsDataState } from '@/lib/data-state';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { getSharedDatasetSnapshot } from '@/services/shared-data';

export const dynamic = 'force-dynamic';

const CACHE_KEY = 'stations:current';
const CACHE_TTL_SECONDS = 60;

function toCsv(
  stations: Array<{
    id: string;
    name: string;
    lat: number;
    lon: number;
    capacity: number;
    bikesAvailable: number;
    anchorsFree: number;
    recordedAt: string;
  }>
): string {
  const headers = ['stationId', 'stationName', 'lat', 'lon', 'capacity', 'bikesAvailable', 'anchorsFree', 'recordedAt'];
  const rows = stations.map((station) => [station.id, station.name, station.lat, station.lon, station.capacity, station.bikesAvailable, station.anchorsFree, station.recordedAt]);
  return [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');
}

export async function GET(request?: NextRequest): Promise<NextResponse> {
  try {
    const format = request ? new URL(request.url).searchParams.get('format') : null;
    const payload = await withCache(CACHE_KEY, CACHE_TTL_SECONDS, async () => {
      const [stations, dataset] = await Promise.all([
        getStationsWithLatestStatus(),
        getSharedDatasetSnapshot().catch(() => null),
      ]);
      return {
        stations,
        generatedAt: new Date().toISOString(),
        dataState: resolveStationsDataState({
          count: stations.length,
          coverage: dataset?.coverage,
          status: dataset?.pipeline,
        }),
      };
    });

    if (format === 'csv') {
      const csv = toCsv(payload.stations);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="stations-current.csv"',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=60',
        },
      });
    }

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    const format = request ? new URL(request.url).searchParams.get('format') : null;
    captureExceptionWithContext(error, {
      area: 'api.stations',
      operation: 'GET /api/stations',
      extra: {
        format,
      },
    });
    console.error('[API Stations] Error fetching stations:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch stations',
        timestamp: new Date().toISOString(),
        dataState: 'error',
      },
      { status: 500 }
    );
  }
}
