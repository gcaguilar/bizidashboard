import { createFileRoute } from '@tanstack/react-router'
import { requireDeveloperSession } from '@/lib/auth/developer-session'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { listApiKeysForOwner, MAX_KEYS_PER_OWNER } from '@/lib/security/api-keys'

/**
 * Lists the logged-in developer's live keys so the portal can show what they
 * already hold. Never returns the secret — only the prefix and usage metadata.
 */
export const Route = createFileRoute('/api/developer/keys/')({
  server: {
    handlers: {
      GET: async () => {
        const baseHeaders = { 'Content-Type': 'application/json' }
        const sessionResult = await requireDeveloperSession(baseHeaders)

        if ('response' in sessionResult) {
          return sessionResult.response
        }

        try {
          const keys = await listApiKeysForOwner(sessionResult.session.email)

          return new Response(
            JSON.stringify({
              maxKeys: MAX_KEYS_PER_OWNER,
              keys: keys.map((key) => ({
                id: key.id,
                name: key.name,
                keyPrefix: key.keyPrefix,
                createdAt: key.createdAt,
                lastUsedAt: key.lastUsedAt,
                requestCount: key.requestCount,
              })),
            }),
            { status: 200, headers: baseHeaders }
          )
        } catch (error) {
          captureExceptionWithContext(error, {
            area: 'api.developer-keys',
            operation: 'GET /api/developer/keys',
          })
          logger.error('api.developer_keys.failed', { error })
          return new Response(JSON.stringify({ error: 'Failed to list API keys' }), {
            status: 500,
            headers: baseHeaders,
          })
        }
      },
    },
  },
})
