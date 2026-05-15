# Context — BiziDashboard Domain Model

## Core Domain

### City
A geographic deployment unit. Each city has its own PostgreSQL schema, GBFS endpoint, and independent data lifecycle.
- `CITIES`: `['zaragoza', 'madrid', 'barcelona']`
- `CITY_CONFIGS`: maps city key to display name and GBFS discovery URL.
- `DEFAULT_CITY`: `'zaragoza'`
- `isValidCity(value)`: type guard for city strings.
- `getCityFromPath(pathname)`: extracts city from URL path.

### Multi-City Schema Tenancy
Each city data lives in a separate PostgreSQL schema (e.g., `zaragoza`, `madrid`). The Prisma adapter routes queries to the correct schema via `search_path`.

### Station
A physical bike-share station.
- `id`: unique identifier (e.g., `'101'`).
- `name`: human-readable station name.
- `lat`, `lon`: geographic coordinates.
- `capacity`: total dock count.
- `isActive`: whether the station is operational.
- `createdAt`, `updatedAt`: lifecycle timestamps.
- `statuses`: reference to `StationStatus[]` for latest snapshots.

### StationStatus
A point-in-time snapshot of a station's availability.
- `id`: auto-incremented primary key.
- `stationId`: FK to `Station.id`.
- `bikesAvailable`: number of bikes at the station.
- `anchorsFree`: number of empty docks.
- `recordedAt`: timestamp from the GBFS snapshot.
- `createdAt`: database insertion time.
- `station`: reference back to `Station`.

### Shared Dataset Snapshot
A logical grouping of station statuses collected in the same GBFS poll cycle. Used for:
- Coverage calculation (how many days/stations have data).
- Data state decisions (empty, partial, complete).
- Fallback resolution when live data is stale.

### GBFS Ingestion
The pipeline that fetches, validates, and stores bike-share data.
1. **Discovery**: Fetch GBFS discovery JSON to find feed URLs.
2. **Station Status**: Fetch station availability data.
3. **Validation**: Run Five Pillars quality checks (completeness, freshness, consistency, range, schema).
4. **Storage**: Upsert stations, insert statuses with duplicate handling.
5. **Metrics**: Log observability data (polls, errors, coverage).

### GBFS Client
HTTP client for external bike-share APIs.
- `fetchDiscovery()`: retrieves feed configuration.
- `fetchStationStatus(discovery?)`: retrieves current station availability.
- SSRF protection: blocks private IPs, localhost, and IP literals.
- Retry logic with configurable max retries and base delay.
- Timeout wrapper for all HTTP requests.

### Data Validator
Orchestrates quality validation and storage.
- `validateAndStore(response, options)`: the main pipeline entry point.
- Five Pillars: completeness, freshness, consistency, range checks, schema validation.
- `ValidationResult`: success, stored flag, metrics, errors, warnings.
- `ValidateAndStoreOptions`: skipStorageOnError, sourceUrl, collectionId, schemaErrors.

### Data Storage
Database persistence layer.
- `storeStationStatuses(statuses)`: batch insert with duplicate handling via `skipDuplicates`.
- `upsertStations(stations)`: upsert station metadata.
- `getMissingStationIds(stationIds)`: identifies stations without metadata.
- `getSnapshotCount(recordedAt)`: counts statuses in a snapshot.
- `getRecentSnapshotSummaries(options)`: recent valid snapshots with optional min station count.

## Analytics Domain

### Ranking
Station ordering by a dimension (turnover, availability risk, etc.).
- `turnover`: ratio of bike usage to capacity.
- `availabilityRisk`: probability of a station running out of bikes or docking space.
- Aggregated per station, per period (day, month).

### Alert
A station condition that needs operational attention.
- `state`: `'empty'`, `'full'`, `'atRisk'`, `'resolved'`.
- `severity`: `'1'` (medium), `'2'` (critical).
- `stationId`: which station triggered it.
- `recordedAt`: when the condition was detected.
- `resolvedAt`: when the condition cleared (nullable).

### Mobility Signal
Patterns derived from aggregated station data.
- `hourlySignals`: demand patterns by hour of day.
- `dailyDemand`: demand curve over time.
- `monthlyDemand`: monthly demand aggregation.
- `systemHourlyProfile`: city-wide hourly demand profile.
- Used by: dashboard flow, conclusions, public API, mobile app.

### Conclusion
Operational insights derived from mobility signals.
- `highlights`: notable patterns (peaks, dips, anomalies).
- `demandTrend`: direction and magnitude of demand change.
- `occupancyInsights`: station fill-level patterns.
- `districtMapping`: which districts contribute most to patterns.
- `recommendations`: actionable operational guidance.

### Data State
A system-level indicator of data freshness and completeness.
- `'empty'`: no data available.
- `'partial'`: coverage is incomplete or stale.
- `'complete'`: data is fresh and covers expected stations.
- Driven by: shared dataset snapshot, coverage service, last-updated service.

## Security & Access Domain

### Public API Route
Anonymous read endpoints with optional elevated access.
- **Public read**: no key required (`/api/status`, `/api/stations`, `/api/rankings`, `/api/alerts`, `/api/patterns`, `/api/heatmap`).
- **Public elevated**: requires `X-Public-Api-Key` for CSV export, high limits, or long date ranges.
- Rate limited via Redis-backed sliding window.
- Request ID, IP extraction, user-agent logging, structured audit events.

### Mobile API Route
Authenticated mobile client endpoints.
- `Authorization: Bearer <accessToken>` via JWT.
- `X-Installation-Id` identifies the device.
- `REQUIRE_SIGNED_MOBILE_REQUESTS=true` enables HMAC signature verification.
- Signed requests include `timestamp` + `signature` in body.
- Token refresh with rotation and reuse detection (revokes installation on replay).

### Operations API Route
Manual operational endpoints.
- `X-Ops-Api-Key` or `X-Collect-Api-Key` required.
- `POST /api/collect`: triggers one data collection run.
- `GET /api/collect`: returns collection job state.

### Security Audit
Structured logging of security-relevant events.
- Auth failures, token reuse, invalid signatures, rate-limit denials.
- IP and user-agent stored as hashes, not plaintext.
- `recordSecurityEvent(event)`: persists audit events.

## UI / Presentation Domain

### Dashboard
The primary operational interface.
- **Views**: overview, stations, flow, conclusions, redistribucion.
- **Components**: DashboardClient, DashboardHeader, StatusBanner, map engine.
- **State**: URL state, selected station, filters, favorites, refresh countdown, geolocation, map viewport.
- **Modes**: different dashboard modes that change data presentation.

### SEO Landing Pages
Public pages for search engine indexing.
- `SEO_PAGE_SLUGS`: predefined slugs for discoverable pages.
- `SeoPageConfig`: title, description, keywords, CTA, cadence label.
- `pageRole`: `'ENTRY_SEO'`, `'HUB'`, `'DETAIL'`, `'DASHBOARD'`.
- Route files exist per slug; registry in `seo-pages.ts` + `routes.ts`.

### Public Navigation
Shared navigation structure for public pages.
- `appRoutes`: route builder functions for all public and dashboard paths.
- `INDEXABLE_PUBLIC_ROUTE_REGISTRY`: sitemap entries with change frequency and priority.
- `DASHBOARD_ROUTE_CONFIG`: dashboard sub-page navigation.

## Infrastructure Domain

### Prisma Schema
PostgreSQL ORM with multi-schema routing via `@prisma/adapter-pg`.
- Output: `src/generated/prisma`
- Models: `Station`, `StationStatus`, `Install`, `CollectionRun`, `SecurityEvent`, plus city-specific analytics tables.

### Cache Layer
Redis-backed caching for analytics queries.
- `withCache`: wraps queries with TTL and fallback behavior.
- Used by: API routes, server functions, dashboard loaders.

### Sentry
Error monitoring and performance tracing.
- Client: `@sentry/tanstackstart-react`.
- Server tracing: `tracesSampleRate: 0.2`.
- Source maps uploaded automatically if `SENTRY_AUTH_TOKEN` is set.

### Umami
GDPR-minimal web analytics.
- No free-text queries, no raw route params, no station/district IDs in events.
- No session replay or fingerprinting.
- Cookieless mode recommended for deployed instance.

## Technology Stack

- **Framework**: TanStack Start + TanStack Router + React 19
- **Build**: Vite 8 with TanStack Start/Router plugins
- **Runtime**: Bun 1.3.14 (local, CI, Docker)
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **Observability**: Sentry (errors/tracing), Umami (web analytics)
- **Deployment**: Docker multi-stage build, Bun runtime
