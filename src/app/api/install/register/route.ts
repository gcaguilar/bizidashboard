import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateRefreshToken } from '@/lib/auth/jwt';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

type InstallRegisterRequest = {
  platform: 'ios' | 'android';
  appVersion: string;
  osVersion: string;
  publicKey: string;
};

type InstallRegisterResponse = {
  installId: string;
  refreshToken: string;
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as InstallRegisterRequest;

    if (!body.platform || !body.appVersion || !body.osVersion || !body.publicKey) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, appVersion, osVersion, publicKey' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!['ios', 'android'].includes(body.platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be "ios" or "android"' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const installId = randomUUID();
    const refreshToken = await generateRefreshToken(installId);

    const install = await prisma.install.create({
      data: {
        installId,
        platform: body.platform,
        appVersion: body.appVersion,
        osVersion: body.osVersion,
        publicKey: body.publicKey,
        refreshToken,
        isActive: true,
      },
    });

    const response: InstallRegisterResponse = {
      installId: install.installId,
      refreshToken: install.refreshToken,
    };

    return NextResponse.json(response, { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    console.error('[API Install Register] Error:', error);
    return NextResponse.json(
      { error: 'Failed to register installation' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, { status: 200, headers: CORS_HEADERS });
}
