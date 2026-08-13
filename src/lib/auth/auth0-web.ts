/**
 * Auth0 Regular Web Application (Authorization Code flow) used to log
 * developers into the portal where they mint their own API keys. The session
 * it establishes only gates key management — API calls themselves authenticate
 * with the x-api-key header, never with this login.
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';

let idTokenJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

export function getDomain(): string {
  const domain = process.env.AUTH0_LOGIN_DOMAIN?.trim() || process.env.AUTH0_DOMAIN?.trim();
  if (!domain) {
    throw new Error('AUTH0_DOMAIN is required for developer login.');
  }
  return domain;
}

export function getClientId(): string {
  const clientId = process.env.AUTH0_LOGIN_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error('AUTH0_LOGIN_CLIENT_ID is required for developer login.');
  }
  return clientId;
}

function getClientSecret(): string {
  const secret = process.env.AUTH0_LOGIN_CLIENT_SECRET?.trim();
  if (!secret) {
    throw new Error('AUTH0_LOGIN_CLIENT_SECRET is required for developer login.');
  }
  return secret;
}

export function isDeveloperLoginConfigured(): boolean {
  return (
    !!(process.env.AUTH0_LOGIN_DOMAIN?.trim() || process.env.AUTH0_DOMAIN?.trim()) &&
    !!process.env.AUTH0_LOGIN_CLIENT_ID?.trim() &&
    !!process.env.AUTH0_LOGIN_CLIENT_SECRET?.trim()
  );
}

type TokenResponse = {
  id_token: string;
  access_token: string;
  expires_in: number;
};

export async function exchangeAuthorizationCode(
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  const domain = getDomain();

  const response = await fetch(`https://${domain}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: getClientId(),
      client_secret: getClientSecret(),
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange authorization code: ${response.status}`);
  }

  return (await response.json()) as TokenResponse;
}

export type DeveloperIdentity = {
  email: string;
};

export async function verifyIdToken(idToken: string, nonce: string): Promise<DeveloperIdentity | null> {
  const domain = getDomain();
  const clientId = getClientId();

  if (!idTokenJwks) {
    idTokenJwks = createRemoteJWKSet(new URL(`https://${domain}/.well-known/jwks.json`));
  }

  try {
    const { payload } = await jwtVerify(idToken, idTokenJwks, {
      issuer: `https://${domain}/`,
      audience: clientId,
    });

    if (payload.nonce !== nonce || typeof payload.email !== 'string' || payload.email_verified !== true) {
      return null;
    }

    return { email: payload.email };
  } catch {
    return null;
  }
}

export function getAuth0LogoutUrl(returnTo: string): string {
  const domain = getDomain();
  const url = new URL(`https://${domain}/v2/logout`);
  url.searchParams.set('client_id', getClientId());
  url.searchParams.set('returnTo', returnTo);
  return url.toString();
}
