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
- `og:locale`: `es_ES` / `en_US`; JSON-LD `inLanguage`: `es` / `en`.
- `sitemap.xml`: adds the `/en...` URL of each translated route (home,
  methodology, every sitemap station). Spanish entries are unchanged.
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
- Station sheet children: `StationStatusBadge`, `StationPredictionCard`
  (`station-prediction-copy.ts`, `station-prediction-view.ts`),
  `StationFavoriteButton`, `WhatsAppShareLink`, `SiteBreadcrumbs` chrome.
- Methodology loader content (FAQ items, breadcrumbs, structured data) and
  `system-status.ts` labels.
- All other routes: dashboard, reports, compare, stats landings, SEO landings,
  legal pages, FAQ, API docs, MCP, `llms.txt`, feed, error/not-found pages,
  search, number/date formatting helpers in `lib/format.ts`.
- `product-copy.ts` has English entries; consumers still pass no locale and
  render Spanish until each area adopts `useT()`.
