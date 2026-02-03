# BiziDashboard Roadmap

A public analytics dashboard for Zaragoza's bike-sharing system.

**Core Value:** Anyone can see when and where bikes are available, discover usage patterns, and understand how the Bizi system serves different neighborhoods at different times.

---

## Overview

This roadmap delivers BiziDashboard in **5 phases** following data dependencies: foundation → collection → analytics → API → dashboard. Each phase builds on the previous, ensuring we never query raw data directly and preventing the critical pitfalls identified in research (storage growth, silent failures, timezone errors, query timeouts).

**Approach:** MVP-first with SQLite for Phases 1-2, migration path to TimescaleDB in Phase 3 when data volume warrants it.

---

## Phases

### Phase 1: Foundation & Data Architecture
**Goal:** Establish data lifecycle and collection patterns before any data exists.

**Dependencies:** None (project foundation)

**Requirements:**
- INFRA-01: Database schema with proper time-series structure
- INFRA-02: Timezone handling (UTC storage, Europe/Madrid display)
- INFRA-03: DST handling (March/October transitions)

**Success Criteria:**
1. Database schema supports time-series station data with proper indexes
2. All timestamps stored in UTC with Europe/Madrid display conversion
3. DST transitions handled correctly (no missing/duplicate hours)
4. Data retention ladder defined (raw: 30 days, hourly: 1 year, daily: forever)
5. Prisma migrations run successfully in CI/CD

**Pitfalls Prevented:**
- #1 (Unbounded storage) — retention ladder defined upfront
- #4 (Timezone/DST errors) — UTC storage with IANA timezone names

**Plans:** 4 plans in 4 waves (4/4 complete)

**Plan List:**
- [x] 01-01-PLAN.md — Project Foundation & Prisma Setup
- [x] 01-02-PLAN.md — Database Schema & Time-Series Structure
- [x] 01-03-PLAN.md — Timezone Handling & DST Support
- [x] 01-04-PLAN.md — Data Retention & CI/CD Setup

---

### Phase 2: Data Collection & Validation
**Goal:** Reliable automated data pipeline with quality checks and error handling.

**Dependencies:** Phase 1 (database schema exists)

**Requirements:**
- DATA-01: Automated polling of Bizi API every 30 minutes
- DATA-02: Store station status (station ID, available bikes, free anchors, timestamp)
- DATA-03: Implement data validation (freshness, volume, schema checks)
- DATA-04: Handle GBFS API changes gracefully (version-agnostic parsing)
- DATA-05: Error handling with exponential backoff for rate limiting
- INFRA-04: Data observability (freshness alerts, volume checks)

**Success Criteria:**
1. Automated polling runs every 30 minutes without manual intervention
2. Station data (ID, bikes, anchors, timestamp) stored for every poll
3. Data validation catches stale data (>10 min old), schema changes, volume anomalies
4. GBFS discovery file (`gbfs.json`) parsed dynamically to find endpoints
5. Exponential backoff with jitter on API errors/rate limits (429 responses)
6. Observability dashboard shows: last successful poll, rows collected, validation errors

**Pitfalls Prevented:**
- #2 (GBFS breaking changes) — version-agnostic discovery parsing
- #3 (Silent failures) — Five Pillars of Data Observability implemented
- #6 (Rate limiting) — exponential backoff with User-Agent headers

**Research Flag:** `/gsd-research-phase 2` — Verify Bizi API structure, GBFS version, exact rate limits before implementation.

---

### Phase 3: Analytics Engine & Aggregation
**Goal:** Pre-computed aggregates enabling fast dashboard queries without touching raw data.

**Dependencies:** Phase 2 (data collection running, ~2 weeks of data available)

**Requirements:**
- DATA-06: Data retention ladder (raw: 30 days, hourly: 1 year, daily: forever)
- ANAL-01: Continuous aggregates for hourly statistics
- ANAL-02: Continuous aggregates for daily statistics
- ANAL-03: Station rankings by turnover rate (most used)
- ANAL-04: Station rankings by availability issues (often empty/full)
- ANAL-05: Hour-of-day pattern analysis (weekday vs weekend)
- ANAL-06: Heatmap data (occupancy by hour × day of week)
- ANAL-07: Basic prediction alerts (threshold-based availability warnings)

**Success Criteria:**
1. Hourly aggregates table updated automatically with station statistics
2. Daily aggregates table updated automatically with summary statistics
3. Station rankings available: most used (turnover rate), most problematic (availability issues)
4. Hour-of-day patterns distinguish weekday vs weekend usage
5. Heatmap data ready (occupancy percentage by station × hour × day of week)
6. Basic prediction logic identifies stations likely to run out of bikes (<5 bikes or <3 anchors)
7. Data retention policies enforce: raw data purged after 30 days, hourly after 1 year
8. Query response time <500ms for all aggregate endpoints

**Pitfalls Prevented:**
- #1 (Storage growth) — retention policies actively purging old data
- #5 (Query timeouts) — pre-computed aggregates, no raw data queries
- #7 (Missing data) — interpolation strategy for gaps

---

### Phase 4: API Layer
**Goal:** Thin REST API serving pre-computed analytics with caching.

**Dependencies:** Phase 3 (aggregates available)

**Requirements:**
- API-01: REST endpoint for station list with current status
- API-02: REST endpoint for station rankings
- API-03: REST endpoint for hour-of-day patterns
- API-04: REST endpoint for heatmap data
- API-05: REST endpoint for prediction/alerts
- API-06: Redis caching layer (5-min TTL for hot queries)

**Success Criteria:**
1. `GET /api/stations` returns all stations with current status
2. `GET /api/rankings?type=turnover|availability` returns sorted station lists
3. `GET /api/patterns?stationId={id}` returns hour-of-day data
4. `GET /api/heatmap` returns occupancy matrix data
5. `GET /api/alerts` returns stations with low availability predictions
6. Redis caches hot queries with 5-minute TTL
7. All endpoints return JSON with proper HTTP status codes
8. API documentation available at `/api/docs`

**Pitfalls Prevented:**
- #5 (Query timeouts) — thin API pattern, no computation at request time

---

### Phase 5: Dashboard Frontend
**Goal:** Public web dashboard with all analysis panels in Spanish.

**Dependencies:** Phase 4 (API endpoints serving data)

**Requirements:**
- DASH-01: Station map with occupancy indicators
- DASH-02: Real-time status indicator (last update timestamp)
- DASH-03: Station rankings table (sortable, searchable)
- DASH-04: Hour-of-day charts (weekday vs weekend patterns)
- DASH-05: Occupancy heatmap (station × hour × day)
- DASH-06: Basic prediction alerts (stations likely to empty soon)
- DASH-07: Spanish UI (all text in Spanish for Zaragoza audience)
- DASH-08: Responsive design (mobile and desktop)
- INFRA-05: Public deployment (accessible URL)

**Success Criteria:**
1. Public URL accessible without authentication
2. Interactive map shows all stations with color-coded occupancy (green/yellow/red)
3. "Last updated: X minutes ago" indicator visible on all pages
4. Rankings table sortable by turnover rate and availability issues
5. Hour-of-day charts show weekday vs weekend patterns per station
6. Heatmap visualization displays occupancy patterns (hour × day matrix)
7. Alert panel highlights stations with <5 bikes or <3 anchors
8. All UI text in Spanish (Español) for Zaragoza audience
9. Layout adapts to mobile and desktop screens
10. Dashboard loads initial data server-side (no loading states)

---

## Implementation Notes

### Technology Stack
- **Next.js 16.x** — Full-stack React framework
- **SQLite + Prisma** — MVP database (Phases 1-2)
- **TimescaleDB** — Production time-series database (Phase 3+)
- **node-cron** — In-process job scheduler for polling
- **Recharts** — React charting library
- **react-map-gl + MapLibre** — Open-source map visualization
- **Redis** — Caching layer
- **Coolify v4** — Self-hosted deployment

### Phase Ordering Rationale
1. **Data before visualization** — Can't build dashboard without API, can't build API without aggregates, can't build aggregates without data
2. **Prevention before features** — Phases 1-2 establish observability preventing critical pitfalls
3. **Scale-up path built-in** — SQLite for MVP, migration to TimescaleDB when data volume warrants

### v2 Scope (Post-Roadmap)
- Flow visualization (origin-destination) — *requires trip data verification*
- Weather impact analysis
- Neighborhood-level aggregation
- ML-based availability forecasting
- Historical data beyond 6 months
- Data export functionality

---

## Progress

| Phase | Status | Requirements | Success Criteria Met |
|-------|--------|--------------|---------------------|
| 1 - Foundation | 🟢 Complete | 3/3 | 5/5 |
| 2 - Data Collection | 🔴 Not Started | 6/6 pending | 0/6 |
| 3 - Analytics Engine | 🔴 Not Started | 8/8 pending | 0/8 |
| 4 - API Layer | 🔴 Not Started | 6/6 pending | 0/6 |
| 5 - Dashboard | 🔴 Not Started | 9/9 pending | 0/10 |

**Overall Progress:** 3/28 requirements complete (11%)

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 2 | Pending |
| DATA-02 | Phase 2 | Pending |
| DATA-03 | Phase 2 | Pending |
| DATA-04 | Phase 2 | Pending |
| DATA-05 | Phase 2 | Pending |
| DATA-06 | Phase 3 | Pending |
| ANAL-01 | Phase 3 | Pending |
| ANAL-02 | Phase 3 | Pending |
| ANAL-03 | Phase 3 | Pending |
| ANAL-04 | Phase 3 | Pending |
| ANAL-05 | Phase 3 | Pending |
| ANAL-06 | Phase 3 | Pending |
| ANAL-07 | Phase 3 | Pending |
| API-01 | Phase 4 | Pending |
| API-02 | Phase 4 | Pending |
| API-03 | Phase 4 | Pending |
| API-04 | Phase 4 | Pending |
| API-05 | Phase 4 | Pending |
| API-06 | Phase 4 | Pending |
| DASH-01 | Phase 5 | Pending |
| DASH-02 | Phase 5 | Pending |
| DASH-03 | Phase 5 | Pending |
| DASH-04 | Phase 5 | Pending |
| DASH-05 | Phase 5 | Pending |
| DASH-06 | Phase 5 | Pending |
| DASH-07 | Phase 5 | Pending |
| DASH-08 | Phase 5 | Pending |
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 2 | Pending |
| INFRA-05 | Phase 5 | Pending |

**Coverage:** 28/28 v1 requirements mapped ✓

---

*Roadmap created: 2026-02-03*
