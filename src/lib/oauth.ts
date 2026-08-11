import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

export interface OAuthAccessTokenPayload extends JWTPayload {
  sub: string;
  azp?: string;
  scope?: string;
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getAuth0Domain(): string | null {
  const domain = process.env.AUTH0_DOMAIN?.trim();
  return domain ? domain : null;
}

function getAuth0Audience(): string | null {
  const audience = process.env.AUTH0_AUDIENCE?.trim();
  return audience ? audience : null;
}

function getAuth0Issuer(domain: string): string {
  return `https://${domain}/`;
}

function getJwks(domain: string) {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`https://${domain}/.well-known/jwks.json`));
  }
  return jwks;
}

export function getOAuthScope(): string {
  return 'public_api.read';
}

export function getProtectedResourceMetadataUrl(): string {
  const domain = getAuth0Domain();
  return domain ? `https://${domain}/.well-known/oauth-protected-resource` : '';
}

/**
 * Extracts a stable per-client identifier from an Auth0 M2M access token,
 * used as the rate-limit key and to look up custom limits in ApiClient.
 */
export function getOAuthClientId(payload: OAuthAccessTokenPayload): string {
  return payload.azp ?? payload.sub.replace(/@clients$/, '');
}

export async function verifyOAuthAccessToken(
  token: string
): Promise<OAuthAccessTokenPayload | null> {
  const domain = getAuth0Domain();
  const audience = getAuth0Audience();

  if (!domain || !audience) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJwks(domain), {
      issuer: getAuth0Issuer(domain),
      audience,
    });

    if (typeof payload.sub !== 'string') {
      return null;
    }

    return payload as OAuthAccessTokenPayload;
  } catch {
    return null;
  }
}
