import { createFileRoute } from '@tanstack/react-router'
import { getDeveloperSession, isDeveloperSessionConfigured } from '@/lib/auth/developer-session'
import { rejectCrossOriginRequest } from '@/lib/security/http'

export const Route = createFileRoute('/api/auth/access-token/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const originRejection = rejectCrossOriginRequest(request)
        if (originRejection) return originRejection

        if (!isDeveloperSessionConfigured()) {
          return Response.json({ error: 'Developer login is not configured.' }, { status: 503 })
        }

        const session = await getDeveloperSession()
        if (!session?.accessToken || !session.accessTokenExpiresAt) {
          return Response.json({ error: 'Login required.' }, { status: 401 })
        }

        if (session.accessTokenExpiresAt <= Date.now()) {
          return Response.json({ error: 'Access token expired.' }, { status: 401 })
        }

        return Response.json({
          accessToken: session.accessToken,
          expiresIn: Math.max(0, Math.floor((session.accessTokenExpiresAt - Date.now()) / 1000)),
        }, {
          headers: { 'Cache-Control': 'no-store' },
        })
      },
    },
  },
})
