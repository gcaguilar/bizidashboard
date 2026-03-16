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

const DEFAULT_APP_VERSIONS: AppVersionsResponse = {
  minVersion: '1.0.0',
  maxVersion: '999.999.999',
  versions: [],
};

function parseAppVersions(): AppVersionsResponse {
  const env = process.env.APP_VERSIONS;
  
  if (!env) {
    return DEFAULT_APP_VERSIONS;
  }

  try {
    const parsed = JSON.parse(env) as AppVersionsResponse;
    return parsed;
  } catch {
    console.warn('[API App Versions] Invalid APP_VERSIONS JSON, using defaults');
    return DEFAULT_APP_VERSIONS;
  }
}

const APP_VERSIONS = parseAppVersions();

export async function GET(): Promise<NextResponse<AppVersionsResponse>> {
  return NextResponse.json(APP_VERSIONS, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
