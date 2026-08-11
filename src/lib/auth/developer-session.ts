/**
 * Session for the developer portal login (Auth0 Regular Web Application,
 * Authorization Code flow). Backed by TanStack Start's built-in sealed
 * (encrypted + signed) cookie session — not related to the mobile app's
 * install/JWT auth in src/lib/auth/jwt.ts.
 */

import { clearSession, getSession, updateSession, type SessionConfig } from '@tanstack/react-start/server';

type DeveloperSessionData = {
  email: string;
};

const SESSION_MAX_AGE_SECONDS = 60 * 60; // 1 hour

function getSessionConfig(): SessionConfig {
  const password = process.env.SESSION_SECRET?.trim();

  if (!password || password.length < 32) {
    throw new Error('SESSION_SECRET must be configured (min 32 chars) for developer login.');
  }

  return {
    password,
    name: 'bizi_dev_session',
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function getDeveloperSession(): Promise<{ email: string } | null> {
  const session = await getSession<DeveloperSessionData>(getSessionConfig());
  return session.data.email ? { email: session.data.email } : null;
}

export async function setDeveloperSession(email: string): Promise<void> {
  await updateSession<DeveloperSessionData>(getSessionConfig(), { email });
}

export async function clearDeveloperSession(): Promise<void> {
  await clearSession(getSessionConfig());
}
