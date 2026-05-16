import { createFileRoute } from '@tanstack/react-router'
import { isRecord, tryParseJson } from '@/lib/json'
import { withPublicApiRoute } from '@/lib/security/public-api-route'
import { logger } from '@/lib/logger'

export type AppVersion = { version: string; allowed: boolean; reason?: string }
export type AppVersionsResponse = { minVersion: string; maxVersion: string; versions: AppVersion[] }

const DEFAULT_APP_VERSIONS: AppVersionsResponse = { minVersion: '1.0.0', maxVersion: '999.999.999', versions: [] }

function isAppVersion(value: unknown): value is AppVersion {
  return isRecord(value) && typeof value.version === 'string' && typeof value.allowed === 'boolean' && (value.reason === undefined || typeof value.reason === 'string')
}

function isAppVersionsResponse(value: unknown): value is AppVersionsResponse {
  return isRecord(value) && typeof value.minVersion === 'string' && typeof value.maxVersion === 'string' && Array.isArray(value.versions) && value.versions.every(isAppVersion)
}

function parseAppVersions(): AppVersionsResponse {
  const env = process.env.APP_VERSIONS
  if (!env) return DEFAULT_APP_VERSIONS
  try {
    const parsed = tryParseJson(env)
    if (parsed.ok && isAppVersionsResponse(parsed.value)) return parsed.value
  } catch {
    logger.warn('api.app_versions.invalid_config')
    return DEFAULT_APP_VERSIONS
  }
}

const APP_VERSIONS = parseAppVersions()

export const Route = createFileRoute('/api/app-versions/')({
  server: {
    handlers: {
      GET: withPublicApiRoute(
        {
          route: '/api/app-versions',
          routeGroup: 'api.app-versions',
          namespace: 'public-app-versions',
          limit: 30,
          windowMs: 60_000,
          requireApiKey: false,
          cacheControl: 'public, max-age=3600, s-maxage=86400',
        },
        ({ access }) => {
          return new Response(JSON.stringify(APP_VERSIONS), { status: 200, headers: { 'Content-Type': 'application/json', ...access.headers } })
        }
      ),
    },
  },
})
