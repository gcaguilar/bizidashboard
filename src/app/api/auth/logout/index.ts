import { createFileRoute } from '@tanstack/react-router'
import { getAuth0LogoutUrl, isDeveloperLoginConfigured } from '@/lib/auth/auth0-web'
import { clearDeveloperSession, isDeveloperSessionConfigured } from '@/lib/auth/developer-session'
import { getSiteUrl } from '@/lib/site'

export const Route = createFileRoute('/api/auth/logout/')({
  server: {
    handlers: {
      GET: async () => {
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
    },
  },
})
