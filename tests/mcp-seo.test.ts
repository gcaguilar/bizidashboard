import { describe, expect, it } from 'vitest';
import { DEFAULT_ROBOTS } from '@/lib/seo-head';
import { appRoutes, INDEXABLE_PUBLIC_ROUTE_REGISTRY } from '@/lib/routes';
import { Route } from '@/app/mcp';

describe('/mcp SEO', () => {
  it('is indexable, canonical and included in the public sitemap registry', () => {
    const head = Route.options.head?.({} as never);

    expect(INDEXABLE_PUBLIC_ROUTE_REGISTRY).toContainEqual(expect.objectContaining({
      id: 'mcp',
      href: appRoutes.mcp(),
    }));
    expect(head?.links).toContainEqual(expect.objectContaining({ rel: 'canonical' }));
    expect(head?.meta).toContainEqual(expect.objectContaining({ name: 'robots', content: DEFAULT_ROBOTS }));
    expect(head?.meta).toContainEqual(expect.objectContaining({ name: 'description', content: expect.stringContaining('ChatGPT') }));
  });
});
