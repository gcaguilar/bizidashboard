import { existsSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('robots.txt', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is generated from the configured production host', async () => {
    vi.stubEnv('APP_URL', 'https://datosbizi.com');
    vi.stubEnv('ROBOTS_BASE_URL', 'https://datosbizi.com');

    const { buildRobotsTxt } = await import('@/lib/robots-txt');
    const body = buildRobotsTxt();

    expect(body).toContain('Host: https://datosbizi.com');
    expect(body).toContain('Sitemap: https://datosbizi.com/sitemap.xml');
    expect(body).not.toContain('bizidashboard.com');
  });

  it('does not ship a static public robots file that can shadow the route', () => {
    expect(existsSync(path.join(process.cwd(), 'public', 'robots.txt'))).toBe(false);
  });
});
