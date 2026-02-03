# Project Research Summary

**Project:** BiziDashboard — Bike-sharing analytics dashboard for Bizi Zaragoza
**Domain:** Public transportation / Urban mobility analytics
**Researched:** 2026-02-03
**Confidence:** MEDIUM-HIGH

---

## Executive Summary

BiziDashboard is a public analytics dashboard for Zaragoza's bike-sharing system. Based on research into GBFS (General Bikeshare Feed Specification) ecosystems, time-series analytics best practices, and Citi Bike case studies, the recommended approach prioritizes **operational simplicity with a clear scale-up path**. For a 2-week MVP capturing ~87,000 data points (130 stations × 48 readings/day × 14 days), SQLite with Prisma provides zero-configuration deployment. This intentionally defers TimescaleDB complexity until 6+ months when data volumes reach 5M+ records.

The key differentiator from Bizi's official app is **historical pattern analysis**—showing when stations fill/empty, identifying peak usage neighborhoods, and visualizing temporal trends. The architecture must be opinionated about **data lifecycle management** from day one: raw data expires after 30 days, hourly aggregates live for 1 year, and daily summaries persist forever. Without this retention ladder, storage costs and query performance will degrade within 6 months.

Critical risks center on **time-series data quality**—GBFS API breaking changes, Europe/Madrid timezone DST transitions, and silent pipeline failures where data appears current but is actually stale. Prevention requires schema validation, UTC storage with IANA timezone names, and the Five Pillars of Data Observability (freshness, volume, schema, distribution, lineage) implemented from Phase 1.

---

## Key Findings

### Recommended Stack

The research recommends a **modern React/Next.js stack** optimized for self-hosted deployment with SQLite for MVP and a clear migration path to TimescaleDB for scale. Key philosophy: minimize moving parts for MVP while maintaining upgrade vectors.

**Core technologies:**
- **Next.js 16.x (App Router)**: Full-stack React framework providing API routes for data collection, server components for dashboard rendering, and static generation for performance. Standard for 2025 React apps with native TypeScript support.
- **SQLite + Prisma (MVP)**: Zero-configuration single-file database handling 87k records comfortably. Prisma provides type-safe migrations compatible with both SQLite and PostgreSQL/TimescaleDB (future migration).
- **TimescaleDB (Phase 3+)**: PostgreSQL extension for hypertables and continuous aggregates. Migration path when data exceeds ~1M records or requires fast analytics queries on historical data.
- **node-cron 4.0+**: In-process job scheduler for 30-minute Bizi API polling. Mature (3.2k stars), simple cron syntax, no separate worker process needed for MVP.
- **Recharts 3.7+**: React-native charting library (26.6k stars) for occupancy trends and usage charts. Declarative API built on D3, more React-idiomatic than Chart.js alternatives.
- **react-map-gl 8.1 + MapLibre**: Open-source map visualization with free tiles (no API key required). React wrapper for Mapbox/MapLibre with TypeScript support.
- **Coolify v4**: Open-source PaaS (50k+ stars) for self-hosted deployment. One-click Git deployment handling SSL, domains, and automatic deploys—perfect for the self-hosting requirement.

**Version notes:**
- Next.js 16 requires React 19, Node 18+
- Prisma 7 requires new `prisma.config.ts` format
- TailwindCSS 4 uses Rust engine (10x faster builds), config format changed from v3
- node-cron 4.0 is May 2025 major release with improved error handling

### Expected Features

Research analyzed Citi Bike dashboards, GBFS ecosystem tools, and bike-sharing research archives to identify what users expect versus what differentiates.

**Must have (table stakes):**
- **Station Status Map** — Users expect to see station locations with current occupancy at a glance. GBFS standard, low complexity.
- **Station Rankings** — "Which stations are most used?" is the core question every dashboard answers. Sortable table by metrics like total turnover rate.
- **Hour-of-Day Patterns** — When do people ride? Rush hour vs leisure usage visualization. Standard bar chart showing weekday vs weekend patterns.
- **Station Occupancy Heatmap** — Shows when stations fill/empty (hour × day matrix). Confirms patterns like "which stations are empty at 9am Monday?" Key differentiator from Bizi's official app.
- **Real-Time Status Indicator** — "Last updated: 2 minutes ago" timestamp. Users need to trust data freshness.
- **Station List with Metrics** — Searchable list with basic stats. GBFS provides this data natively.

**Should have (competitive differentiators):**
- **Flow Visualization (Origin-Destination)** — Reveals movement patterns between neighborhoods. Answers "where are people going?" Requires trip data, not just station status. HIGH complexity but major value add.
- **Prediction/Availability Forecasting** — "Will bikes be available when I arrive?" Start with simple threshold-based alerts ("<5 bikes = likely empty soon"), defer ML models to v2+.
- **Neighborhood-Level Aggregation** — Compare Zaragoza districts (Casco Antiguo, Delicias, etc.). Context for equity analysis.
- **Weather Impact Analysis** — Correlate weather data (rain, temperature) with usage anomalies. Explains seasonal patterns.
- **Peak vs Off-Peak Comparison** — Identify stations that transform from commuter hubs to leisure destinations over the day.

**Defer (v2+ or don't build):**
- Real-time bike locator (Bizi already provides this)
- User authentication (creates friction for public tool)
- Trip booking/reservation (out of scope, requires Bizi operational integration)
- Mobile native app (PWA sufficient if needed)
- Advanced ML predictions (over-engineering for MVP)
- Historical data beyond 6 months initially (storage costs grow, diminishing returns)
- Multi-city comparison (dilutes Zaragoza focus)
- Social features/gamification (doesn't serve core value proposition)

**Critical dependency question:** Does Bizi Zaragoza's API include trip histories or only station status? This determines if flow visualization (major differentiator) is possible. If only station status available, pivot to occupancy-based insights.

### Architecture Approach

The architecture follows **5-layer separation of concerns** optimized for time-series analytics: Collection → Data (TimescaleDB) → Analytics → API → Presentation.

**Major components:**
1. **Data Collector** — Polls Bizi API every 30 min via node-cron, implements rate limiting with Redis, transforms data, stores in TimescaleDB. Must handle GBFS v3.0 migration gracefully.
2. **TimescaleDB (Data Layer)** — Stores time-series station data with hypertables for partitioning. Implements continuous aggregates for hourly/daily pre-computed statistics.
3. **Analytics Engine** — Background jobs creating materialized views for common queries (peak times, rankings, trends). Prevents dashboard from querying raw data directly.
4. **API Layer** — Thin REST endpoints serving pre-aggregated data. No heavy computation at request time. Redis caching for hot queries.
5. **Dashboard UI (Next.js RSC)** — Server Components fetch initial data server-side eliminating loading states. Recharts for time-series, react-map-gl for heatmaps.

**Key patterns to follow:**
- **Continuous Aggregation**: Use TimescaleDB continuous aggregates to maintain pre-computed hourly/daily stats without manual cron jobs
- **Rate-Limited Polling**: Implement exponential backoff with jitter when API limits hit. Respect GBFS `ttl` field.
- **Thin API Layer**: Query pre-computed materialized views, never raw data for dashboard requests
- **Server Components for Initial Data**: Next.js RSC fetch initial dashboard data server-side, eliminating client loading states
- **Data Retention Ladder**: Raw 30-min data (30 days) → Hourly aggregates (1 year) → Daily aggregates (forever)

**Anti-patterns to avoid:**
- Querying raw data for dashboard requests (degrades linearly with volume)
- Synchronous polling in main thread (use BullMQ/Redis for distributed jobs)
- Storing everything forever at full resolution (storage cost explosion)
- Tight frontend-backend coupling (blocks schema evolution)

### Critical Pitfalls

Research identified 5 critical pitfalls that cause rewrites or data corruption in bike-sharing analytics dashboards.

1. **Unbounded Time-Series Storage Growth** — Collecting every 60 seconds without retention policies causes storage cost explosion within 6-12 months. 130 stations × 48 readings/day × 365 days = ~2.3M records/year. Prevention: Design "Resolution Ladder" upfront—raw (30 days), hourly (1 year), daily (forever). Use compression (Parquet/Zstd achieves 10:1 to 40:1). Track only changes (delta approach) rather than identical snapshots.

2. **GBFS API Breaking Changes and Data Loss** — GBFS is transitioning to v3.0 (2025) with breaking changes: `free_bike_status.json` deprecated for `vehicle_status.json`, field structure changes. Hardcoded endpoints produce "ghost data" (bikes shown available that aren't). Prevention: Always read `gbfs.json` discovery file to find endpoints dynamically. Honor `ttl` headers. Use MobilityData GBFS Validator. Implement exponential backoff on 429 errors.

3. **Silent Data Pipeline Failures** — Pipeline appears healthy (green status checks) but dashboard shows stale/incorrect data. Traditional monitoring tracks infrastructure, not data quality. Prevention: Implement Five Pillars of Data Observability—Freshness (alert if >10 min stale), Volume (expected row counts), Schema (column changes), Distribution (values in bounds), Lineage (downstream impact). Add circuit breakers to stop accepting failing validation data.

4. **Europe/Madrid Timezone and DST Handling Errors** — Zaragoza uses Europe/Madrid (UTC+1 winter, UTC+2 summer). DST transitions last Sunday of March (02:00→03:00) and October (03:00→02:00). Storing local time without offset causes "missing hour" (spring) or "duplicate timestamps" (fall). Prevention: Always store UTC server-side. Use IANA names (`Europe/Madrid`), never abbreviations. Use PostgreSQL `TIMESTAMPTZ`. Handle DST explicitly: skip non-existent spring hour, store offset for ambiguous fall hour.

5. **Dashboard Query Timeouts with Historical Data** — Queries working with 1 week of data timeout at 1 year. No partition pruning, calculations at query time, no caching. Prevention: Pre-aggregate with materialized views. Partition tables by time. Add Redis caching (5-min TTL). Push aggregation to database (SUM/AVG/COUNT server-side).

**Moderate pitfalls:**
- Aggressive rate limiting triggering API bans (respect TTL, use User-Agent, implement backoff)
- Wrong downsampling aggregators (store min/max/avg/count, not just average)
- Missing data without interpolation strategy (distinguish "no data" vs "zero bikes")

**Technical debt shortcuts to avoid:**
- Storing full JSON blobs (10-50x storage overhead)
- Polling every 10 seconds (API bans, wasted storage)
- Skipping data validation (silent corruption)
- Using client timestamps (timezone/DST errors)
- No retention policy (storage explosion)

---

## Implications for Roadmap

Based on research, recommended phase structure follows **data dependencies**: can't build analytics without data, can't build dashboard without API, can't predict without history.

### Phase 1: Foundation & Data Architecture
**Rationale:** Must establish data lifecycle and collection patterns before any data exists. Pitfall prevention starts here.
**Delivers:** Database schema, retention policies, data collector skeleton, basic observability
**Uses:** SQLite (MVP), Prisma, node-cron, GBFS discovery parsing
**Implements:** Data layer, Collection layer skeleton
**Avoids:** Pitfall #1 (unbounded storage), Pitfall #4 (timezone errors)
**Research Flag:** Standard patterns—skip dedicated phase research. Architecture patterns well-documented in TimescaleDB docs.

### Phase 2: Data Collection & Validation
**Rationale:** Must have reliable data pipeline before building analytics. Data observability must be implemented from day one.
**Delivers:** Working 30-minute polling, GBFS schema validation, data quality checks (freshness, volume, distribution), error handling with backoff
**Uses:** node-cron, axios, Redis (rate limiting), GBFS Validator
**Implements:** Collection layer, basic observability
**Avoids:** Pitfall #2 (API breaking changes), Pitfall #3 (silent failures), Pitfall #6 (rate limiting)
**Research Flag:** Needs `/gsd-research-phase` — GBFS v3.0 migration status, Bizi API specific rate limits, exact endpoint structure needs verification.

### Phase 3: Analytics Engine & Aggregation
**Rationale:** Dashboard queries must hit pre-computed aggregates, never raw data. Must prove retention policies work before data volume grows.
**Delivers:** Continuous aggregates (hourly, daily), materialized views for rankings/heatmaps, data retention policies, interpolation strategy for missing data
**Uses:** TimescaleDB continuous aggregates (or SQLite equivalents), background job runner
**Implements:** Analytics layer, aggregation engine
**Avoids:** Pitfall #1 (storage growth), Pitfall #5 (query timeouts), Pitfall #7 (missing data handling)
**Research Flag:** Standard patterns—skip research. TimescaleDB continuous aggregates are well-documented.

### Phase 4: API Layer
**Rationale:** Thin API serving pre-computed data. No computation at request time.
**Delivers:** REST endpoints for metrics, rankings, station data, Redis caching layer, API documentation
**Uses:** Next.js API routes (or Fastify if separating), Redis, Prisma
**Implements:** API layer
**Avoids:** Pitfall #5 (thin API layer pattern)
**Research Flag:** Standard patterns—skip research. REST API patterns well-established.

### Phase 5: Dashboard Frontend
**Rationale:** Frontend depends entirely on API. Must use Server Components for initial data to avoid loading states.
**Delivers:** Dashboard shell, Station Map with heatmap, Station Rankings, Hour/Day charts, Real-time status indicator
**Uses:** Next.js App Router, Recharts, react-map-gl, MapLibre, TanStack Query
**Implements:** Presentation layer, all table stakes features
**Avoids:** Pitfall #5 (client-side aggregation), Minor pitfall (no freshness indicator)
**Research Flag:** Standard patterns—skip research. React dashboard patterns well-documented.

### Phase 6: Differentiators (Flow, Predictions, Weather)
**Rationale:** Features that set BiziDashboard apart. Flow visualization requires trip data (verify availability). Predictions require weeks of history.
**Delivers:** Flow visualization (if trip data available), Basic threshold-based predictions, Weather correlation (if weather API integrated), Neighborhood aggregation
**Uses:** All stack components, potentially weather API
**Implements:** Advanced analytics, differentiator features
**Avoids:** Pitfall #8 (advanced ML predictions too early)
**Research Flag:** Needs `/gsd-research-phase` — Flow visualization is HIGH complexity. Trip data availability from Bizi API must be verified. Weather API selection needs research.

### Phase Ordering Rationale

1. **Data before visualization:** Can't build dashboard without API, can't build API without aggregates, can't build aggregates without data, can't collect data without schema. This order respects dependencies.

2. **Prevention before features:** Phase 1-2 establish data lifecycle and observability preventing the critical pitfalls. Attempting dashboard first would result in querying raw data directly, leading to timeout issues within weeks.

3. **Scale-up path built-in:** SQLite chosen for Phase 1-2 intentionally. Migration to TimescaleDB is Phase 3+ when data volume and query complexity warrant it. This avoids over-engineering MVP while maintaining upgrade vector.

4. **Risk mitigation by phase:**
   - Phase 1-2 address Pitfalls #1, #2, #3, #4, #6 (architectural/collection issues)
   - Phase 3 addresses Pitfall #1, #5, #7 (storage/query issues)
   - Phase 4-5 address Pitfall #5 (API pattern issues)
   - Phase 6 acknowledges complexity requiring research

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 2 (Data Collection):** GBFS v3.0 migration status for Bizi Zaragoza, specific rate limits, exact API endpoint structure. Unknown if Bizi uses standard GBFS or custom API.
- **Phase 6 (Differentiators):** Trip data availability—critical for flow visualization. If Bizi only provides station status (not trip history), flow visualization is impossible and must pivot to occupancy-based insights. Also needs weather API selection research.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** Database architecture, retention policies, timezone handling—well-documented patterns
- **Phase 3 (Analytics):** TimescaleDB continuous aggregates or SQLite aggregation patterns—standard time-series practices
- **Phase 4 (API):** REST API design, thin API pattern—industry standard
- **Phase 5 (Frontend):** React dashboard, Recharts, Server Components—Next.js 16 patterns well-documented

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | HIGH | Official documentation verified (Next.js 16, Prisma 7, TimescaleDB, node-cron 4). Clear migration path from SQLite to TimescaleDB. Self-hosted deployment with Coolify well-established. |
| **Features** | MEDIUM | Based on analysis of Citi Bike dashboard, GBFS ecosystem tools, and bike-sharing research. MEDIUM confidence on Zaragoza-specific data availability—requires verification of Bizi API capabilities (station status only vs trip history). |
| **Architecture** | MEDIUM-HIGH | 5-layer architecture and time-series patterns verified against multiple 2025 sources. Build order based on clear data dependencies. Continuous aggregates and retention policies are industry standard for time-series analytics. |
| **Pitfalls** | HIGH | Critical pitfalls (storage growth, API changes, silent failures, timezone handling, query timeouts) are documented time-series anti-patterns with established prevention strategies. GBFS v3.0 migration is documented 2025 industry transition. |

**Overall confidence:** MEDIUM-HIGH

Research covers stack selection, feature landscape, architectural patterns, and domain-specific pitfalls with solid source grounding. Main uncertainty is Bizi Zaragoza's specific API structure and data availability—this needs validation during Phase 2 planning.

### Gaps to Address

1. **Bizi API Data Structure:** Does Bizi provide GBFS-standard feeds or custom API? Does it include trip histories or only station status? This determines if flow visualization (major differentiator) is possible.
   - *How to handle:* During Phase 2 planning, manually inspect Bizi's API response structure. Verify if `trip_data` or origin-destination matrices are available.

2. **GBFS Version Status:** Is Bizi on GBFS v2.2, v2.3, or migrating to v3.0? Breaking changes between versions affect parser design.
   - *How to handle:* During Phase 2, implement version-agnostic discovery file parsing (`gbfs.json`). Build schema validation to catch drift regardless of version.

3. **Exact Rate Limits:** What are Bizi's specific API rate limits? Research assumes standard GBFS but actual limits may differ.
   - *How to handle:* Implement conservative polling (30-min as specified) with exponential backoff from day one. Monitor for 429 errors during Phase 2 and adjust.

4. **Weather Data Source:** For weather correlation feature (Phase 6), which weather API to use for Zaragoza?
   - *How to handle:* Defer to Phase 6 research. Standard options: OpenWeatherMap, AEMET (Spanish meteorological service), or Visual Crossing.

---

## Sources

### Primary (HIGH confidence)
- **Next.js 16 releases:** https://github.com/vercel/next.js/releases (v16.2.0-canary active, v15 stable)
- **Prisma 7.3.0:** https://github.com/prisma/prisma/releases (Jan 2026, verified)
- **TimescaleDB/Tiger Data:** https://docs.timescale.com/ (Tiger Cloud rebrand, continuous aggregates verified)
- **node-cron 4.0.0:** https://github.com/node-cron/node-cron/releases (May 2025 major release)
- **Recharts 3.7.0:** https://github.com/recharts/recharts/releases (Jan 2026, verified)
- **react-map-gl 8.1.0:** https://github.com/visgl/react-map-gl/releases (Oct 2025)
- **TailwindCSS 4.1.18:** https://github.com/tailwindlabs/tailwindcss/releases (Dec 2025, Rust engine)
- **TanStack Query 5.91:** https://github.com/TanStack/query/releases (Jan 2026)
- **Coolify v4:** https://github.com/coollabsio/coolify (50k+ stars, actively maintained)
- **SQLite 3.51.2:** https://www.sqlite.org/index.html (Jan 2026 release)
- **MobilityData GBFS v3.0:** https://github.com/MobilityData/gbfs (2025 specification, breaking changes documented)

### Secondary (MEDIUM confidence)
- **Todd Schneider's Citi Bike Analysis:** https://toddwschneider.com/posts/a-tale-of-twenty-two-million-citi-bikes/ — Trip patterns, flow visualization techniques, weather impact modeling, rebalancing detection methodology
- **GBFS Tools Directory:** https://gbfs.org/tools/ — Existing visualization libraries, common dashboard patterns
- **TimescaleDB Best Practices:** Continuous aggregates, retention policies, hypertable partitioning patterns
- **Data Observability (Monte Carlo, Bigeye):** Five Pillars Framework — freshness, volume, schema, distribution, lineage

### Tertiary (LOW confidence / Needs Validation)
- **Bizi Zaragoza API Structure:** Assumed GBFS-compliant but requires manual verification of endpoint structure, version, and data availability (station status vs trip history)
- **Zaragoza-Specific Usage Patterns:** Research based on Citi Bike (NYC) patterns. Zaragoza may have different temporal patterns (siesta impact, Feria del Pilar in October).

---

*Research completed: 2026-02-03*
*Ready for roadmap: yes*
