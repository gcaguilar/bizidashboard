import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  resolveBearerDeveloperPrincipalMock,
  resolveSessionDeveloperPrincipalMock,
  validateApiKeyMock,
} = vi.hoisted(() => ({
  resolveBearerDeveloperPrincipalMock: vi.fn(),
  resolveSessionDeveloperPrincipalMock: vi.fn(),
  validateApiKeyMock: vi.fn(),
}));

vi.mock('@/lib/auth/developer-principal', () => ({
  resolveBearerDeveloperPrincipal: resolveBearerDeveloperPrincipalMock,
  resolveSessionDeveloperPrincipal: resolveSessionDeveloperPrincipalMock,
}));

vi.mock('@/lib/security/api-keys', () => ({
  validateApiKey: validateApiKeyMock,
  getApiKeyRateLimits: vi.fn(),
  API_KEY_HEADER: 'x-api-key',
  DEFAULT_RATE_LIMIT: 100,
  DEFAULT_RATE_WINDOW_MS: 60_000,
}));

import { getPrincipalRateLimitKey } from '@/lib/security/public-api';
import type { DeveloperPrincipal } from '@/lib/auth/developer-principal';

function principalFor(auth0Subject: string, clientId: string): DeveloperPrincipal {
  return {
    account: {
      id: `account-for-${auth0Subject}`,
      auth0Subject,
      email: null,
      status: 'active',
      createdAt: new Date(0),
      updatedAt: new Date(0),
      lastSeenAt: null,
      revokedAt: null,
    },
    authentication: 'bearer',
    clientId,
    scopes: ['read:dashboard'],
  };
}

describe('public API authenticated rate limits', () => {
  beforeEach(() => {
    resolveBearerDeveloperPrincipalMock.mockReset();
    resolveSessionDeveloperPrincipalMock.mockReset();
    validateApiKeyMock.mockReset();
    validateApiKeyMock.mockResolvedValue(null);
    resolveSessionDeveloperPrincipalMock.mockResolvedValue(null);
  });

  it('groups browser and MCP OBO calls by the Auth0 subject, not their OAuth client', () => {
    const browser = principalFor('auth0|user-123', 'web-client');
    const mcpObo = principalFor('auth0|user-123', 'mcp-obo-client');
    const otherUser = principalFor('auth0|user-456', 'mcp-obo-client');

    expect(getPrincipalRateLimitKey(mcpObo)).toBe(getPrincipalRateLimitKey(browser));
    expect(getPrincipalRateLimitKey(otherUser)).not.toBe(getPrincipalRateLimitKey(mcpObo));
  });

  it('rejects an otherwise authenticated bearer without read:dashboard', async () => {
    resolveBearerDeveloperPrincipalMock.mockResolvedValue({
      ...principalFor('auth0|user-123', 'mcp-obo-client'),
      scopes: ['read:exports'],
    });

    const { enforcePublicApiAccess } = await import('@/lib/security/public-api');
    const access = await enforcePublicApiAccess({
      route: '/api/stations',
      request: new Request('https://datosbizi.com/api/stations', {
        headers: { authorization: 'Bearer OBO-token' },
      }),
      requestId: 'test-request',
      clientIp: '127.0.0.1',
      userAgent: null,
      namespace: 'api:stations',
      limit: 30,
      windowMs: 60_000,
      requireApiKey: false,
    });

    expect(access.ok).toBe(false);
    if (access.ok) throw new Error('Expected a rejected public API request.');
    expect(access.response.status).toBe(403);
    await expect(access.response.json()).resolves.toMatchObject({
      requiredScope: 'read:dashboard',
    });
  });
});
