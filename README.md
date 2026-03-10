# BiziDashboard

BiziDashboard is an experimental, vibe-coded project for evaluating data ingestion and analytics workflows over the public Bizi Zaragoza GBFS feeds.

The repository is intended for rapid iteration and technical validation. It is used to test collection reliability, storage behavior, API contracts, and dashboard rendering under realistic conditions.

## Overview

This project provides a full prototype pipeline:

1. Collect live GBFS data (`station_status`, `station_information`).
2. Persist snapshots and station metadata.
3. Expose processed data through REST-style API routes.
4. Visualize operational and analytical metrics in a web dashboard.

## Scope and Intended Use

- Validate ingestion against an external API.
- Test schema validation and retry strategies.
- Evaluate analytical endpoints (rankings, alerts, patterns, heatmaps).
- Exercise dashboard functionality using near real-time data.
- Support architecture and implementation experiments before production hardening.

## Technology Stack

- Next.js (App Router) and React
- TypeScript
- Prisma with SQLite/libSQL adapter
- Redis cache layer (optional)
- Vitest for automated tests

## Local Development

Create a local environment file:

```bash
cp .env.example .env
```

Suggested `.env.example` values:

```env
# App
NODE_ENV=development
APP_URL=http://localhost:3000
ROBOTS_BASE_URL=http://localhost:3000
GOOGLE_SITE_VERIFICATION=

# Database (local)
DATABASE_URL=file:./dev.db

# Redis (optional for local)
REDIS_URL=redis://localhost:6379

# Internal jobs
ENABLE_INTERNAL_JOBS=false

# Manual collect trigger security
COLLECT_API_KEY=change-me
COLLECT_RATE_LIMIT_MAX=6
COLLECT_RATE_LIMIT_WINDOW_MS=60000

# GBFS source and request tuning
GBFS_DISCOVERY_URL=https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json
GBFS_REQUEST_TIMEOUT_MS=20000
GBFS_MAX_RETRIES=5
GBFS_RETRY_BASE_DELAY_MS=1000
```

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Common development commands:

```bash
pnpm test
pnpm lint
pnpm build
pnpm db:health
```

## Dashboard Web

The application currently ships the classic dashboard at:

- `http://localhost:3000/dashboard`

The dashboard includes:

- System health and ingestion status.
- Station map with live availability.
- Active alerts and bottleneck rankings.
- Hourly patterns and occupancy heatmap by station.
- Mobility flow analysis and daily demand curve.

Additional transport dashboards are available at:

- `http://localhost:3000/dashboard/transporte/bus`
- `http://localhost:3000/dashboard/transporte/tranvia`

These transport views provide complete network coverage, operational alerts, criticality rankings,
hourly patterns, and temporal heatmaps for Zaragoza bus and tram stops.

## Production Deployment (Docker Compose)

The provided `docker-compose.yml` is production-oriented and builds the app image from the local `Dockerfile` by default.

To use a published image instead, set `BIZIDASHBOARD_IMAGE` before running Compose (for example: `BIZIDASHBOARD_IMAGE=gcaguilar/bizidashboard:latest`).

It also includes:

- A Redis service with health checks.
- A one-shot migration service (`migrate`) that runs `prisma migrate deploy` on `/data/dev.db` before app startup.
- An app liveness health check against `/api/health/live` (no DB calls).
- A readiness probe at `/api/health/ready` (verifies DB connectivity).
- An external cron service (`collect-cron`) that triggers `POST /api/collect` every 30 minutes using `x-collect-api-key`.
- Persistent app database storage via the `app-data` Docker volume mounted at `/data`.

The container entrypoint also bootstraps SQLite on startup: if `DATABASE_URL` is missing or points to a relative SQLite path, it falls back to `file:/data/dev.db` and initializes it from `/app/bootstrap.db` when the file is empty or missing.

Run in production mode:

Example production `.env` values:

```env
NODE_ENV=production
APP_URL=https://your-domain.example
ROBOTS_BASE_URL=https://your-domain.example
GOOGLE_SITE_VERIFICATION=

# In compose this is overridden to file:/data/dev.db
DATABASE_URL=file:/data/dev.db

# Redis service from docker-compose
REDIS_URL=redis://redis:6379

# Required in production for POST /api/collect
COLLECT_API_KEY=use-a-long-random-secret
COLLECT_RATE_LIMIT_MAX=6
COLLECT_RATE_LIMIT_WINDOW_MS=60000

GBFS_DISCOVERY_URL=https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json
GBFS_REQUEST_TIMEOUT_MS=20000
GBFS_MAX_RETRIES=5
GBFS_RETRY_BASE_DELAY_MS=1000

TRAM_STOPS_URL=https://www.zaragoza.es/sede/servicio/urbanismo-infraestructuras/transporte-urbano/parada-tranvia.json
BUS_STOPS_URL=https://www.zaragoza.es/api/recurso/urbanismo-infraestructuras/transporte-urbano/poste.json?srsname=wgs84
BUS_REALTIME_BASE_URL=https://www.zaragoza.es/sede/servicio/urbanismo-infraestructuras/transporte-urbano/poste-autobus
BUS_STOPS_CACHE_TTL_MS=21600000
TRANSIT_REQUEST_TIMEOUT_MS=12000
TRANSIT_MAX_RETRIES=2
TRANSIT_RETRY_BASE_DELAY_MS=500
TRANSIT_LINK_REFRESH_MINUTES=360
TRANSIT_MAX_LINK_DISTANCE_METERS=200
TRANSIT_EVENT_WINDOW_MINUTES=12
TRANSIT_SNAPSHOT_STALE_MINUTES=45
BUS_REALTIME_MAX_CONCURRENCY=8
BUS_REALTIME_BATCH_SIZE=80
TRANSIT_IMPACT_BACKFILL_HOURS=6
TRANSIT_SNAPSHOT_RETENTION_DAYS=45
TRANSIT_IMPACT_RETENTION_DAYS=365
```

`GOOGLE_SITE_VERIFICATION` is optional. Set it to your own token (with or without the
`.html` suffix) so forks can verify their own domain without code changes.

`ROBOTS_BASE_URL` is optional. When set, `robots.txt` host/sitemap and `sitemap.xml`
URL entries use this value.

`COLLECT_API_KEY` is required in production. Requests to `POST /api/collect` must include
the `x-collect-api-key` header with that exact value.

`/api/status` is intended for observability dashboards. Container health checks should use
`/api/health/live` (liveness) and optionally `/api/health/ready` (readiness).

```bash
docker compose up -d
```

## Project Status

This repository is a prototype-oriented codebase. While functional, interfaces and internal implementation details may change as experimentation continues.

External API availability and payload changes may affect runtime behavior.

## Contributing

Contributions are welcome for improvements in reliability, observability, API design, and developer experience. Please open an issue or pull request describing the proposed change and rationale.

## License

This project is licensed under the GNU General Public License v3.0 (GPLv3).
See `LICENSE` for details.
