import { isTranslatedPath, localizePathname, stripLocalePrefix } from '@/lib/i18n/locales';
import { resolveRedirectTarget } from '@/lib/routes';

const EN_PREFIX = /^\/en(?:\/+(.*))?$/i;

/**
 * Single-hop redirect target for `/en...` public pathnames that the router
 * rewrite does not serve as they are (it never matches them as an English
 * page):
 *
 * - `/en/<route without English version>` -> the Spanish route (and, when that
 *   route is itself a legacy alias, its final destination, so the visitor
 *   gets one redirect and not a chain).
 * - `/EN`, `/En/metodologia`, `/en//metodologia`, ... -> the canonical
 *   spelling of the English URL when the route is translated.
 *
 * Returns `null` when there is nothing to redirect (not an `/en` path, or
 * already canonical). Query and hash are the caller's responsibility.
 */
export function resolveLocaleRedirect(pathname: string): string | null {
  const match = EN_PREFIX.exec(pathname);
  if (!match) {
    return null;
  }

  const rest = (match[1] ?? '').replace(/\/{2,}/g, '/').replace(/\/+$/, '');
  const spanishPath = `/${rest}`;
  const target = isTranslatedPath(spanishPath)
    ? localizePathname(spanishPath, 'en')
    : (resolveRedirectTarget(spanishPath) ?? spanishPath);

  const finalTarget = isTranslatedPath(target) ? localizePathname(target, 'en') : target;
  return finalTarget === pathname ? null : finalTarget;
}

/**
 * Canonical form of an English public URL (`/en/` -> `/en`,
 * `/en/metodologia/?q=1` -> `/en/metodologia?q=1`), or `null` when it already
 * is. Only English URLs are touched: Spanish URLs keep behaving as before.
 */
export function normalizeEnglishPublicHref(publicHref: string): string | null {
  const [pathAndQuery, ...hashParts] = publicHref.split('#');
  const queryIndex = pathAndQuery.indexOf('?');
  const pathname = queryIndex === -1 ? pathAndQuery : pathAndQuery.slice(0, queryIndex);
  const search = queryIndex === -1 ? '' : pathAndQuery.slice(queryIndex);

  if (!(pathname === '/en/' || (pathname.startsWith('/en/') && pathname.endsWith('/')))) {
    return null;
  }

  const trimmed = pathname.replace(/\/+$/, '') || '/en';
  // `/en/<untranslated>/` is left to the catch-all, which redirects it to the
  // Spanish route in a single hop.
  if (!isTranslatedPath(stripLocalePrefix(trimmed))) {
    return null;
  }
  const hash = hashParts.length > 0 ? `#${hashParts.join('#')}` : '';
  return `${trimmed}${search}${hash}`;
}
