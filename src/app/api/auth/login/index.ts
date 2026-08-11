import { randomBytes } from 'node:crypto'
import { createFileRoute } from '@tanstack/react-router'
import { setCookie } from '@tanstack/react-start/server'
import { getClientId, getDomain, isDeveloperLoginConfigured } from '@/lib/auth/auth0-web'
import { getSiteUrl } from '@/lib/site'

const STATE_COOKIE = 'bizi_auth0_state'
const RETURN_TO_COOKIE = 'bizi_auth0_return_to'
const STATE_COOKIE_MAX_AGE_SECONDS = 600

function isSafeReturnTo(value: string | null): value is string {
  return !!value && value.startsWith('/') && !value.startsWith('//')
}

export const Route = createFileRoute('/api/auth/login/')({
  server: {
    handlers: {
      GET: (opts) => {
        const request = opts.request

        if (!isDeveloperLoginConfigured()) {
          return new Response(JSON.stringify({ error: 'Developer login is not configured.' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const domain = getDomain()
        const clientId = getClientId()

        const requestedReturnTo = new URL(request.url).searchParams.get('returnTo')
        const returnTo = isSafeReturnTo(requestedReturnTo) ? requestedReturnTo : '/developers'
        const state = randomBytes(24).toString('base64url')

        setCookie(STATE_COOKIE, state, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: STATE_COOKIE_MAX_AGE_SECONDS,
        })
        setCookie(RETURN_TO_COOKIE, returnTo, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: STATE_COOKIE_MAX_AGE_SECONDS,
        })

        const authorizeUrl = new URL(`https://${domain}/authorize`)
        authorizeUrl.searchParams.set('response_type', 'code')
        authorizeUrl.searchParams.set('client_id', clientId)
        authorizeUrl.searchParams.set('redirect_uri', `${getSiteUrl()}/api/auth/callback`)
        authorizeUrl.searchParams.set('scope', 'openid email profile')
        authorizeUrl.searchParams.set('state', state)

        return new Response(null, {
          status: 302,
          headers: { Location: authorizeUrl.toString() },
        })
      },
    },
  },
})

export { RETURN_TO_COOKIE, STATE_COOKIE }
