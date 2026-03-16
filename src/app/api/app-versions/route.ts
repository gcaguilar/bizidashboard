import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export type AppVersion = {
  version: string;
  allowed: boolean;
  reason?: string;
};

export type AppVersionsResponse = {
  minVersion: string;
  maxVersion: string;
  versions: AppVersion[];
};

const APP_VERSIONS: AppVersionsResponse = {
  minVersion: '1.0.0',
  maxVersion: '999.999.999',
  versions: [
    { version: '1.0.0', allowed: true },
    { version: '1.0.1', allowed: true },
    { version: '1.0.2', allowed: true },
    { version: '1.1.0', allowed: true },
    { version: '1.1.1', allowed: true },
    { version: '1.2.0', allowed: true },
  ],
};

export async function GET(): Promise<NextResponse<AppVersionsResponse>> {
  return NextResponse.json(APP_VERSIONS, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
