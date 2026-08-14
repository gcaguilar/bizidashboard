/**
 * Session for the developer portal login (Auth0 Regular Web Application,
 * Authorization Code flow). Backed by TanStack Start's built-in sealed
 * (encrypted + signed) cookie session — not related to the mobile app's
 * install/JWT auth in src/lib/auth/jwt.ts.
 */

import { clearSession, getSession, updateSession, type SessionConfig } from '@tanstack/react-start/server';

type DeveloperSessionData = {
  auth0Subject: string;
  email: string;
  accessToken?: string;
  accessTokenExpiresAt?: number;
};

const SESSION_MAX_AGE_SECONDS = 60 * 60; // 1 hour

export function isDeveloperSessionConfigured(): boolean {
  const password = process.env.SESSION_SECRET?.trim();
  return !!password && password.length >= 32;
}

function getSessionConfig(): SessionConfig {
  const password = process.env.SESSION_SECRET?.trim();

  if (!password || password.length < 32) {
    throw new Error('SESSION_SECRET must be configured (min 32 chars) for developer login.');
  }

  return {
    password,
    name: 'bizi_dev_session',
    maxAge: SESSION_MAX_AGE_SECONDS,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    },
  };
}

export type DeveloperSession = {
  auth0Subject: string;
  email: string;
  accessToken?: string;
  accessTokenExpiresAt?: number;
};

export async function getDeveloperSession(): Promise<DeveloperSession | null> {
  const session = await getSession<DeveloperSessionData>(getSessionConfig());
  return session.data.auth0Subject && session.data.email
    ? {
        auth0Subject: session.data.auth0Subject,
        email: session.data.email,
        accessToken: session.data.accessToken,
        accessTokenExpiresAt: session.data.accessTokenExpiresAt,
      }
    : null;
}

export async function setDeveloperSession(
  identity: { auth0Subject: string; email: string },
  token?: { accessToken: string; expiresIn: number }
): Promise<void> {
  await updateSession<DeveloperSessionData>(getSessionConfig(), {
    auth0Subject: identity.auth0Subject,
    email: identity.email,
    accessToken: token?.accessToken,
    accessTokenExpiresAt: token ? Date.now() + token.expiresIn * 1000 : undefined,
  });
}

export async function clearDeveloperSession(): Promise<void> {
  await clearSession(getSessionConfig());
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
