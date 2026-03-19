import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/lib/auth/jwt';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';

export const dynamic = 'force-dynamic';

type TokenRefreshRequest = {
  refreshToken: string;
};

type TokenRefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const ACCESS_TOKEN_EXPIRY_SECONDS = 900; // 15 minutes

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as TokenRefreshRequest;

    if (!body.refreshToken) {
      return NextResponse.json(
        { error: 'Missing refreshToken' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const payload = await verifyRefreshToken(body.refreshToken);
    if (!payload || !payload.installId) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const install = await prisma.install.findUnique({
      where: { installId: payload.installId },
    });

    if (!install || !install.isActive) {
      return NextResponse.json(
        { error: 'Installation not found or inactive' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    if (install.refreshToken !== body.refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token revoked' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const newRefreshToken = await generateRefreshToken(install.installId);
    const accessToken = await generateAccessToken(install.installId);

    const updated = await prisma.install.updateMany({
      where: { installId: install.installId, refreshToken: body.refreshToken },
      data: { refreshToken: newRefreshToken },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { error: 'Refresh token already used' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const response: TokenRefreshResponse = {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
    };

    return NextResponse.json(response, { headers: CORS_HEADERS });
  } catch (error) {
    captureExceptionWithContext(error, {
      area: 'api.token-refresh',
      operation: 'POST /api/token/refresh',
    });
    console.error('[API Token Refresh] Error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, { status: 200, headers: CORS_HEADERS });
}
