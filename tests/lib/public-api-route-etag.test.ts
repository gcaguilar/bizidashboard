import { beforeEach, describe, expect, it, vi } from 'vitest';

const { enforcePublicApiAccessMock } = vi.hoisted(() => ({
  enforcePublicApiAccessMock: vi.fn(),
}));

vi.mock('@/lib/security/public-api', () => ({
  enforcePublicApiAccess: enforcePublicApiAccessMock,
}));

import { withPublicApiRoute } from '@/lib/security/public-api-route';

const ACCESS_HEADERS = {
  'X-RateLimit-Limit': '40',
  'X-RateLimit-Remaining': '39',
  'X-RateLimit-Reset': '1700000000',
};

function jsonHandler(body: unknown, status = 200) {
  return async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
}

async function call(
  handler: ReturnType<typeof withPublicApiRoute>,
  init: { method?: string; ifNoneMatch?: string } = {}
) {
  const headers: Record<string, string> = { 'x-forwarded-for': '203.0.113.10' };
  if (init.ifNoneMatch) {
    headers['if-none-match'] = init.ifNoneMatch;
  }

  return handler({
    request: new Request('http://localhost/api/test', {
      method: init.method ?? 'GET',
      headers,
    }),
  });
}

describe('public API route ETag seam', () => {
  beforeEach(() => {
    enforcePublicApiAccessMock.mockReset();
    enforcePublicApiAccessMock.mockResolvedValue({
      ok: true,
      headers: ACCESS_HEADERS,
      providedKey: null,
      apiKeyInfo: null,
      principal: null,
      sessionEmail: null,
    });
  });

  it('adds an ETag to GET 200 JSON responses', async () => {
    const handler = withPublicApiRoute(
      { route: '/api/test', namespace: 'test', cacheControl: 'public, max-age=60' },
      jsonHandler({ hello: 'world' })
    );

    const response = await call(handler);

    expect(response.status).toBe(200);
    expect(response.headers.get('ETag')).toMatch(/^"[0-9a-f]{8}"$/);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=60');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('39');
    await expect(response.json()).resolves.toEqual({ hello: 'world' });
  });

  it('answers 304 with the access and cache headers when If-None-Match matches', async () => {
    const handler = withPublicApiRoute(
      { route: '/api/test', namespace: 'test', cacheControl: 'public, max-age=60' },
      jsonHandler({ hello: 'world' })
    );

    const first = await call(handler);
    const etag = first.headers.get('ETag')!;

    const second = await call(handler, { ifNoneMatch: etag });

    expect(second.status).toBe(304);
    expect(second.headers.get('ETag')).toBe(etag);
    expect(second.headers.get('X-RateLimit-Remaining')).toBe('39');
    expect(second.headers.get('Cache-Control')).toBe('public, max-age=60');
    expect(second.headers.get('Content-Length')).toBeNull();
    await expect(second.text()).resolves.toBe('');
  });

  it('accepts weak and multi-value If-None-Match validators', async () => {
    const handler = withPublicApiRoute(
      { route: '/api/test', namespace: 'test' },
      jsonHandler({ hello: 'world' })
    );

    const first = await call(handler);
    const etag = first.headers.get('ETag')!;

    await expect(call(handler, { ifNoneMatch: `W/${etag}` })).resolves.toMatchObject({
      status: 304,
    });
    await expect(
      call(handler, { ifNoneMatch: `"other", ${etag}` })
    ).resolves.toMatchObject({ status: 304 });
  });

  it('keeps returning 200 when the validator does not match', async () => {
    const handler = withPublicApiRoute(
      { route: '/api/test', namespace: 'test' },
      jsonHandler({ hello: 'world' })
    );

    const response = await call(handler, { ifNoneMatch: '"stale"' });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ hello: 'world' });
  });

  it('computes ETags for CSV payloads', async () => {
    const handler = withPublicApiRoute({ route: '/api/test', namespace: 'test' }, async () =>
      new Response('stationId,name\n1,Centro\n', {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="stations.csv"',
        },
      })
    );

    const response = await call(handler);

    expect(response.headers.get('ETag')).toBeTruthy();
    expect(response.headers.get('Content-Disposition')).toContain('stations.csv');
  });

  it('does not tag error responses or non-GET requests', async () => {
    const errorHandler = withPublicApiRoute(
      { route: '/api/test', namespace: 'test' },
      jsonHandler({ error: 'bad request' }, 400)
    );
    const errorResponse = await call(errorHandler);
    expect(errorResponse.status).toBe(400);
    expect(errorResponse.headers.get('ETag')).toBeNull();

    const writeHandler = withPublicApiRoute({ route: '/api/test', namespace: 'test' }, async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const writeResponse = await call(writeHandler, { method: 'POST' });
    expect(writeResponse.status).toBe(200);
    expect(writeResponse.headers.get('ETag')).toBeNull();
  });
});
