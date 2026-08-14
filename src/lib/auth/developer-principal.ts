/**
 * Resolves the two external developer credentials into one local Account.
 * Auth0 authenticates the person; the global identity schema controls whether
 * that person may use BiziDashboard and the current city.
 */

import { globalAccountRepository, type GlobalAccount } from '@/lib/accounts/global-account-repository';
import { getCity } from '@/lib/db';
import { verifyAuth0AccessToken } from '@/lib/auth/auth0-access-token';
import { getDeveloperSession, isDeveloperSessionConfigured } from '@/lib/auth/developer-session';

export type DeveloperPrincipal = Readonly<{
  account: GlobalAccount;
  authentication: 'session' | 'bearer';
  clientId: string | null;
  scopes: readonly string[];
}>;

function readBearerToken(headers: Headers): string | null {
  const value = headers.get('authorization');
  if (!value) return null;
  const match = /^Bearer\s+(.+)$/i.exec(value.trim());
  return match?.[1]?.trim() || null;
}

async function accountCanUseCurrentCity(account: GlobalAccount): Promise<boolean> {
  return globalAccountRepository.hasCityAccess(account.id, getCity());
}

/**
 * Resolves an Auth0 bearer token. A first valid OAuth use provisions the same
 * local account as the web callback and grants the current public city.
 */
export async function resolveBearerDeveloperPrincipal(
  headers: Headers
): Promise<DeveloperPrincipal | null> {
  const accessToken = readBearerToken(headers);
  if (!accessToken) return null;

  const verified = await verifyAuth0AccessToken(accessToken);
  if (!verified) return null;

  try {
    const account = await globalAccountRepository.provisionVerifiedAccount({
      auth0Subject: verified.auth0Subject,
    });
    await globalAccountRepository.grantCityAccess(account.id, getCity());

    return {
      account,
      authentication: 'bearer',
      clientId: verified.clientId,
      scopes: verified.scopes,
    };
  } catch {
    return null;
  }
}

/** Resolves the sealed dashboard session to its active global account. */
export async function resolveSessionDeveloperPrincipal(): Promise<DeveloperPrincipal | null> {
  if (!isDeveloperSessionConfigured()) return null;

  try {
    const session = await getDeveloperSession();
    if (!session) return null;

    const account = await globalAccountRepository.resolveActiveAccountByAuth0Subject(
      session.auth0Subject
    );
    if (!account || !(await accountCanUseCurrentCity(account))) return null;

    return {
      account,
      authentication: 'session',
      clientId: null,
      scopes: ['manage:keys'],
    };
  } catch {
    return null;
  }
}

/** Standard developer portal guard using the shared Account identity. */
export async function requireDeveloperAccountSession(
  headers: HeadersInit
): Promise<{ principal: DeveloperPrincipal } | { response: Response }> {
  if (!isDeveloperSessionConfigured()) {
    return {
      response: new Response(JSON.stringify({ error: 'Developer login is not configured.' }), {
        status: 503,
        headers,
      }),
    };
  }

  const principal = await resolveSessionDeveloperPrincipal();
  if (!principal) {
    return {
      response: new Response(JSON.stringify({ error: 'Login required.' }), {
        status: 401,
        headers,
      }),
    };
  }

  return { principal };
}
