import {
  getLocaleFromPathname,
  isTranslatedPath,
  localizePathname,
  stripLocalePrefix,
} from '@/lib/i18n/locales';

/**
 * Returns the public URL (`/en/metodologia?x=1`) of the page the visitor is
 * currently on, or `undefined` while it is not known yet.
 */
export type CurrentPublicHref = () => string | undefined;

/**
 * TanStack Router `rewrite` pair that serves `/en/...` from the Spanish route
 * tree.
 *
 * - `input`: `/en/metodologia` -> `/metodologia` (only for translated routes;
 *   other `/en/...` paths are left alone so the catch-all can redirect them).
 *   Pure: it never stores anything. The router also runs `input` for
 *   destinations (`navigate({ href })`, redirects), so remembering "the last
 *   parsed locale" here would flip the locale of the page being displayed.
 * - `output`: adds `/en` to translated routes while the page the visitor is on
 *   is English. The locale is read on every call from `getCurrentPublicHref`
 *   (the router's `latestLocation.publicHref`), so there is no mutable state
 *   to go stale across back/forward, preloads, hydration or concurrent
 *   requests (each request has its own router, hence its own getter).
 */
export function createLocaleRewrite(getCurrentPublicHref: CurrentPublicHref = () => undefined) {
  return {
    input: ({ url }: { url: URL }): URL => {
      if (getLocaleFromPathname(url.pathname) === 'en') {
        const stripped = stripLocalePrefix(url.pathname);
        if (isTranslatedPath(stripped)) {
          url.pathname = stripped;
        }
      }
      return url;
    },
    output: ({ url }: { url: URL }): URL => {
      if (getLocaleFromPathname(getCurrentPublicHref()) === 'en') {
        url.pathname = localizePathname(url.pathname, 'en');
      }
      return url;
    },
  };
}
