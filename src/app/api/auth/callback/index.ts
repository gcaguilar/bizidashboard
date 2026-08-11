import { createFileRoute } from '@tanstack/react-router'
import { deleteCookie, getCookie } from '@tanstack/react-start/server'
import { exchangeAuthorizationCode, verifyIdToken } from '@/lib/auth/auth0-web'
import { setDeveloperSession } from '@/lib/auth/developer-session'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { getSiteUrl } from '@/lib/site'

const STATE_COOKIE = 'bizi_auth0_state'
const RETURN_TO_COOKIE = 'bizi_auth0_return_to'

function isSafeReturnTo(value: string | undefined): value is string {
  return !!value && value.startsWith('/') && !value.startsWith('//')
}

export const Route = createFileRoute('/api/auth/callback/')({
  server: {
    handlers: {
      GET: async (opts) => {
        const request = opts.request
        const url = new URL(request.url)
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state')

        const expectedState = getCookie(STATE_COOKIE)
        const returnToCookie = getCookie(RETURN_TO_COOKIE)
        const returnTo = isSafeReturnTo(returnToCookie) ? returnToCookie : '/developers'

        deleteCookie(STATE_COOKIE, { path: '/' })
        deleteCookie(RETURN_TO_COOKIE, { path: '/' })

        if (!code || !state || !expectedState || state !== expectedState) {
          return new Response('Invalid or expired login attempt. Please try again.', { status: 400 })
        }

        try {
          const tokens = await exchangeAuthorizationCode(code, `${getSiteUrl()}/api/auth/callback`)
          const identity = await verifyIdToken(tokens.id_token)

          if (!identity) {
            return new Response('Could not verify your identity (unverified email).', { status: 401 })
          }

          await setDeveloperSession(identity.email)

          return new Response(null, {
            status: 302,
            headers: { Location: returnTo },
          })
        } catch (error) {
          captureExceptionWithContext(error, {
            area: 'api.auth-callback',
            operation: 'GET /api/auth/callback',
          })
          logger.error('api.auth_callback.failed', { error })
          return new Response('Login failed. Please try again.', { status: 500 })
        }
      },
    },
  },
})
