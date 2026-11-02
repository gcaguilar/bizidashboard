import { createFileRoute } from '@tanstack/react-router'
import { globalAccountRepository } from '@/lib/accounts/global-account-repository'
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

        // A locally revoked account must not be able to export its still-valid
        // Auth0 token. Re-check the active account on every credential export.
        try {
          const account = await globalAccountRepository.resolveActiveAccountByAuth0Subject(
            session.auth0Subject
          )
          if (!account) {
            return Response.json({ error: 'Login required.' }, { status: 401 })
          }
        } catch {
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
