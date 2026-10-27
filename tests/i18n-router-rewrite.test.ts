import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';
import { createLocaleRewrite } from '@/lib/i18n/locale-rewrite';
import { getLocaleFromPathname } from '@/lib/i18n/locales';

function buildRouter(initialEntry: string) {
  const rootRoute = createRootRoute({
    beforeLoad: ({ location }) => ({ locale: getLocaleFromPathname(location.publicHref) }),
  });
  const routeTree = rootRoute.addChildren([
    createRoute({ getParentRoute: () => rootRoute, path: '/' }),
    createRoute({ getParentRoute: () => rootRoute, path: '/metodologia' }),
    createRoute({ getParentRoute: () => rootRoute, path: '/comparar' }),
  ]);

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    rewrite: createLocaleRewrite(),
  });
}

describe('router with the locale rewrite', () => {
  it('serves /en from the Spanish route tree and exposes the locale', async () => {
    const router = buildRouter('/en/metodologia');
    await router.load();

    expect(router.state.location.pathname).toBe('/metodologia');
    expect(router.state.location.publicHref).toBe('/en/metodologia');
    expect(router.state.matches.map((match) => match.routeId)).toContain('/metodologia');
    expect(router.state.matches[0]?.context).toMatchObject({ locale: 'en' });
  });

  it('prefixes links to translated routes only while on an English page', async () => {
    const router = buildRouter('/en');
    await router.load();

    expect(router.buildLocation({ to: '/metodologia' }).publicHref).toBe('/en/metodologia');
    expect(router.buildLocation({ to: '/comparar' }).publicHref).toBe('/comparar');
  });

  it('leaves Spanish pages and links untouched', async () => {
    const router = buildRouter('/metodologia');
    await router.load();

    expect(router.state.location.publicHref).toBe('/metodologia');
    expect(router.state.matches[0]?.context).toMatchObject({ locale: 'es' });
    expect(router.buildLocation({ to: '/' }).publicHref).toBe('/');
    expect(router.buildLocation({ to: '/metodologia' }).publicHref).toBe('/metodologia');
  });
});
