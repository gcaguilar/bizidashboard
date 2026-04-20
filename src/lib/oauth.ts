import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { timingSafeEqual } from 'node:crypto';
import { TextEncoder } from 'node:util';
import { getPublicApiKey } from '@/lib/security/config';
import { getSiteUrl } from '@/lib/site';

const OAUTH_ACCESS_TOKEN_EXPIRY_SECONDS = 3600;
const OAUTH_SCOPE = 'public_api.read';
const LEGACY_OAUTH_CLIENT_ID = 'legacy-public-api';
const DEFAULT_RATE_LIMIT = 100;
const DEFAULT_RATE_WINDOW_MS = 60_000;
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production'
);

type ApiKeyInfo = {
  id: string;
  name: string;
  keyPrefix: string;
  description: string | null;
  ownerEmail: string | null;
  isActive: boolean;
  lastUsedAt: Date | null;
  requestCount: number;
  createdAt: Date;
  customRateLimit: number | null;
  customRateWindow: number | null;
};

export type OAuthClient = {
  clientId: string;
  rateLimit: number;
  rateWindowMs: number;
  apiKeyInfo: ApiKeyInfo | null;
};

export interface OAuthAccessTokenPayload extends JWTPayload {
  clientId: string;
  scope: string;
  tokenUse: 'oauth_access';
}

export function getOAuthIssuer(): string {
  return getSiteUrl();
}

export function getOAuthScope(): string {
  return OAUTH_SCOPE;
}

export function getProtectedResourceMetadataUrl(): string {
  return `${getSiteUrl()}/.well-known/oauth-protected-resource`;
}

export async function generateOAuthAccessToken(clientId: string): Promise<string> {
  return new SignJWT({
    clientId,
    scope: OAUTH_SCOPE,
    tokenUse: 'oauth_access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(getOAuthIssuer())
    .setAudience(getSiteUrl())
    .setIssuedAt()
    .setExpirationTime(`${OAUTH_ACCESS_TOKEN_EXPIRY_SECONDS}s`)
    .sign(JWT_SECRET);
}

export async function verifyOAuthAccessToken(
  token: string
): Promise<OAuthAccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: getOAuthIssuer(),
      audience: getSiteUrl(),
    });

    if (payload.tokenUse !== 'oauth_access') {
      return null;
    }

    return payload as OAuthAccessTokenPayload;
  } catch {
    return null;
  }
}

export async function validateOAuthClient(
  clientId: string | null | undefined,
  clientSecret: string | null | undefined
): Promise<OAuthClient | null> {
  if (!clientId || !clientSecret) {
    return null;
  }

  const legacyKey = getPublicApiKey();

  if (legacyKey) {
    if (!legacyKey || clientId !== LEGACY_OAUTH_CLIENT_ID) {
      return null;
    }

    const providedBuffer = Buffer.from(clientSecret);
    const expectedBuffer = Buffer.from(legacyKey);
    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      return null;
    }

    return {
      clientId,
      rateLimit: DEFAULT_RATE_LIMIT,
      rateWindowMs: DEFAULT_RATE_WINDOW_MS,
      apiKeyInfo: null,
    };
  }

  const { validateApiKey } = await import('@/lib/security/api-keys');
  const apiKeyInfo = await validateApiKey(clientSecret);
  if (!apiKeyInfo || apiKeyInfo.keyPrefix !== clientId) {
    return null;
  }

  return {
    clientId,
    rateLimit: apiKeyInfo.customRateLimit ?? DEFAULT_RATE_LIMIT,
    rateWindowMs: apiKeyInfo.customRateWindow ?? DEFAULT_RATE_WINDOW_MS,
    apiKeyInfo,
  };
}

export function parseClientCredentials(request: Request): {
  clientId: string | null;
  clientSecret: string | null;
} {
  const authorization = request.headers.get('authorization')?.trim() ?? '';
  if (authorization.startsWith('Basic ')) {
    const encoded = authorization.slice('Basic '.length);
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');

    if (separatorIndex >= 0) {
      return {
        clientId: decoded.slice(0, separatorIndex),
        clientSecret: decoded.slice(separatorIndex + 1),
      };
    }
  }

  return {
    clientId: null,
    clientSecret: null,
  };
}

export function getOAuthMetadata() {
  const issuer = getOAuthIssuer();

  return {
    issuer,
    token_endpoint: `${issuer}/oauth/token`,
    grant_types_supported: ['client_credentials'],
    response_types_supported: [],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
    scopes_supported: [OAUTH_SCOPE],
  };
}

export { LEGACY_OAUTH_CLIENT_ID, OAUTH_ACCESS_TOKEN_EXPIRY_SECONDS };
