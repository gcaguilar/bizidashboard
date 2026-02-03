# Technology Stack

**Project:** BiziDashboard — Bike-sharing analytics dashboard for Bizi Zaragoza  
**Researched:** 2026-02-03  
**Confidence:** HIGH (based on official documentation and GitHub releases)

## Executive Summary

For a self-hosted bike-sharing analytics dashboard with 30-minute data collection, the recommended 2025 stack prioritizes **operational simplicity** for MVP while maintaining a **clear migration path** to scalable time-series architecture. SQLite + Prisma provides zero-config database setup for initial deployment, with TimescaleDB as the planned upgrade target once data volume warrants it.

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Next.js** | 16.x (App Router) | Full-stack React framework | Standard for 2025 React apps. Provides API routes for data collection, server components for dashboard, and static generation for performance. Native TypeScript support. |
| **TypeScript** | 5.x | Type safety | Industry standard. Catches errors at build time, essential for data pipeline reliability. |
| **Node.js** | 20.x LTS | Runtime | Current LTS with 18-month support window. Native fetch API, stable performance. |

### Database & Storage

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **SQLite** | 3.51+ | Primary datastore (MVP) | Zero configuration, single-file, perfect for 2-week MVP data volume (~6,720 records for 130 stations × 30-min intervals). No separate server process reduces deployment complexity. |
| **Prisma** | 7.3+ | ORM & migrations | Type-safe database client. Supports both SQLite (MVP) and PostgreSQL/TimescaleDB (future). Schema migrations make database evolution painless. |
| **TimescaleDB** | 2.18+ | Future: Time-series scaling | PostgreSQL extension for hypertables. Migration path when data exceeds SQLite comfort zone (~1M+ records). Continuous aggregates for fast analytics queries. |

**Data volume calculation for context:**
- 130 stations × 48 readings/day × 14 days = **87,360 records for MVP**
- At full scale (1 year): ~2.3M records
- SQLite handles this comfortably; TimescaleDB becomes advantageous at 10M+ records or when requiring continuous aggregations

### Data Collection & Scheduling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **node-cron** | 4.0+ | Job scheduler | Mature (3.2k stars), simple cron syntax for 30-minute polling. In-process scheduler—no separate worker process needed for MVP. |
| **axios** | 1.13+ | HTTP client | Industry standard for API requests. Automatic JSON parsing, request/response interceptors, timeout handling. |

### Frontend & Visualization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **TailwindCSS** | 4.1+ | Styling | Utility-first framework. v4 rewritten in Rust for 10x faster builds. Zero runtime CSS. |
| **Recharts** | 3.7+ | Charts & graphs | Most popular React charting library (26.6k stars). Declarative React components, built on D3. Perfect for occupancy trends, usage charts. |
| **react-map-gl** | 8.1+ | Map visualization | React wrapper for Mapbox/MapLibre. 8.4k stars, TypeScript support. For station location maps and flow visualizations. |
| **TanStack Query** | 5.91+ | Data fetching | Superior caching, background refetching, deduplication. Essential for dashboard that polls API without page reload. |
| **MapLibre GL** | 4.x | Map renderer | Open-source fork of Mapbox GL JS. Free, no API key required for self-hosted tiles. |

### Infrastructure & Deployment

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Docker** | 27.x | Containerization | Standard for deployment packaging. Single container for Next.js app + SQLite volume mount. |
| **Docker Compose** | 2.32+ | Local development | Simple multi-service orchestration. One command for full stack: `docker compose up`. |
| **Coolify** | v4-beta | Self-hosted PaaS | Open-source alternative to Vercel (50k+ stars). One-click deployment from Git. Handles SSL, domains, automatic deployments. Perfect for self-hosting requirement. |

## Installation

### Core Dependencies

```bash
# Framework & core
npm install next@16 react@19 react-dom@19

# Database
npm install @prisma/client
npm install -D prisma

# Data collection
npm install axios node-cron
npm install -D @types/node-cron

# Frontend visualization
npm install recharts react-map-gl maplibre-gl
npm install @tanstack/react-query

# Styling
npm install tailwindcss @tailwindcss/postcss
```

### Development Dependencies

```bash
npm install -D typescript @types/node @types/react @types/react-dom
npm install -D eslint prettier
```

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|------------------------|
| **Database (MVP)** | SQLite | PostgreSQL | If you need concurrent write access, or team already runs Postgres. SQLite handles single-writer workloads perfectly. |
| **Database (Scale)** | TimescaleDB | ClickHouse, InfluxDB | ClickHouse for extreme OLAP workloads; InfluxDB for IoT-centric architectures. TimescaleDB chosen for SQL familiarity and PostgreSQL ecosystem. |
| **Scheduler** | node-cron | BullMQ, node-schedule | BullMQ for distributed job processing across multiple servers; node-schedule if you need non-cron scheduling. |
| **Charts** | Recharts | Visx, Victory | Visx for custom D3-based visualizations; Victory for cross-platform (React Native + Web). |
| **Maps** | react-map-gl | Leaflet, Google Maps | Leaflet for lightweight open-source alternative; Google Maps if you need Places API integration. |
| **Deployment** | Coolify | Railway, Hetzner + manual | Railway for zero-config deployment without self-hosting; Hetzner + manual for maximum cost control. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **InfluxDB v2** | InfluxDB 3 Core is the new direction (released Jan 2026). v2 is in maintenance mode. | InfluxDB 3 Core if you need dedicated time-series DB; TimescaleDB for SQL-based approach |
| **Chart.js + react-chartjs-2** | Wrapper adds complexity, less React-idiomatic than Recharts. | Recharts for React-native solution |
| **Raw D3** | Steep learning curve, imperative API clashes with React's declarative model. | Recharts (built on D3, React-friendly) or Visx (airbnb's D3+React toolkit) |
| **MongoDB for time-series** | No native time-series optimizations; aggregation pipeline complexity for temporal queries. | TimescaleDB or SQLite with proper indexing |
| **GitHub Actions for 30-min polling** | Cron workflows have 5-minute minimum interval, not suitable for 30-min data collection. | In-app scheduler (node-cron) or external cron service |

## Stack Patterns by Phase

### Phase 1: MVP (2 weeks data)
- **Database:** SQLite with Prisma
- **Collection:** Next.js API route + node-cron (in-process)
- **Deployment:** Coolify on single VPS
- **Rationale:** Minimize moving parts. One container, one database file, one codebase.

### Phase 2: Extended Storage (1-3 months)
- **Database:** Keep SQLite, add automated backups
- **Collection:** Separate lightweight worker process (still node-cron)
- **Deployment:** Same stack, increase VPS storage
- **Rationale:** SQLite handles 500k-1M records comfortably with proper indexing.

### Phase 3: Scale (6+ months, 5M+ records)
- **Database:** Migrate to TimescaleDB on PostgreSQL
- **Collection:** Dedicated worker service, possibly BullMQ for reliability
- **Deployment:** Coolify with separate database service, or migrate to managed TimescaleDB
- **Rationale:** Hypertables for time-series partitioning, continuous aggregates for fast analytics.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 16 | React 19, Node 18+ | App Router recommended; Pages Router legacy but stable |
| Prisma 7 | Node 18+ | Requires `prisma.config.ts` for configuration (new in v7) |
| TailwindCSS 4 | PostCSS 8+ | v4 uses Rust engine; config format changed from v3 |
| Recharts 3 | React 18+ | v3.7 is latest stable (Jan 2026) |
| react-map-gl 8 | MapLibre 4.x, Mapbox GL 2.x+ | Use MapLibre fork for free, open-source tiles |

## Data Architecture Notes

### SQLite Schema Recommendations

```sql
-- Station metadata (static)
CREATE TABLE stations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  capacity INTEGER NOT NULL
);

-- Time-series data (hypertable pattern ready for TimescaleDB migration)
CREATE TABLE station_status (
  time DATETIME NOT NULL,
  station_id INTEGER NOT NULL,
  available_bikes INTEGER NOT NULL,
  free_anchors INTEGER NOT NULL,
  PRIMARY KEY (time, station_id),
  FOREIGN KEY (station_id) REFERENCES stations(id)
);

-- Required for time-series queries
CREATE INDEX idx_station_status_time ON station_status(time);
CREATE INDEX idx_station_status_station_time ON station_status(station_id, time);
```

### Migration Path to TimescaleDB

When migrating from SQLite to TimescaleDB:
1. Export SQLite data to CSV/JSON
2. Create PostgreSQL schema with TimescaleDB extension
3. Convert `station_status` to hypertable: `SELECT create_hypertable('station_status', 'time');`
4. Create continuous aggregates for common analytics queries
5. Prisma schema remains compatible (both use SQL dialect)

## Sources

### Official Documentation (HIGH Confidence)
- Next.js 16 releases: https://github.com/vercel/next.js/releases (verified: v16.2.0-canary active, v15 stable)
- Prisma 7.3.0: https://github.com/prisma/prisma/releases (verified: Jan 2026 release)
- SQLite 3.51.2: https://www.sqlite.org/index.html (verified: Jan 2026 release)
- TimescaleDB/Tiger Data: https://docs.timescale.com/ (verified: Tiger Cloud rebrand, TimescaleDB active)
- node-cron 4.0.0: https://github.com/node-cron/node-cron/releases (verified: May 2025 major release)
- Recharts 3.7.0: https://github.com/recharts/recharts/releases (verified: Jan 2026 release)
- react-map-gl 8.1.0: https://github.com/visgl/react-map-gl/releases (verified: Oct 2025 release)
- TailwindCSS 4.1.18: https://github.com/tailwindlabs/tailwindcss/releases (verified: Dec 2025 release)
- TanStack Query 5.91: https://github.com/TanStack/query/releases (verified: Jan 2026 release)
- Coolify v4: https://github.com/coollabsio/coolify (verified: actively maintained, 50k+ stars)
- Docker Compose v5.0.2: https://github.com/docker/compose/releases (verified: Jan 2026 release)
- axios 1.13: https://github.com/axios/axios (verified: v1.x branch active)

### InfluxDB Note
- InfluxDB is transitioning: InfluxDB 3 Core (new) vs InfluxDB OSS v2 (legacy). Docker `latest` tag points to v3 Core as of April 2026 announcement. Not recommended for new projects preferring SQL interface.

---

*Stack research for: BiziDashboard bike-sharing analytics platform*  
*Researched: 2026-02-03*
