import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SITE_URL = 'https://datosbizi.com';

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('APP_URL', SITE_URL);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('llms discovery routes', () => {
  it('serves llms.txt with discovery pointers', async () => {
    const { Route } = await import('@/app/llms[.]txt');
    const handler = Route.options.server!.handlers!.GET!;
    const response = await handler({ request: new Request('http://localhost/llms.txt') });
    const body = await response.text();

    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(body).toContain(`${SITE_URL}/sitemap.xml`);
    expect(body).toContain(`${SITE_URL}/llms-full.txt`);
    expect(body).toContain(`${SITE_URL}/api/openapi.json`);
  });

  it('serves llms-full.txt with seo pages and api surface', async () => {
    const { Route } = await import('@/app/llms-full[.]txt');
    const handler = Route.options.server!.handlers!.GET!;
    const response = await handler({ request: new Request('http://localhost/llms-full.txt') });
    const body = await response.text();

    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(body).toContain(`${SITE_URL}/estaciones-mas-usadas-zaragoza`);
    expect(body).toContain(`GET ${SITE_URL}/api/status`);
    expect(body).toContain('## Guidance for AI Assistants');
  });
});
