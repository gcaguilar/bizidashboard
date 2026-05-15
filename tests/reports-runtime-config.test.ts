import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

describe('reports runtime config', () => {
  it('informes and sitemap routes are available', async () => {
    const reportsMod = await import('@/app/informes');
    expect(reportsMod.Route).toBeDefined();
    expect(reportsMod.Route.options).toBeDefined();
  }, 15000);

  it('sitemap route exposes GET handler', async () => {
    const sitemapMod = await import('@/app/sitemap[.]xml');
    expect(sitemapMod.Route.options.server).toBeDefined();
    expect(sitemapMod.Route.options.server!.handlers!.GET).toBeDefined();
  }, 15000);
});
