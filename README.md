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

## MCP Server (Dynamic Dashboard)

This repository includes an MCP server that wraps the existing REST API so an LLM client can request dashboards in natural language and fetch data on demand.

Start the MCP server over stdio (local MCP clients like Cursor):

```bash
pnpm mcp
```

Legacy alias (still supported):

```bash
pnpm mcp:dashboard
```

Start the MCP server over HTTP/SSE (remote agents):

```bash
pnpm mcp:http
```

Default HTTP endpoints:

- `http://localhost:3333/mcp`
- `http://localhost:3333/health`

Optional environment variables:

```env
# Base URL for the running Next.js app that serves /api/*
BIZIDASHBOARD_API_BASE_URL=http://localhost:3000

# HTTP timeout for MCP -> API calls
BIZIDASHBOARD_API_TIMEOUT_MS=20000

# OpenAPI source for dynamic MCP tools
OPENAPI_URL=http://localhost:3000/api/openapi.json

# Set to false to disable OpenAPI-generated tools
BIZIDASHBOARD_MCP_OPENAPI_ENABLED=true

# HTTP MCP host/port
BIZIDASHBOARD_MCP_HTTP_HOST=0.0.0.0
BIZIDASHBOARD_MCP_HTTP_PORT=3333
```

Main MCP tools:

- `build_dashboard_spec`: creates a dashboard JSON spec from a natural-language request.
- `generate_dashboard`: creates the spec and fetches live data for each widget.
  - Supports optional `customWidgets` so the model can generate ad-hoc KPI/table/timeseries panels from existing endpoints.
- `get_status`, `get_stations`, `get_rankings`, `get_alerts`, `get_patterns`, `get_heatmap`, `get_mobility`: direct API wrappers.

### Using the MCP server remotely

Use the HTTP transport when connecting remote agent frameworks (OpenAI Agents, LangChain, etc.).

Example OpenAI Agents configuration:

```ts
tools: [
  {
    type: "mcp",
    server_url: "http://localhost:3333/mcp"
  }
]
```

### Automatic MCP tool generation from OpenAPI

The MCP server can load tools dynamically from the OpenAPI document at
`/api/openapi.json`.

- Manual tools are still loaded first (backward compatibility).
- OpenAPI-generated tools are then added.
- Name conflicts are skipped automatically so existing manual tools keep priority.

This means that when you add a new API endpoint to the OpenAPI spec, it can become
available as an MCP tool without writing a manual MCP tool definition.

MCP usage examples:

1) Natural-language dashboard:

```text
Quiero un dashboard con estado del pipeline, top 10 por rotacion, alertas y heatmap para station 130
```

2) `generate_dashboard` with ad-hoc `customWidgets`:

```json
{
  "request": "Dashboard de operaciones con paneles personalizados",
  "customWidgets": [
    {
      "id": "rows_total",
      "title": "Filas totales del pipeline",
      "sourceEndpoint": "status",
      "mode": "kpi",
      "valuePath": "pipeline.totalRowsCollected"
    },
    {
      "id": "ocupacion_hora",
      "title": "Ocupacion media por hora",
      "sourceEndpoint": "patterns",
      "sourceParams": { "stationId": "130" },
      "mode": "timeseries",
      "xKey": "hour",
      "yKey": "occupancyAvg"
    },
    {
      "id": "alertas_tabla",
      "title": "Tabla de alertas",
      "sourceEndpoint": "alerts",
      "sourceParams": { "limit": 20 },
      "mode": "table",
      "collectionPath": "alerts",
      "limit": 20
    }
  ]
}
```

3) HTTP test for the live dashboard API:

```bash
curl -X POST "http://localhost:3000/api/dashboard/live" \
  -H "Content-Type: application/json" \
  -d '{
    "request": "Panel ad hoc",
    "customWidgets": [
      {
        "id": "rows_total",
        "title": "Filas pipeline",
        "sourceEndpoint": "status",
        "mode": "kpi",
        "valuePath": "pipeline.totalRowsCollected"
      }
    ]
  }'
```

Web UI tip:

- Open `http://localhost:3000/dashboard/live` and use "Widgets ad hoc (JSON opcional)" to paste `customWidgets` directly.

## Production Deployment (Docker Compose)

The provided `docker-compose.yml` is production-oriented and builds the app image from the local `Dockerfile` by default.

To use a published image instead, set `BIZIDASHBOARD_IMAGE` before running Compose (for example: `BIZIDASHBOARD_IMAGE=gcaguilar/bizidashboard:latest`).

It also includes:

- A Redis service with health checks.
- A one-shot migration service (`migrate`) that runs `prisma migrate deploy` on `/data/dev.db` before app startup.
- An app health check against `/api/status`.
- An external cron service (`collect-cron`) that triggers `POST /api/collect` every 30 minutes.
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

GBFS_DISCOVERY_URL=https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json
GBFS_REQUEST_TIMEOUT_MS=20000
GBFS_MAX_RETRIES=5
GBFS_RETRY_BASE_DELAY_MS=1000
```

`GOOGLE_SITE_VERIFICATION` is optional. Set it to your own token (with or without the
`.html` suffix) so forks can verify their own domain without code changes.

`ROBOTS_BASE_URL` is optional. When set, `robots.txt` host/sitemap and `sitemap.xml`
URL entries use this value.

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
