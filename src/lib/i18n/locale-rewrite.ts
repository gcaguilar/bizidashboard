import {
  getLocaleFromPathname,
  isTranslatedPath,
  localizePathname,
  stripLocalePrefix,
  type Locale,
} from '@/lib/i18n/locales';

/**
 * TanStack Router `rewrite` pair that serves `/en/...` from the Spanish route
 * tree. Create one per router (the router itself is created per request on the
 * server, so the closure never leaks between requests).
 *
 * - `input`: `/en/metodologia` -> `/metodologia` (only for translated routes;
 *   other `/en/...` paths are left alone so the catch-all can redirect them).
 * - `output`: adds `/en` to translated routes while the current page is English.
 */
export function createLocaleRewrite() {
  let current: Locale = 'es';

  return {
    input: ({ url }: { url: URL }): URL => {
      const locale = getLocaleFromPathname(url.pathname);
      const stripped = stripLocalePrefix(url.pathname);

      if (locale === 'en' && isTranslatedPath(stripped)) {
        current = 'en';
        url.pathname = stripped;
        return url;
      }

      current = 'es';
      return url;
    },
    output: ({ url }: { url: URL }): URL => {
      if (current === 'en') {
        url.pathname = localizePathname(url.pathname, 'en');
      }
      return url;
    },
  };
}
