// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  isRedirect,
} from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';
import { Route as CatchAllRoute } from '@/app/$';
import { normalizeEnglishPublicHref, resolveLocaleRedirect } from '@/lib/i18n/locale-redirect';
import { createLocaleRewrite } from '@/lib/i18n/locale-rewrite';
import { getLocaleFromPathname } from '@/lib/i18n/locales';

/** Mirrors `src/router.tsx`: the rewrite reads the locale from the router itself. */
function buildRouter(initialEntry: string) {
  const rootRoute = createRootRoute({
    beforeLoad: ({ location }) => ({ locale: getLocaleFromPathname(location.publicHref) }),
  });
  const routeTree = rootRoute.addChildren([
    createRoute({ getParentRoute: () => rootRoute, path: '/' }),
    createRoute({ getParentRoute: () => rootRoute, path: '/metodologia' }),
    createRoute({ getParentRoute: () => rootRoute, path: '/comparar' }),
    createRoute({ getParentRoute: () => rootRoute, path: '/dashboard' }),
  ]);

  let routerRef: { latestLocation?: { publicHref?: string } } | undefined;
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    rewrite: createLocaleRewrite(() => routerRef?.latestLocation?.publicHref),
  });
  routerRef = router;
  return router;
}

const linkTo = (router: ReturnType<typeof buildRouter>, to: string) =>
  router.buildLocation({ to } as never).publicHref;

describe('locale rewrite inside a real router', () => {
  it('prefixes links from the very first render (hydration, before any load)', () => {
    expect(linkTo(buildRouter('/en/metodologia'), '/')).toBe('/en');
    expect(linkTo(buildRouter('/metodologia'), '/')).toBe('/');
  });

  it('does not flip the locale when a destination href is parsed', async () => {
    const router = buildRouter('/en');
    await router.load();

    // `navigate({ href })` / redirects run the input rewrite on the target.
    router.buildLocation({ href: '/comparar' } as never);
    router.buildLocation({ href: '/metodologia' } as never);

    expect(linkTo(router, '/metodologia')).toBe('/en/metodologia');
  });

  it('keeps links right after /en -> /comparar -> back', async () => {
    const router = buildRouter('/en/metodologia');
    await router.load();
    expect(linkTo(router, '/')).toBe('/en');

    await router.navigate({ to: '/comparar' });
    expect(router.history.location.pathname).toBe('/comparar');
    expect(router.latestLocation.publicHref).toBe('/comparar');
    expect(linkTo(router, '/metodologia')).toBe('/metodologia');

    router.history.back();
    await router.load();
    expect(router.latestLocation.publicHref).toBe('/en/metodologia');
    expect(linkTo(router, '/')).toBe('/en');
    expect(linkTo(router, '/metodologia')).toBe('/en/metodologia');
    expect(linkTo(router, '/dashboard')).toBe('/dashboard');
  });

  it('is not altered by preloading a route', async () => {
    const router = buildRouter('/en');
    await router.load();
    await router.preloadRoute({ to: '/dashboard' } as never);
    await router.preloadRoute({ to: '/metodologia' } as never);

    expect(router.state.location.publicHref).toBe('/en');
    expect(linkTo(router, '/metodologia')).toBe('/en/metodologia');
  });

  it('keeps routers (requests) independent from each other', async () => {
    const english = buildRouter('/en');
    const spanish = buildRouter('/metodologia');
    await Promise.all([english.load(), spanish.load()]);

    expect(linkTo(english, '/metodologia')).toBe('/en/metodologia');
    expect(linkTo(spanish, '/')).toBe('/');
    expect(linkTo(english, '/')).toBe('/en');
  });

  it('keeps the query string and hash of generated links', () => {
    const router = buildRouter('/en');
    const location = router.buildLocation({ to: '/metodologia', search: { a: 1 }, hash: 'x' } as never);
    expect(location.publicHref).toBe('/en/metodologia?a=1#x');
  });

  it('does not strip /en from routes without English version', () => {
    const router = buildRouter('/en/comparar');
    expect(router.state.location.pathname).toBe('/en/comparar');
  });
});

describe('resolveLocaleRedirect', () => {
  it('sends untranslated /en routes to the Spanish route in one hop', () => {
    expect(resolveLocaleRedirect('/en/comparar')).toBe('/comparar');
    expect(resolveLocaleRedirect('/en/dashboard/estaciones')).toBe('/dashboard/estaciones');
    expect(resolveLocaleRedirect('/en/estadisticas/estaciones')).toBe('/estadisticas/estaciones');
  });

  it('resolves legacy aliases without chaining a second redirect', () => {
    const target = resolveLocaleRedirect('/en/zaragoza');
    expect(target).not.toMatch(/^\/en/);
    expect(target).toBe('/dashboard');
  });

  it('canonicalizes case and slashes of translated routes', () => {
    expect(resolveLocaleRedirect('/EN')).toBe('/en');
    expect(resolveLocaleRedirect('/En/metodologia')).toBe('/en/metodologia');
    expect(resolveLocaleRedirect('/en//metodologia')).toBe('/en/metodologia');
    expect(resolveLocaleRedirect('/EN/estadisticas/estaciones/12/')).toBe('/en/estadisticas/estaciones/12');
  });

  it('ignores everything that is not an /en path', () => {
    expect(resolveLocaleRedirect('/entrada')).toBeNull();
    expect(resolveLocaleRedirect('/metodologia')).toBeNull();
    expect(resolveLocaleRedirect('/')).toBeNull();
  });
});

describe('normalizeEnglishPublicHref', () => {
  it('drops the trailing slash of English translated URLs and keeps query/hash', () => {
    expect(normalizeEnglishPublicHref('/en/')).toBe('/en');
    expect(normalizeEnglishPublicHref('/en/metodologia/')).toBe('/en/metodologia');
    expect(normalizeEnglishPublicHref('/en/metodologia/?a=1#x')).toBe('/en/metodologia?a=1#x');
    expect(normalizeEnglishPublicHref('/en/?a=1')).toBe('/en?a=1');
  });

  it('leaves canonical, Spanish and untranslated URLs alone', () => {
    expect(normalizeEnglishPublicHref('/en')).toBeNull();
    expect(normalizeEnglishPublicHref('/en/metodologia?a=1')).toBeNull();
    expect(normalizeEnglishPublicHref('/metodologia/')).toBeNull();
    expect(normalizeEnglishPublicHref('/')).toBeNull();
    // handled by the catch-all in a single hop to the Spanish route
    expect(normalizeEnglishPublicHref('/en/comparar/')).toBeNull();
  });
});

describe('catch-all route', () => {
  function run(splat: string, searchStr = '', hash = '') {
    const loader = (CatchAllRoute.options as unknown as { loader: (ctx: unknown) => unknown }).loader;
    try {
      loader({ params: { _splat: splat }, location: { searchStr, hash } });
    } catch (thrown) {
      return thrown;
    }
    return undefined;
  }

  it('redirects /en/<untranslated> with 308, preserving the query, in one hop', () => {
    const thrown = run('en/comparar', '?a=1&b=2', 'top');
    expect(isRedirect(thrown)).toBe(true);
    const redirect = thrown as { options: { href: string; statusCode: number } };
    expect(redirect.options.statusCode).toBe(308);
    expect(redirect.options.href).toBe('/comparar?a=1&b=2#top');
  });

  it('redirects uppercase and double-slash English URLs to the canonical one', () => {
    const upper = run('EN/metodologia') as { options: { href: string; statusCode: number } };
    expect(upper.options).toMatchObject({ href: '/en/metodologia', statusCode: 308 });
    const bare = run('EN') as { options: { href: string } };
    expect(bare.options.href).toBe('/en');
  });

  it('keeps the Spanish behaviour: aliases redirect, unknown paths are not found', () => {
    const alias = run('api/docs') as { options: { to?: string; statusCode: number } };
    expect(alias.options.to).toBe('/developers');
    expect(alias.options.statusCode).toBe(308);
    expect(isRedirect(run('no-existe'))).toBe(false);
  });
});
