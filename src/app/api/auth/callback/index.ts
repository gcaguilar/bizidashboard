import { createFileRoute } from '@tanstack/react-router'
import { deleteCookie, getCookie } from '@tanstack/react-start/server'
import { exchangeAuthorizationCode, verifyIdToken } from '@/lib/auth/auth0-web'
import { setDeveloperSession } from '@/lib/auth/developer-session'
import { globalAccountRepository } from '@/lib/accounts/global-account-repository'
import { getCity } from '@/lib/db'
import { claimLegacyApiKeysForAccount } from '@/lib/security/api-keys'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { getRequestSiteUrl } from '@/lib/site'

const STATE_COOKIE = 'bizi_auth0_state'
const RETURN_TO_COOKIE = 'bizi_auth0_return_to'
const NONCE_COOKIE = 'bizi_auth0_nonce'

function isSafeReturnTo(value: string | undefined): value is string {
  return !!value && value.startsWith('/') && !value.startsWith('//')
}

function textResponse(body: string, status: number): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
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
        const expectedNonce = getCookie(NONCE_COOKIE)
        const returnTo = isSafeReturnTo(returnToCookie) ? returnToCookie : '/developers'

        deleteCookie(STATE_COOKIE, { path: '/' })
        deleteCookie(RETURN_TO_COOKIE, { path: '/' })
        deleteCookie(NONCE_COOKIE, { path: '/' })

        if (!code || !state || !expectedState || !expectedNonce || state !== expectedState) {
          return textResponse('Invalid or expired login attempt. Please try again.', 400)
        }

        try {
          const tokens = await exchangeAuthorizationCode(code, `${getRequestSiteUrl(request)}/api/auth/callback`)
          const identity = await verifyIdToken(tokens.id_token, expectedNonce)

          if (!identity) {
            return textResponse('Could not verify your identity (unverified email).', 401)
          }

          const account = await globalAccountRepository.provisionVerifiedAccount(identity)
          await globalAccountRepository.grantCityAccess(account.id, getCity())
          await claimLegacyApiKeysForAccount(account.id, identity.email)

          await setDeveloperSession(identity, {
            accessToken: tokens.access_token,
            expiresIn: tokens.expires_in,
          })

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
          return textResponse('Login failed. Please try again.', 500)
        }
      },
    },
  },
})
