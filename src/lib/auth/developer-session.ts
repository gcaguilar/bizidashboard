/**
 * Session for the developer portal login (Auth0 Regular Web Application,
 * Authorization Code flow). Backed by a sealed (encrypted + authenticated)
 * JWE cookie — not related to the mobile app's install/JWT auth in
 * src/lib/auth/jwt.ts.
 *
 * TanStack Start 1.169 removed its built-in session API (`getSession` /
 * `updateSession` / `clearSession`), so we own the sealed-cookie format here
 * using `jose` and Start's cookie primitives. The signing key is derived from
 * `SESSION_SECRET`; existing Start-sealed cookies use a different format and
 * are intentionally not readable, so users sign in again after the upgrade.
 */

import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server';
import { EncryptJWT, jwtDecrypt } from 'jose';

type DeveloperSessionData = {
  auth0Subject: string;
  email: string;
  accessToken?: string;
  accessTokenExpiresAt?: number;
};

const SESSION_COOKIE_NAME = 'bizi_dev_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60; // 1 hour

export function isDeveloperSessionConfigured(): boolean {
  const password = process.env.SESSION_SECRET?.trim();
  return !!password && password.length >= 32;
}

function requireSessionSecret(): string {
  const password = process.env.SESSION_SECRET?.trim();

  if (!password || password.length < 32) {
    throw new Error('SESSION_SECRET must be configured (min 32 chars) for developer login.');
  }

  return password;
}

async function getEncryptionKey(): Promise<Uint8Array> {
  const secret = requireSessionSecret();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return new Uint8Array(digest);
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}

export type DeveloperSession = {
  auth0Subject: string;
  email: string;
  accessToken?: string;
  accessTokenExpiresAt?: number;
};

export async function getDeveloperSession(): Promise<DeveloperSession | null> {
  const token = getCookie(SESSION_COOKIE_NAME);

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtDecrypt(token, await getEncryptionKey(), {
      keyManagementAlgorithms: ['dir'],
      contentEncryptionAlgorithms: ['A256GCM'],
    });
    const data = payload as unknown as DeveloperSessionData;

    return data.auth0Subject && data.email
      ? {
          auth0Subject: data.auth0Subject,
          email: data.email,
          accessToken: data.accessToken,
          accessTokenExpiresAt: data.accessTokenExpiresAt,
        }
      : null;
  } catch {
    return null;
  }
}

export async function setDeveloperSession(
  identity: { auth0Subject: string; email: string },
  token?: { accessToken: string; expiresIn: number }
): Promise<void> {
  const sealingKey = await getEncryptionKey();
  const sealed = await new EncryptJWT({
    auth0Subject: identity.auth0Subject,
    email: identity.email,
    accessToken: token?.accessToken,
    accessTokenExpiresAt: token ? Date.now() + token.expiresIn * 1000 : undefined,
  })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .encrypt(sealingKey);

  setCookie(SESSION_COOKIE_NAME, sealed, {
    ...getCookieOptions(),
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearDeveloperSession(): Promise<void> {
  deleteCookie(SESSION_COOKIE_NAME, getCookieOptions());
  return Promise.resolve();
}

/**
 * Shared gate for developer-portal routes: confirms login is configured and
 * an active session exists, returning the standard error Response for each
 * failure mode so every route rejects unauthenticated calls the same way.
 */
export async function requireDeveloperSession(
  headers: HeadersInit
): Promise<{ session: { auth0Subject: string; email: string } } | { response: Response }> {
  if (!isDeveloperSessionConfigured()) {
    return {
      response: new Response(JSON.stringify({ error: 'Developer login is not configured.' }), {
        status: 503,
        headers,
      }),
    };
  }

  const session = await getDeveloperSession();

  if (!session) {
    return {
      response: new Response(JSON.stringify({ error: 'Login required.' }), {
        status: 401,
        headers,
      }),
    };
  }

  return { session };
}
