import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
} from 'jose';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createAuth0AccessTokenVerifier } from '@/lib/auth/auth0-access-token';

const domain = 'login.example.auth0.com';
const issuer = `https://${domain}/`;
const audience = 'https://api.datosbizi.test';
const allowedClientId = 'chatgpt-client';
const mcpOboClientId = 'mcp-obo-client';

let privateKey: CryptoKey;
let jwks: ReturnType<typeof createLocalJWKSet>;

beforeAll(async () => {
  const keyPair = await generateKeyPair('RS256');
  privateKey = keyPair.privateKey;
  const publicJwk = await exportJWK(keyPair.publicKey);
  publicJwk.kid = 'auth0-test-key';
  publicJwk.alg = 'RS256';
  jwks = createLocalJWKSet({ keys: [publicJwk] });
});

beforeEach(() => {
  vi.stubEnv('AUTH0_LOGIN_DOMAIN', domain);
  vi.stubEnv('AUTH0_DOMAIN', 'fallback.example.auth0.com');
  vi.stubEnv('AUTH0_AUDIENCE', audience);
  vi.stubEnv('AUTH0_ACCESS_TOKEN_ALLOWED_CLIENT_IDS', `${allowedClientId}, claude-client`);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

async function issueAccessToken(overrides: Record<string, unknown> = {}): Promise<string> {
  const {
    scope = 'read:dashboard read:exports read:dashboard',
    tokenIssuer = issuer,
    tokenAudience = audience,
    ...claims
  } = overrides;
  return new SignJWT({
    scope,
    azp: allowedClientId,
    email: 'untrusted@example.com',
    ...claims,
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'auth0-test-key' })
    .setIssuer(String(tokenIssuer))
    .setAudience(String(tokenAudience))
    .setSubject('auth0|account-123')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);
}

function createVerifier() {
  return createAuth0AccessTokenVerifier({ jwks });
}

describe('Auth0 access-token verifier', () => {
  it('verifies the configured issuer, audience, authorized party, and scopes', async () => {
    const principal = await createVerifier()(await issueAccessToken());

    expect(principal).toEqual({
      auth0Subject: 'auth0|account-123',
      clientId: allowedClientId,
      scopes: ['read:dashboard', 'read:exports'],
    });
    expect(principal).not.toHaveProperty('email');
  });

  it('uses AUTH0_LOGIN_DOMAIN before AUTH0_DOMAIN', async () => {
    const principal = await createVerifier()(await issueAccessToken());

    expect(principal?.auth0Subject).toBe('auth0|account-123');
  });

  it('accepts an OBO token from the explicit MCP client and preserves the user subject', async () => {
    vi.stubEnv('MCP_AUTH0_OBO_CLIENT_ID', mcpOboClientId);

    const principal = await createVerifier()(await issueAccessToken({
      azp: mcpOboClientId,
      act: { sub: 'connector-client' },
    }));

    expect(principal).toEqual({
      auth0Subject: 'auth0|account-123',
      clientId: mcpOboClientId,
      scopes: ['read:dashboard', 'read:exports'],
    });
  });

  it.each([
    ['a token for the MCP resource', { tokenAudience: 'https://mcp.datosbizi.com/mcp' }],
    ['a token for a different audience', { tokenAudience: 'https://other-api.example' }],
    ['a token issued by a different issuer', { tokenIssuer: 'https://other.example.auth0.com/' }],
    ['a token from an unapproved OAuth client', { azp: 'unknown-client' }],
  ])('rejects %s', async (_description, claim) => {
    const token = await issueAccessToken(claim);

    expect(await createVerifier()(token)).toBeNull();
  });

  it('rejects a token without a subject or a valid scope claim', async () => {
    const withoutSubject = await new SignJWT({ scope: 'read:dashboard', azp: allowedClientId })
      .setProtectedHeader({ alg: 'RS256', kid: 'auth0-test-key' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);
    const invalidScope = await issueAccessToken({ scope: ['read:dashboard'] });

    expect(await createVerifier()(withoutSubject)).toBeNull();
    expect(await createVerifier()(invalidScope)).toBeNull();
  });

  it('rejects expired and incorrectly signed tokens', async () => {
    const expired = await new SignJWT({ scope: 'read:dashboard', azp: allowedClientId })
      .setProtectedHeader({ alg: 'RS256', kid: 'auth0-test-key' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setSubject('auth0|account-123')
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1_000) - 1)
      .sign(privateKey);
    const otherKeys = await generateKeyPair('RS256');
    const incorrectlySigned = await new SignJWT({ scope: 'read:dashboard', azp: allowedClientId })
      .setProtectedHeader({ alg: 'RS256', kid: 'auth0-test-key' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setSubject('auth0|account-123')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(otherKeys.privateKey);

    expect(await createVerifier()(expired)).toBeNull();
    expect(await createVerifier()(incorrectlySigned)).toBeNull();
  });
});
