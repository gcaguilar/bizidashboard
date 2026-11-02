import { createFileRoute } from '@tanstack/react-router'
import { deleteCookie, getCookie } from '@tanstack/react-start/server'
import { exchangeAuthorizationCode, verifyIdToken } from '@/lib/auth/auth0-web'
import { setDeveloperSession } from '@/lib/auth/developer-session'
import { verifyOAuthState } from '@/lib/auth/oauth-state'
import { isSafeReturnTo } from '@/lib/auth/return-to'
import { globalAccountRepository } from '@/lib/accounts/global-account-repository'
import { getCity } from '@/lib/db'
import { claimLegacyApiKeysForAccount } from '@/lib/security/api-keys'
import { getClientIp } from '@/lib/security/http'
import { consumeRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logger'
import { captureExceptionWithContext } from '@/lib/sentry-reporting'
import { getRequestSiteUrl } from '@/lib/site'

const STATE_COOKIE = 'bizi_auth0_state'
const RETURN_TO_COOKIE = 'bizi_auth0_return_to'
const NONCE_COOKIE = 'bizi_auth0_nonce'
const CALLBACK_RATE_LIMIT = { limit: 20, windowMs: 60_000 }

function textResponse(body: string, status: number, headers?: Record<string, string>): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', ...headers } })
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

        if (!code || !state || !expectedState || !expectedNonce) {
          return textResponse('Invalid or expired login attempt. Please try again.', 400)
        }

        const stateFromQuery = verifyOAuthState(state)
        const stateFromCookie = verifyOAuthState(expectedState)
        if (!stateFromQuery || !stateFromCookie || stateFromQuery !== stateFromCookie) {
          return textResponse('Invalid or expired login attempt. Please try again.', 400)
        }

        const rateLimit = await consumeRateLimit({
          namespace: 'auth-callback:ip',
          identifierParts: [getClientIp(request.headers)],
          limit: CALLBACK_RATE_LIMIT.limit,
          windowMs: CALLBACK_RATE_LIMIT.windowMs,
        })
        if (!rateLimit.allowed) {
          return textResponse('Too many login attempts. Please try again later.', 429, {
            'Retry-After': String(rateLimit.retryAfterSeconds),
          })
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
