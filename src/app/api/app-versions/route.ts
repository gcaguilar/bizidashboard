import { NextResponse } from 'next/server';
import { isRecord, tryParseJson } from '@/lib/json';
import { logger } from '@/lib/logger';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { withApiRequest } from '@/lib/security/http';
import { enforcePublicApiAccess } from '@/lib/security/public-api';

export const dynamic = 'force-dynamic';
const PUBLIC_ROUTE_RATE_LIMIT = {
  limit: 30,
  windowMs: 60_000,
};

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

function isAppVersion(value: unknown): value is AppVersion {
  return (
    isRecord(value) &&
    typeof value.version === 'string' &&
    typeof value.allowed === 'boolean' &&
    (value.reason === undefined || typeof value.reason === 'string')
  );
}

function isAppVersionsResponse(value: unknown): value is AppVersionsResponse {
  return (
    isRecord(value) &&
    typeof value.minVersion === 'string' &&
    typeof value.maxVersion === 'string' &&
    Array.isArray(value.versions) &&
    value.versions.every(isAppVersion)
  );
}

function parseAppVersions(): AppVersionsResponse {
  const env = process.env.APP_VERSIONS;

  if (!env) {
    return DEFAULT_APP_VERSIONS;
  }

  const parsed = tryParseJson(env);

  if (parsed.ok && isAppVersionsResponse(parsed.value)) {
    return parsed.value;
  }

  captureExceptionWithContext(
    parsed.ok
      ? new Error('APP_VERSIONS must match the expected response shape.')
      : parsed.error,
    {
      area: 'api.app-versions',
      operation: 'parseAppVersions',
    }
  );
  logger.warn('api.app_versions.invalid_config');
  return DEFAULT_APP_VERSIONS;
}

const APP_VERSIONS = parseAppVersions();

export async function GET(request: Request): Promise<NextResponse<AppVersionsResponse>> {
  return withApiRequest(
    request,
    {
      route: '/api/app-versions',
      routeGroup: 'public.api',
    },
    async ({ requestId, clientIp, userAgent }) => {
      const access = await enforcePublicApiAccess({
        route: '/api/app-versions',
        request,
        requestId,
        clientIp,
        userAgent,
        namespace: 'public-app-versions',
        limit: PUBLIC_ROUTE_RATE_LIMIT.limit,
        windowMs: PUBLIC_ROUTE_RATE_LIMIT.windowMs,
        requireApiKey: false,
      });

      if (!access.ok) {
        return access.response as NextResponse<AppVersionsResponse>;
      }

      return NextResponse.json(APP_VERSIONS, {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          ...access.headers,
        },
      });
    }
  );
}
