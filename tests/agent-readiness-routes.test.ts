import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SITE_URL = 'https://datosbizi.com';

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('APP_URL', SITE_URL);
  vi.stubEnv('ROBOTS_BASE_URL', SITE_URL);
  vi.stubEnv('JWT_SECRET', 'test-jwt-secret');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('agent readiness routes', () => {
  it('serves robots.txt with sitemap and content signals', async () => {
    const { GET } = await import('@/app/robots.txt/route');
    const response = GET();
    const body = await response.text();

    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(body).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
    expect(body).toContain('Content-Signal: ai-train=no, search=yes, ai-input=no');
  });

  it('returns markdown when agents request text/markdown', async () => {
    const { default: proxy } = await import('@/proxy');
    const response = proxy(
      new NextRequest(`${SITE_URL}/developers`, {
        headers: {
          accept: 'text/markdown',
        },
      })
    );

    expect(response.headers.get('content-type')).toContain('text/markdown');
    expect(response.headers.get('vary')).toContain('Accept');
    expect(Number(response.headers.get('x-markdown-tokens'))).toBeGreaterThan(0);

    const body = await response.text();
    expect(body).toContain('# Developers Zaragoza');
    expect(body).toContain(`${SITE_URL}/api/openapi.json`);
  });

  it('keeps html as the default negotiation path', async () => {
    const { default: proxy } = await import('@/proxy');
    const response = proxy(
      new NextRequest(`${SITE_URL}/developers`, {
        headers: {
          accept: 'text/html',
        },
      })
    );

    expect(response.headers.get('content-type')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('publishes oauth discovery and protected resource metadata', async () => {
    const oauthDiscovery = await import('@/app/.well-known/oauth-authorization-server/route');
    const protectedResource = await import('@/app/.well-known/oauth-protected-resource/route');

    const discoveryResponse = oauthDiscovery.GET();
    const discoveryBody = await discoveryResponse.json();
    expect(discoveryBody.issuer).toBe(SITE_URL);
    expect(discoveryBody.token_endpoint).toBe(`${SITE_URL}/oauth/token`);
    expect(discoveryBody.grant_types_supported).toContain('client_credentials');

    const protectedResponse = protectedResource.GET();
    const protectedBody = await protectedResponse.json();
    expect(protectedBody.resource).toBe(`${SITE_URL}/api`);
    expect(protectedBody.authorization_servers).toContain(SITE_URL);
    expect(protectedBody.scopes_supported).toContain('public_api.read');
  });

  it('issues oauth access tokens for legacy public api credentials', async () => {
    vi.stubEnv('PUBLIC_API_KEY', 'legacy-public-secret');

    const { POST } = await import('@/app/oauth/token/route');
    const { verifyOAuthAccessToken } = await import('@/lib/oauth');

    const response = await POST(
      new Request(`${SITE_URL}/oauth/token`, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: 'legacy-public-api',
          client_secret: 'legacy-public-secret',
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.token_type).toBe('Bearer');
    expect(body.scope).toBe('public_api.read');

    const payload = await verifyOAuthAccessToken(body.access_token);
    expect(payload?.clientId).toBe('legacy-public-api');
    expect(payload?.scope).toBe('public_api.read');
  });

  it('publishes a local agent skills index with digests', async () => {
    const { GET } = await import('@/app/.well-known/agent-skills/index.json/route');
    const response = GET();
    const body = await response.json();

    expect(body.$schema).toBe(
      'https://schemas.agentskills.io/discovery/0.2.0/schema.json'
    );
    expect(body.skills.length).toBeGreaterThan(0);
    expect(body.skills[0].digest).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(body.skills[0].url).toContain('/.well-known/agent-skills/');
  });

  it('publishes a server card and a working tools list endpoint', async () => {
    const serverCardRoute = await import('@/app/.well-known/mcp/server-card.json/route');
    const mcpRoute = await import('@/app/mcp/route');

    const serverCardResponse = serverCardRoute.GET();
    const serverCard = await serverCardResponse.json();
    expect(serverCard.serverInfo.name).toBe('BiziDashboard MCP');
    expect(serverCard.transport.endpoint).toBe(`${SITE_URL}/mcp`);

    const toolsResponse = await mcpRoute.POST(
      new Request(`${SITE_URL}/mcp`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        }),
      })
    );
    const toolsBody = await toolsResponse.json();

    expect(toolsBody.result.tools.some((tool: { name: string }) => tool.name === 'open_dashboard')).toBe(true);
    expect(
      toolsBody.result.tools.some((tool: { name: string }) => tool.name === 'get_system_status')
    ).toBe(true);
  });
});
