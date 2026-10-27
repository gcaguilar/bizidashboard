# CONTEXT

Shared vocabulary for BiziDashboard. Use these names in code, reviews, and
architecture discussions. Architecture terms (module, interface, depth, seam,
adapter, leverage, locality) follow the `codebase-design` skill; the domain
terms below are the project's own.

## Domain

- **Station** — a docking station in a city's bikeshare network, with capacity,
  bikes available, and free anchors. Fichas live at `/estadisticas/estaciones`.
- **Network** — the whole set of a city's stations at a moment in time. "Network
  health/balance" describes availability, empty/full tension, and friction.
- **Pipeline** — the GBFS ingestion path (fetch → validate → store → roll up).
  "Pipeline health" is distinct from network balance: a healthy pipeline can
  carry an unbalanced network, and both are shown separately.
- **GBFS feed** — the third-party General Bikeshare Feed Specification source
  (`gbfs.json` discovery + station status/information feeds).
- **Snapshot** — one ingested `StationStatus` observation set, keyed by its
  `recordedAt`.
- **Alert** — a derived condition on a station (e.g. `LOW_BIKES`,
  `LOW_ANCHORS`) over a window, active or resolved.
- **Briefing** — the plain-language network summary shown to a reader; built by
  the network briefing module from stations, alerts, coverage and a baseline.
- **District / barrio** — an administrative area used to group stations.
- **Demand / mobility signals** — *estimates* of movement from net per-station
  bike changes; never individual observed trips.

## Deepened modules

These names describe modules that own behaviour behind a small interface.

- **CSV export module** (`src/lib/csv.ts`) — the single seam for CSV responses:
  spreadsheet-formula neutralization, cell escaping, `Content-Type`, and
  `Content-Disposition`. Callers pass headers and rows (`csvResponse`) or titled
  blocks (`csvSectionsResponse` for multi-table documents); they never hand-roll
  escaping.
- **Public API route seam** (`src/lib/security/public-api-route.ts`) — wraps a
  public handler with credential checks, rate limiting, and rate-limit headers.
  The seam applies those headers to the response, so a handler cannot drop
  them.
- **Cron job module** (`src/jobs/cron-job.ts`) — owns the schedule, Sentry cron
  monitor, start/stop lifecycle, and logging a scheduled job shares. A job
  supplies a monitor slug, log prefix, crontab expression, and a body. The lock
  stays inside the body, not the lifecycle.
- **Page data loaders** (`src/server-functions/*`) — server functions that load
  a page's data. Each degrades to a fallback payload when a source is unavailable.
- **Comparison hub module** (`src/lib/comparison-hub-builders.ts`) — owns the
  view-model interface (`ComparisonCard`, `ComparisonSection`,
  `InteractiveComparison*`, `ComparisonHubViewModelInput`) and the builders that
  fill it. `src/lib/comparison-hub.ts` is the adapter above the seam: it gathers
  the analytics rows, hands them over untouched, and re-exports the interface.
  Neither module imports the other. The view model also carries the citizen
  affordances: per-entity `bands` (traffic-light franjas) and `metrics`, the
  synthetic `Media de <ciudad>` district option, period `scopes` per ámbito, and
  the one-click `presets`.
- **Comparison verdict module** (`src/lib/comparison-verdict.ts`) — pure
  `buildComparisonVerdict({ dimensionId, left, right })`, client-safe. Turns two
  comparable options into the natural-language conclusion, detail and
  recommendation shown in the hero; it reads only the view-model fields, so the
  UI recalculates it on selection without a server round trip.
- **Station comparison series** (`getStationHourlyProfiles`,
  `getStationDailyDemand` in `src/analytics/queries/read.ts`, wrapped by
  `fetchCachedStationHourlyProfiles` / `fetchCachedStationDailyDemand`) — the
  per-station hourly and daily reads that feed the "efecto marea" and the
  "hoy vs. mismo día de la semana" comparisons. The adapter aggregates them into
  the compact per-entity bands and period options, so raw rows never reach the
  client payload.
- **Station network read** (`getStationsWithLatestStatus` /
  `getStationWithLatestStatus` in `src/analytics/queries/read.ts`, wrapped by
  `fetchCachedStationsWithLatestStatus` in `src/lib/analytics-series.ts`) — the
  whole network (or a single station) joined with its latest snapshot. Public
  API routes and predictions go through the 60 s cached wrapper; the rollup
  jobs call the query directly, since they need the point-in-time truth, not a
  cached payload.
- **SEO landing module** (`src/lib/seo-landing.server.tsx`) — one content
  builder per slug, pure over `SeoLandingSources`
  (`src/lib/seo-landing-sources.server.ts`). The live adapter owns the fetches
  and the per-source degradation, so content assembly is testable with a fixture
  adapter. Station reducers (occupancy, bike sums, orderings) live once.
- **Shared data module** (`src/services/shared-data`) — owns the coverage and
  pipeline reads plus the shape of `getSharedDatasetSnapshot()`,
  `buildFallbackStatus()` and `buildFallbackHistoryMetadata()`. The degraded
  payloads are built here, once; loaders import this module instead of
  re-declaring the empty pipeline.
- **Format module** (`src/lib/format.ts`) — the single home for number, ratio and
  delta formatting and numeric coercion: `toNumber`, `roundTo`,
  `formatRatioDelta` (with a caller-supplied missing-reference fallback),
  `average` and `averageOrNull`. Callers never re-implement sign, rounding or the
  coercion of raw SQL values.
- **Station demand SQL** (`src/analytics/queries/demand-sql.ts`) — the single
  definition of a station's demand difference (`(bikesMax - bikesMin) +
  (anchorsMax - anchorsMin)`) and its aggregates. Rankings, reports and
  conclusions compose these fragments; no query re-inlines the formula.
- **Rebalancing report module** (`src/lib/rebalancing-report.ts`) — assembles the
  15-day diagnostic from the analytics reads and owns its cache policy
  (stale-while-revalidate, 5 min soft / 6 h hard) behind
  `buildRebalancingReport(options)`. The 6 h hard TTL is only a safety net: the
  `rebalancing-prewarm` cron (`src/jobs/rebalancing-prewarm.ts`) refreshes the
  base report every 15 minutes, so a visitor never waits for the aggregation.
  The public landing does **not** use this module: it reads
  `getRebalancingAvailabilitySummary` (`src/analytics/queries/rebalancing.ts`),
  which returns the three scalars the page shows from the hourly rollup alone.
- **Monthly report module** (`src/lib/monthly-report.ts`) — owns report assembly
  behind `buildMonthlyReport(monthKey, nowIso, sources)`. `MonthlyReportSources`
  (`src/lib/monthly-report-sources.ts`) is the port a live or in-memory adapter
  fills; the module owns the per-source degradation policy, so it stays testable
  through one interface. It also owns the cache policy behind the same function:
  the month in progress uses stale-while-revalidate (10 min soft / 6 h hard), a
  closed month is sealed with no Redis expiry and backed by the
  `MonthlyReportSnapshot` Postgres L2, and
  `invalidateMonthlyReport(monthKey)` drops both cache keys and the snapshot.
  Pure helpers (seasonality, practical conclusions, redistribution) are internal.
- **Monthly report export module** (`src/lib/monthly-report-export.ts`) — owns
  the mapping from `MonthlyReport` to flat export tables (`CsvSection`), the
  section ids and their titles. Pure over the payload; the route and the UI only
  ask for sections, never build rows. `src/app/api/reports` is the adapter that
  turns those sections into a CSV document or a JSON payload through the CSV
  seam.
- **Monthly report PDF module** (`src/lib/monthly-report-pdf.ts`) — owns the
  server-side table PDF layout of a `MonthlyReport` (`buildMonthlyReportPdf`)
  and its filename. Pure over the payload and the export tables; it normalizes
  the typographic characters the WinAnsi font cannot draw and paginates tables
  and prose. No HTTP, no browser binary. It is the fallback when the page
  renderer is unavailable, and the PDF linked from the digest email.
- **Report page PDF renderer** (`src/lib/monthly-report-page-pdf.ts`) — opens
  the public report page in headless Chromium and prints it to A4 with the
  page's print rules, so the exported document is the report the reader sees
  (layout, charts and figures). Server-only; it does not know about storage or
  HTTP.
- **Report page PDF client fallback** (`src/lib/report-pdf-download.ts`) — when
  the API cannot render the page and answers `X-Report-Pdf: table`, the export
  bar captures the rendered page with html2pdf.js (html2canvas + jsPDF) so the
  reader still gets the web design. It resolves the SVG `var(--token)` colours
  html2canvas would lose; its output is raster, which is why it is only the
  fallback. Browser-only.
- **Monthly report PDF store** (`src/lib/monthly-report-pdf-store.ts`) — owns
  persistence of one public PDF per closed month (`MonthlyReportPdf`). The
  reports API serves the stored bytes and, if they are missing, renders the
  page once, stores the result and returns it. The seal job warms the newest
  closed months; older months fill in on their first download.
- **Social daily agent module** (`src/lib/social/*`, `src/jobs/social/*`) — the
  deterministic four-slot publisher for Instagram through Buffer: morning and
  afternoon stories, a Monday carousel and a first-of-month carousel. The
  `src/lib/social/*` files own the pure domain (config, aggregation, Spanish
  copy, render, media/Buffer ports, state contract); `src/jobs/social/*` are the
  adapters that read analytics and assemble each slot, with `shared.ts` owning
  the claim → render → upload → publish → mark lifecycle. State is a local
  SQLite file behind `StateStore` (never Postgres writes), images go to
  tmpfiles and posts to Buffer. The single entry seam is `runSocialSlot(...)`;
  the four Sentry cron monitors are `social-morning`, `social-afternoon`,
  `social-weekly` and `social-monthly`. Failures skip and report, never publish
  stale data, and a stale `publishing` row is never reclaimed automatically.

## Contracts that must hold

- Public routes in `docs/product/datosbizi-observatorio.md` are fixed: do not
  rename, remove, or let them fail.
- `/api/*` response contracts are not changed without an explicit decision.
