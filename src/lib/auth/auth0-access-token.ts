/**
 * Verification for Auth0-issued OAuth access tokens used by external API
 * clients (for example MCP). This deliberately does not share code with the
 * mobile HS256 tokens in jwt.ts: they have a different issuer and trust model.
 */

import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTVerifyGetKey,
} from 'jose';

/**
 * The authenticated identity that later authorization code can resolve to a
 * local account. Email and other profile claims are intentionally excluded:
 * only Auth0's stable `sub` claim identifies the token holder.
 */
export type VerifiedAuth0AccessTokenPrincipal = Readonly<{
  auth0Subject: string;
  clientId: string;
  scopes: readonly string[];
}>;

export type Auth0AccessTokenVerifier = (
  accessToken: string
) => Promise<VerifiedAuth0AccessTokenPrincipal | null>;

export type Auth0AccessTokenVerifierOptions = Readonly<{
  /** Inject a JWKS resolver in tests; the default fetches Auth0's JWKS. */
  jwks?: JWTVerifyGetKey;
  /** Defaults to AUTH0_LOGIN_DOMAIN, then AUTH0_DOMAIN. */
  domain?: string;
  /** Defaults to AUTH0_AUDIENCE. */
  audience?: string;
  /**
   * Defaults to AUTH0_ACCESS_TOKEN_ALLOWED_CLIENT_IDS, a comma-separated
   * allow-list of Auth0 OAuth client IDs permitted to call this API. Every
   * accepted token must include one of these exact values in its `azp` claim.
   */
  allowedClientIds?: readonly string[];
}>;

type Auth0AccessTokenVerifierConfig = {
  issuer: string;
  audience: string;
  allowedClientIds: readonly string[];
};

const remoteJwksByIssuer = new Map<string, JWTVerifyGetKey>();

function getRequiredValue(value: string | undefined, message: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(message);
  }
  return trimmed;
}

function getIssuer(domain: string): string {
  const candidate = domain.includes('://') ? domain : `https://${domain}`;
  let url: URL;

  try {
    url = new URL(candidate);
  } catch {
    throw new Error('AUTH0_LOGIN_DOMAIN or AUTH0_DOMAIN must be a valid Auth0 HTTPS domain.');
  }

  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/') {
    throw new Error('AUTH0_LOGIN_DOMAIN or AUTH0_DOMAIN must be a valid Auth0 HTTPS domain.');
  }

  return `${url.origin}/`;
}

function parseAllowedClientIds(value: readonly string[]): readonly string[] {
  const clientIds = [...new Set(value.map((clientId) => clientId.trim()).filter(Boolean))];
  if (clientIds.length === 0) {
    throw new Error(
      'AUTH0_ACCESS_TOKEN_ALLOWED_CLIENT_IDS is required to verify Auth0 access tokens.'
    );
  }
  return clientIds;
}

function resolveConfig(options: Auth0AccessTokenVerifierOptions): Auth0AccessTokenVerifierConfig {
  const domain = options.domain ?? process.env.AUTH0_LOGIN_DOMAIN ?? process.env.AUTH0_DOMAIN;
  const audience = options.audience ?? process.env.AUTH0_AUDIENCE;
  const allowedClientIds = options.allowedClientIds ?? (
    process.env.AUTH0_ACCESS_TOKEN_ALLOWED_CLIENT_IDS?.split(',') ?? []
  );

  return {
    issuer: getIssuer(getRequiredValue(
      domain,
      'AUTH0_LOGIN_DOMAIN or AUTH0_DOMAIN is required to verify Auth0 access tokens.'
    )),
    audience: getRequiredValue(
      audience,
      'AUTH0_AUDIENCE is required to verify Auth0 access tokens.'
    ),
    allowedClientIds: parseAllowedClientIds(allowedClientIds),
  };
}

function getRemoteJwks(issuer: string): JWTVerifyGetKey {
  const existing = remoteJwksByIssuer.get(issuer);
  if (existing) return existing;

  const jwks = createRemoteJWKSet(new URL('.well-known/jwks.json', issuer));
  remoteJwksByIssuer.set(issuer, jwks);
  return jwks;
}

function parseScopes(scope: unknown): readonly string[] | null {
  if (scope === undefined) return [];
  if (typeof scope !== 'string') return null;

  return [...new Set(scope.split(/\s+/).filter(Boolean))];
}

/**
 * Creates an Auth0 OAuth access-token verifier. Configuration errors throw so
 * deployments fail clearly; malformed, expired, or unauthorized tokens return
 * null and can be treated as an unauthenticated request by route code.
 */
export function createAuth0AccessTokenVerifier(
  options: Auth0AccessTokenVerifierOptions = {}
): Auth0AccessTokenVerifier {
  const config = resolveConfig(options);
  const jwks = options.jwks ?? getRemoteJwks(config.issuer);

  return async (accessToken: string): Promise<VerifiedAuth0AccessTokenPrincipal | null> => {
    try {
      const { payload } = await jwtVerify(accessToken, jwks, {
        issuer: config.issuer,
        audience: config.audience,
        algorithms: ['RS256'],
      });

      if (
        typeof payload.exp !== 'number' ||
        typeof payload.sub !== 'string' ||
        payload.sub.length === 0 ||
        typeof payload.azp !== 'string' ||
        !config.allowedClientIds.includes(payload.azp)
      ) {
        return null;
      }

      const scopes = parseScopes(payload.scope);
      if (!scopes) return null;

      return {
        auth0Subject: payload.sub,
        clientId: payload.azp,
        scopes,
      };
    } catch {
      return null;
    }
  };
}

/** Uses the deployment's Auth0 environment configuration and remote JWKS. */
export async function verifyAuth0AccessToken(
  accessToken: string
): Promise<VerifiedAuth0AccessTokenPrincipal | null> {
  return createAuth0AccessTokenVerifier()(accessToken);
}
