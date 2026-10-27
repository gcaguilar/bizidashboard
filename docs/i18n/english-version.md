# English version (improvement 12b) - strategy and first delivery

Status: first delivery. Spanish stays the default and the only fully
translated language of the site. English is opt-in per route through a small,
central dictionary; whatever is not translated falls back to Spanish.

## Principles

1. **Do not duplicate pages.** There is one route tree. English pages are the
   same route components rendering a different dictionary.
2. **Spanish SEO must not change.** Same URLs, same canonical, same HTML for
   `lang="es"`. The only additive delta on Spanish pages is the `hreflang`
   `<link rel="alternate">` set on the routes that have an English twin
   (hreflang needs reciprocal links to be honoured by search engines).
3. **Graceful fallback.** A missing English key resolves to the Spanish string.
   A route without an English version is never served under `/en`.

## URL strategy

- English lives under the `/en` prefix: `/en`, `/en/metodologia`,
  `/en/estadisticas/estaciones/:id`. The slugs stay Spanish on purpose
  (no localized slugs: no redirect maps, no duplicated route registry).
- Implemented with the TanStack Router `rewrite` option
  (`src/lib/i18n/locale-rewrite.ts`): `input` strips `/en` before matching and
  `output` adds it back when building links while the visitor is on an English
  page. File routes are therefore untouched.
- Only the routes listed in `TRANSLATED_ROUTE_PATTERNS`
  (`src/lib/i18n/locales.ts`) get a prefix. A link from an English page to a
  route that is not translated points to the Spanish URL (the visitor lands in
  Spanish and can switch back with the selector). `/en/<untranslated>` answers
  with a 308 redirect to `/<untranslated>` (catch-all `src/app/$.tsx`).
- Locale is derived from the public URL only (no cookie, no `Accept-Language`
  redirect). This keeps pages cacheable and crawlable.

## SEO per language

- `<html lang>`: `es` or `en` from the root route context (`locale`).
- `canonical`: each language points to itself (`/x` and `/en/x`).
- `hreflang`: `es`, `en` and `x-default` (= Spanish) on every translated route,
  built by `buildLocaleAlternates` and emitted from `buildSeoHead` / the route
  `head`.
- `og:locale`: `es_ES` / `en_US`, plus `og:locale:alternate` with the other
  language on translated routes only (`buildOgLocaleMeta`). JSON-LD
  `inLanguage`: `es` / `en`; `localizeStructuredData` points page-level nodes
  (WebPage, TechArticle, Dataset) and BreadcrumbList items of English pages to
  the `/en` URL. FAQPage nodes keep the loader copy (Spanish) as delivered.
- `sitemap.xml`: adds the `/en...` URL of each translated route (home,
  methodology, every sitemap station) and, for both URLs of each pair,
  `<xhtml:link rel="alternate" hreflang>` for `es`, `en` and `x-default`
  (`xmlns:xhtml` declared, see `src/lib/i18n/sitemap.ts`). Spanish-only
  entries are byte-identical to before.
- `robots.txt` allows `/en` (it only disallows `/api/`) and points to the one
  sitemap; `llms.txt` lists the English entry points in an "English version"
  section.
- Redirects (all 308, single hop, query and hash preserved, catch-all
  `src/app/$.tsx` + root `beforeLoad`): `/en/<untranslated>` -> Spanish route
  (legacy aliases are resolved in the same hop), `/EN`, `/En/x`, `/en//x` ->
  canonical spelling, `/en/` and `/en/x/` -> no trailing slash. Spanish URL
  handling is unchanged.
- Dynamic strings coming from loaders (FAQ of the methodology loader, district
  names, station names) are data and stay as delivered.

## Language selector

`LanguageSwitcher` in the header renders a plain `<a>` (full navigation) to the
other language of the *current* page when it has a twin, and nothing
otherwise. Plain anchors avoid the router `output` rewrite and give crawlers a
real link.

## Dictionary

`src/lib/i18n/`:

- `locales.ts` - locales, path helpers (`localizePath`, `stripLocalePrefix`,
  `isTranslatedPath`, ...). Pure, no React.
- `messages/<area>.ts` - one file per area (`nav`, `product`, `home`,
  `station`, `methodology`) exporting `{ es, en }` side by side. `en` is a
  `Partial` of the `es` keys, so a missing translation is a type-valid
  fallback and a stray English key is a type error.
- `messages/index.ts` - merges the areas, exposes `translate(locale, key,
  params)` (`{param}` interpolation, Spanish fallback).
- `use-locale.ts` - `useLocale()` / `useT()` for components.

Each area file is independent so that parallel copy changes (station page,
home, product copy) only conflict with the file of their own area. The Spanish
strings are the source of truth and moved verbatim from the components;
`product-copy.ts` keeps exporting the same Spanish constants.

## First delivery scope

Translated: i18n infrastructure, home page shell (hero, links, FAQ, SEO meta),
header and footer (navigation labels, aria labels, footer texts), station
sheet body and meta, methodology page static copy.

## Not translated yet (falls back to Spanish)

- Home child sections: `HomeStatusHero`, `HomeLiveSection`, `HomeDiagnosis`,
  `HomeMapSection`, `HomeFavoriteStations`, `NearbyBikesCta`,
  `HomeExploreSection` (+ `getExploreHubSections`).
- Station sheet: translated children are `StationStatusBadge` (via an optional
  `locale` on `getCitizenStatus`), `StationPredictionCard`, `StationDistrictComparison`,
  `StationBestTime`, `StationFavoriteButton`, `ShareButton`, `WhatsAppShareLink`,
  `DataStateNotice` (optional `locale` prop) and the `HeaderSearch` chrome. Still
  Spanish: the breadcrumb `aria-label` chrome and the server-provided search
  results (titles/groups) and district names.
- Methodology loader content (FAQ items, breadcrumbs, structured data) and
  `system-status.ts` labels.
- All other routes: dashboard, reports, compare, stats landings, SEO landings,
  legal pages, FAQ, API docs, MCP, `llms.txt`, feed, error/not-found pages,
  search, number/date formatting helpers in `lib/format.ts`.
- `product-copy.ts` has English entries; consumers still pass no locale and
  render Spanish until each area adopts `useT()`.

## Alineación con la guía de TanStack

References: TanStack Router guides *Internationalization (i18n)* and *URL
Rewrites*, and the `start-i18n-paraglide` example (SSR).

### Where we match

- **URL localization through `rewrite`**: `input` strips the locale prefix
  before route matching and `output` adds it back to generated hrefs, exactly
  the mechanism of the guides (Pattern 1) and of the example
  (`deLocalizeUrl` / `localizeUrl`). One route tree, no per-locale routes.
- **`publicHref` as the source of the public URL**: the locale is read from
  `location.publicHref` (root `beforeLoad` context, `useLocale`, the language
  switcher), as the rewrite guide recommends for canonical URLs and sharing.
- **Router per request**: `getRouter()` builds a new router for every SSR
  request and the same `rewrite` runs on server and client, so SSR and
  hydration produce the same hrefs.
- **`<html lang>` from the locale** (`getLocale()` in the example,
  `HTML_LANG[useLocale()]` here) and locale-aware head metadata per route.
- **Real prefixed URLs** for each language (`/en/...`), crawlable and
  cacheable, with `hreflang` and a sitemap that lists them.

### Justified differences

- **No Paraglide**: the decision is to keep a small typed dictionary
  (`messages/*.ts`, Spanish fallback per key). We need three translated
  routes, not a compiler, a message-format pipeline nor a generated runtime.
- **Locale detection**: the example's server middleware (`paraglideMiddleware`)
  resolves the locale from URL, cookie or `Accept-Language`, and may redirect.
  We use the URL only: no cookie, no `Accept-Language` redirect. This keeps
  pages cacheable and avoids cloaking-like behaviour for crawlers (Google
  recommends not redirecting by language/IP). Hence no server middleware.
- **Spanish stays unprefixed** (`localizeUrl` of the example prefixes every
  non-base locale only; ours is the same, but only for the routes in
  `TRANSLATED_ROUTE_PATTERNS`). A path outside the list is never prefixed and
  `/en/<it>` redirects to the Spanish URL, because `input` must not match
  pages that have no English content (soft duplicates).
- **Stateless `output`**: the guide's snippet reads the locale from a global
  (`getLocale()` backed by `AsyncLocalStorage`/URL). A module-level variable
  would leak between requests, and a variable set by `input` is wrong because
  the router also runs `input` for navigation targets (`navigate({ href })`,
  redirects) and for preloads, which would flip the locale of the page being
  displayed. `createLocaleRewrite(getCurrentPublicHref)` therefore keeps no
  state: `output` reads `router.latestLocation.publicHref` on every call
  (wired in `src/router.tsx`). Scenarios (initial hydration, `/en` -> page ->
  back, preload, concurrent routers) are covered in
  `tests/i18n-router-scenarios.test.ts` with a real in-memory router.
- **Known limit of the rewrite approach**: because `output` depends on the page
  you are on, a client-side navigation to an explicit `href` of the other
  language (`navigate({ href: '/en/metodologia' })` from a Spanish page) is
  generated without the prefix. Cross-language navigation therefore uses plain
  `<a>` (the language switcher, hreflang links, 308 redirects with `Location`)
  and never router `Link`s.
- **Offline-safe redirects / type-safe translated pathnames / prerender
  helpers** of the guide do not apply: slugs are not translated, the site is
  not prerendered per locale, and the app is not offline-first.

## Not verifiable without a real server

- 308 `Location` headers and the single-hop behaviour for `/en/...`,
  `/EN/...`, `/en/` and trailing-slash variants through the real Bun entry
  (`ops/start-server.mjs`) and the reverse proxy / CDN in front of it (it may
  normalize case or slashes before the app sees the request). The logic is
  unit-tested; the HTTP exchange is not.
- Rendered `<html lang>` and the final `<head>` on a streamed SSR response
  (tests cover the head functions and the rewrite, not the full document).
- Hydration of the language switcher `href` when the URL has a `#hash` (the
  hash does not exist on the server; `suppressHydrationWarning` is set).
- Google Search Console behaviour: acceptance of the `x-default` / `xhtml`
  sitemap annotations, indexing of `/en` and hreflang reciprocity reports.
- The `og:locale:alternate` rendering by social crawlers.
- Cache layers (CDN) honouring `Vary` / per-URL caching for `/en` pages.
