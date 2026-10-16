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
  `Content-Disposition`. Callers pass headers and rows; they never hand-roll
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
  a page's data. Each degrades to a fallback payload from the shared-data
  fallbacks module when a source is unavailable.

## Contracts that must hold

- Public routes in `docs/product/datosbizi-observatorio.md` are fixed: do not
  rename, remove, or let them fail.
- `/api/*` response contracts are not changed without an explicit decision.
