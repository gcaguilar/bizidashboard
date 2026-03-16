import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { reverseGeocode, type GeoReverseResult } from '@/lib/geo/nominatim';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

type GeoReverseRequest = {
  lat: number;
  lon: number;
};

type GeoReverseResponse = GeoReverseResult;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Installation-Id',
};

async function verifyAuth(request: NextRequest): Promise<{ valid: boolean; installId?: string; error?: string }> {
  const authHeader = request.headers.get('authorization');
  const installId = request.headers.get('x-installation-id');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid Authorization header' };
  }

  if (!installId) {
    return { valid: false, error: 'Missing X-Installation-Id header' };
  }

  const token = authHeader.substring(7);
  const payload = await verifyAccessToken(token);

  if (!payload || payload.installId !== installId) {
    return { valid: false, error: 'Invalid or expired token' };
  }

  const install = await prisma.install.findUnique({
    where: { installId },
  });

  if (!install || !install.isActive) {
    return { valid: false, error: 'Installation not found or inactive' };
  }

  return { valid: true, installId };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const body = (await request.json()) as GeoReverseRequest;

    if (!Number.isFinite(body.lat) || !Number.isFinite(body.lon)) {
      return NextResponse.json(
        { error: 'Invalid lat/lon coordinates' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (body.lat < -90 || body.lat > 90 || body.lon < -180 || body.lon > 180) {
      return NextResponse.json(
        { error: 'Coordinates out of range' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const result = await reverseGeocode(body.lat, body.lon);

    return NextResponse.json(result, {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, max-age=3600, s-maxage=2592000',
      },
    });
  } catch (error) {
    console.error('[API Geo Reverse] Error:', error);
    return NextResponse.json(
      { error: 'Failed to reverse geocode' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, { status: 200, headers: CORS_HEADERS });
}
