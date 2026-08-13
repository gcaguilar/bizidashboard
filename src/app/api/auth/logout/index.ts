import { createFileRoute } from '@tanstack/react-router'
import { getAuth0LogoutUrl, isDeveloperLoginConfigured } from '@/lib/auth/auth0-web'
import { clearDeveloperSession, isDeveloperSessionConfigured } from '@/lib/auth/developer-session'
import { getSiteUrl } from '@/lib/site'
import { rejectCrossOriginRequest } from '@/lib/security/http'

export const Route = createFileRoute('/api/auth/logout/')({
  server: {
    handlers: {
      POST: async (opts) => {
        const originRejection = rejectCrossOriginRequest(opts.request)
        if (originRejection) return originRejection

        if (isDeveloperSessionConfigured()) {
          await clearDeveloperSession()
        }

        if (!isDeveloperLoginConfigured()) {
          return new Response(null, { status: 302, headers: { Location: '/developers' } })
        }

        return new Response(null, {
          status: 302,
          headers: { Location: getAuth0LogoutUrl(`${getSiteUrl()}/developers`) },
        })
      },
      GET: () => new Response(JSON.stringify({ error: 'Use POST /api/auth/logout' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', Allow: 'POST' },
      }),
    },
  },
})
