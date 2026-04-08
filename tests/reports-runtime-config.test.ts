import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

describe('reports runtime config', () => {
  it('keeps build-time fallbacks out of the reports archive and sitemap', async () => {
    const reportsPage = await import('@/app/informes/page');
    const sitemapRoute = await import('@/app/sitemap');

    expect(reportsPage.dynamic).toBe('force-dynamic');
    expect(sitemapRoute.dynamic).toBe('force-dynamic');
  });
});
