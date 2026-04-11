# 🚲 BiziDashboard

**BiziDashboard** is a multi-city analytics platform designed for real-time monitoring and historical data ingestion of shared bicycle systems using the **GBFS (General Bikeshare Feed Specification)** standard. 

Originally built for Zaragoza, it is now a generic, multi-tenant engine capable of supporting any city globally (Zaragoza, Madrid, Barcelona, NYC, Chicago, etc.) through independent PostgreSQL schemas.

---

## 🏗️ Project Architecture

The system is built on four core pillars:

1. **Ingestion Engine**: Light, standalone cron tasks (via Bun or Alpine/curl) that trigger periodic GBFS snapshots via the protected `GET/POST /api/collect` endpoint.
2. **Storage Layer**: PostgreSQL with **Multi-Tenant by Schema** capability. Isolation is handled at the database level: each city has its own schema and tables.
3. **Analytics Core**: Specialized SQL aggregations (Rankings, Trends, Alerts, Heatmaps, Mobility Signals) optimized for time-series bike availability data.
4. **Visual Dashboard**: A Next.js (App Router) interface with real-time station statuses, historical graphs, and mobility reports.

---

## 📱 Mobile App Integration

This project exposes specialized analytical APIs that power the **[BiziMobile](https://github.com/gcaguilar/bizimobile)** application. When a station is empty, the mobile app uses our predictions and mobility signals to help users find the nearest available bike with high confidence using historical occupancy patterns.

Mobile clients must keep sending `Authorization: Bearer <accessToken>` together with `X-Installation-Id` on authenticated endpoints. The geo endpoints (`POST /api/geo/search` and `POST /api/geo/reverse`) now also support signed requests with `timestamp` + `signature`; the server can enforce them in production with `REQUIRE_SIGNED_MOBILE_REQUESTS=true`, so the app should implement this flow before the flag is enabled.

Refresh tokens are no longer stored in plaintext in the database. The backend persists only `refreshTokenHash`, rotates refresh tokens on every successful refresh, and revokes the installation if it detects refresh token reuse. Mobile clients should avoid parallel refresh flows that may replay an already-rotated token.

---

## 🔐 Operational Security & API Access

- Every API response includes `X-Request-Id`. Clients may send their own `X-Request-Id` to correlate calls, logs, Sentry traces, and persisted security events.
- `GET /api/collect` and `POST /api/collect` require `X-Ops-Api-Key`. `x-collect-api-key` is still accepted as a temporary compatibility alias for existing cron jobs.
- Low-cost read endpoints remain anonymous: `GET /api/status`, `GET /api/stations`, `GET /api/rankings`, `GET /api/alerts`, `GET /api/patterns`, `GET /api/heatmap`, `GET /api/openapi.json`, `GET /api/docs`, and `GET /api/app-versions`.
- Elevated public access requires `X-Public-Api-Key` on:
  - `GET /api/stations?format=csv`
  - `GET /api/rankings?format=csv`
  - `GET /api/rankings` when `limit > 100`
  - `GET /api/alerts` when `limit > 100`
  - `GET /api/history?format=csv`
  - `GET /api/rebalancing-report?format=csv`
  - `GET /api/rebalancing-report` when `days > 30`
  - `GET /api/alerts/history` when `format=csv` or `limit > 500`
  - `GET /api/mobility` when `mobilityDays > 30` or `demandDays > 60`
- `GET /api/health/live` and `GET /api/health/ready` stay unauthenticated for orchestration probes, but only expose probe-safe payloads. Use `GET /api/status` for richer operational visibility.
- Sensitive routes (`/api/install/register`, `/api/token/refresh`, `/api/geo/*`, `/api/collect`, and elevated public routes) use shared Redis-backed rate limiting, structured audit events, and explicit CORS allowlists for mobile/auth surfaces.

---

## 🧾 Traceability & Observability

- `Install` now stores `refreshTokenHash`, `refreshTokenIssuedAt`, `lastSeenAt`, `lastAuthAt`, `revokedAt`, and `publicKeyFingerprint`.
- `CollectionRun` persists each ingestion lifecycle with `collectionId`, trigger (`cron` or `manual`), `requestId`, snapshot metadata, counters, warnings, errors, and timestamps.
- `SecurityEvent` stores operational audit events such as auth failures, token reuse, invalid signatures, rate-limit denials, and manual collection triggers. IP and user-agent are stored as hashes, not plaintext.
- Server logs are emitted as structured JSON to stdout and Sentry sampling is configurable per runtime through env vars instead of fixed `1.0` sampling.
- Production startup validates critical runtime configuration, including `JWT_SECRET`, `SIGNATURE_SECRET`, `OPS_API_KEY`/`COLLECT_API_KEY`, `REDIS_URL`, and a valid `APP_URL`.

### Web analytics

- Public web analytics uses Umami with a GDPR-minimal event contract: no free-text queries, no raw route params, no station or district IDs in custom dashboard events, and no session replay/fingerprinting.
- Keep the deployed Umami instance in cookieless mode and avoid storing identifiable IP data. If legal or security cannot validate that setup, audit the current tracking first and do not expand event coverage.

---

## 🌍 Supported Cities

The project natively supports multiple cities out of the box. To switch cities, configure these environment variables:

| City | `CITY` Key | `GBFS_DISCOVERY_URL` |
| :--- | :--- | :--- |
| **Zaragoza** | `zaragoza` | `https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json` |
| **Madrid** | `madrid` | `https://madrid.publicbikesystem.net/customer/gbfs/v2/gbfs.json` |
| **Barcelona** | `barcelona` | `https://barcelona-sp.publicbikesystem.net/customer/gbfs/v2/gbfs.json` |

---

## 📍 Nominatim Geocoding

The public `nominatim.openstreetmap.org` service has a strict usage policy. In practice, to avoid `403` responses you should configure the app with a real application identity and stay below **1 request per second** across the whole deployment.

- Set `APP_URL` to the public origin of the app so outgoing requests include a valid `Referer`.
- Set `NOMINATIM_CONTACT_EMAIL` in production so the requests are contactable.
- Avoid client-side autocomplete patterns against the public API. Repeated per-keystroke searches can get blocked.
- If you expect higher volume, point `NOMINATIM_BASE_URL` to your own Nominatim instance or another provider.

---

## 🛠️ PostgreSQL Developer Guidelines

Since the project uses **PostgreSQL**, strict rules apply when writing raw SQL queries to avoid syntax errors:

### 1. Quoting Identifiers (Case Sensitivity)
Postgres requires double quotes for `camelCase` table and column names. Unquoted names are lowercased by default.
- ✅ **Correct**: `SELECT "stationId" FROM "StationStatus"`
- ❌ **Incorrect**: `SELECT stationId FROM StationStatus`

### 2. BigInt & Type Safety
Aggregations like `SUM()` and `COUNT()` return **BigInt** (Int8). Always cast to `Number()` in TypeScript to avoid math or serialization errors.
- ✅ **Correct**: `const total = Number(row.totalCount)`

### 3. PostgreSQL Date Handling
Use `TO_CHAR` for consistent date formatting instead of SQLite-specific functions:
- ✅ **Correct**: `TO_CHAR("recordedAt", 'YYYY-MM-DD')`

### 4. Transaction-Safe Maintenance
Do **not** use `VACUUM`. Use `ANALYZE` for maintaining query planner statistics, as it is safe to run inside transactions.

---

## 🚀 Deployment (Docker Compose)

The architecture supports multiple isolated city deployments in a single `docker-compose.yml`:

### Isolated Services
Each city runs its own container, allowing independent scaling and city-specific SEO:

```yaml
services:
  zaragoza-app:
    environment:
      - CITY=zaragoza
      - DATABASE_URL=postgresql://user:pass@postgres:5432/bizidashboard
      - Port: 3000
  
  madrid-app:
    environment:
      - CITY=madrid
      - DATABASE_URL=postgresql://user:pass@postgres:5432/bizidashboard
      - Port: 3001
```

### Automatic Schema Isolation
When a city container starts, it automatically executes `SET search_path TO "city-name"`, ensuring isolation within a shared database instance.

### Repairing `StationStatus` Indexes In Docker
If a schema drift leaves `StationStatus` with an incorrect unique index on `"stationId"` alone, snapshots can look like full duplicates even when bike/dock counts change.

Inside the app container you can diagnose the live schema with:

```bash
bun /app/ops/fix-station-status-indexes.ts
```

And apply the repair with:

```bash
bun /app/ops/fix-station-status-indexes.ts --apply
```

The script targets the schema from `CITY`, drops unexpected `UNIQUE ("stationId")` constraints or indexes, removes exact duplicate rows for the same `("stationId", "recordedAt")`, and recreates the expected indexes for `StationStatus`.

If the app accidentally wrote live data into `public` instead of the city schema, you can backfill the current city schema from `public` with:

```bash
bun /app/ops/move-public-schema-to-city.ts
```

And apply the copy with:

```bash
bun /app/ops/move-public-schema-to-city.ts --apply
```

This copies operational tables from `public` into the schema from `CITY` and leaves the source rows untouched so you can validate the backfill before cleaning anything up.

---

## ➕ Adding New Lyft/GBFS Systems

Adding a new compatible city is easy:

1. Update `CITIES` and `CITY_CONFIGS` in `src/lib/constants.ts`.
2. Find the system's `gbfs.json` URL.
3. Deploy a new Docker service instance with the corresponding `CITY`, `GBFS_DISCOVERY_URL`, `REDIS_URL`, `APP_URL`, and operational secrets.
4. Run migrations for the new schema:
   ```bash
   DATABASE_URL="postgresql://user:pass@host:5432/db?schema=newcity" npx prisma migrate deploy
   ```

---

## ⚙️ Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Runtime**: Bun (Production) / Node (Build)
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Testing**: Vitest

---

## 🧬 Observability (Sentry)

Sentry is used for real-time error monitoring across both client and server.

- **Setup**:
  - `NEXT_PUBLIC_SENTRY_DSN` for browser events.
  - `SENTRY_DSN` for server/edge events (falls back to `NEXT_PUBLIC_SENTRY_DSN` if not set).
- **Sampling**:
  - `SENTRY_TRACE_SAMPLE_RATE`
  - `NEXT_PUBLIC_SENTRY_TRACE_SAMPLE_RATE`
- **Source Maps**: During production builds, if a `SENTRY_AUTH_TOKEN` is found, the build will automatically upload source maps for easier debugging.
- **Docker note**: `NEXT_PUBLIC_*` variables are compiled at build-time. When building Docker images, pass them through `build.args` (not only runtime env).
- **CSP compatibility**: keep Sentry delivery endpoints allowed in `connect-src` (including ingest and tunnel path `/monitoring`) when hardening CSP.

## 📈 Analytics (Umami)

Umami is loaded only in production and only when both variables are configured:

- `NEXT_PUBLIC_UMAMI_SCRIPT_SRC` (default suggested: `https://cloud.umami.is/script.js`)
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID`

If you enforce CSP, allow Umami domains in `script-src` and `connect-src` (`cloud.umami.is` and `api-gateway.umami.dev` for cloud setups).

## 🛡️ CSP rollout strategy

To avoid telemetry regressions while tightening CSP:

- Keep Sentry and Umami domains explicitly allowlisted.
- Use `CSP_REPORT_ONLY=true` first to emit `Content-Security-Policy-Report-Only`.
- Review violations in staging, then enable strict enforcement in production.

---

## ✅ CI quality gates

Main CI currently runs:

- lint + unit tests + build

Additional QA gates are available as scripts (`qa:validate:site-env`, `qa:audit`, `qa:audit:check`, `security:audit`) and can be executed locally or in dedicated workflows.

For production vitals checks, `qa:vitals:prod` captures FCP/LCP/CLS plus INP and TTFB, and `qa:vitals:check` enforces thresholds.

---

## 📜 License

Licensed under the **GNU General Public License v3.0 (GPLv3)**.
