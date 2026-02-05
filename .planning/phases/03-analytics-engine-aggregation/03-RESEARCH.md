# Phase 3: Analytics Engine & Aggregation - Research

**Researched:** February 5, 2026  
**Domain:** SQLite/libSQL analytics aggregation, Prisma ORM, scheduled materialized aggregates  
**Confidence:** MEDIUM

## Summary

This research focuses on how to implement fast, pre-computed analytics for the Bizi dashboard using the current stack: SQLite (via libSQL) and Prisma with scheduled jobs. SQLite does not provide native continuous aggregates, so the standard approach is to materialize aggregates into dedicated tables using scheduled jobs (node-cron) and UPSERT-based rollups. For time bucketing, SQLite date/time functions and recursive CTEs are the canonical tools to generate hourly/daily buckets and fill gaps.

Retention is enforced with scheduled delete jobs that prune raw data beyond 30 days and hourly aggregates beyond 1 year. SQLite’s VACUUM/auto-vacuum considerations affect storage growth, so a retention job should be paired with periodic vacuuming or auto-vacuum mode. For performance (<500ms), the aggregate tables need proper composite indexes (stationId + bucket timestamp) and aggregation queries should avoid raw status scans entirely.

**Primary recommendation:** Implement hourly/daily aggregate tables updated via node-cron using UPSERT and SQLite time bucketing; enforce retention with scheduled deletes plus periodic VACUUM, and always aggregate in UTC with explicit handling for Europe/Madrid display logic.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma ORM | ^7.3.0 | Database access + schema | Primary ORM in repo; supports groupBy and raw SQL for analytics. |
| @libsql/client | ^0.17.0 | SQLite/libSQL client | Current DB transport for MVP SQLite. |
| @prisma/adapter-libsql | ^7.3.0 | Prisma adapter | Prisma bridge to libSQL. |
| node-cron | ^4.2.1 | Scheduled aggregation/retention | Simple cron syntax, widely used for Node job scheduling. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| SQLite date/time functions | SQLite 3.46+ | Time bucketing, UTC math | Hourly/daily rollups, week/day extraction. |
| SQLite UPSERT | SQLite 3.24+ | Idempotent aggregate updates | Incremental rollups with conflict handling. |
| SQLite CTE (WITH RECURSIVE) | SQLite 3.8.3+ | Gap filling / bucket generation | Interpolating missing data periods. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Scheduled aggregate tables (SQLite) | TimescaleDB continuous aggregates | Built-in rollups but requires migration (out of MVP scope). |
| node-cron in app | External job scheduler (e.g., system cron) | More reliable across restarts, but increases ops complexity. |

**Installation:**
```bash
npm install node-cron
```

## Architecture Patterns

### Recommended Project Structure
```
├── analytics/
│   ├── jobs/                 # cron jobs (hourly/daily rollups, retention)
│   ├── queries/              # SQL/TypedSQL for aggregates
│   ├── calculators/          # business logic (turnover, availability issues)
│   └── types/                # DTOs for aggregate responses
├── db/
│   ├── prisma.ts             # Prisma client
│   └── migrations/           # aggregate table schemas
└── api/
    └── analytics/            # API handlers for aggregate endpoints
```

### Pattern 1: Incremental Aggregation with Watermarks
**What:** Store a per-table watermark (last aggregated timestamp) and only roll up new raw rows.  
**When to use:** Hourly/daily aggregates, station rankings, heatmap data.  
**Example:** Use a “last_aggregated_at” table and aggregate raw status rows where recordedAt > watermark.

### Pattern 2: UPSERT-based Aggregate Tables
**What:** Aggregate into tables keyed by (stationId, bucketStart) using INSERT ... ON CONFLICT DO UPDATE.  
**When to use:** Hourly/daily aggregates, heatmap buckets.  
**Example:**
```sql
-- Source: https://www.sqlite.org/lang_UPSERT.html
INSERT INTO hourly_station_stats(station_id, bucket_start, bikes_avg)
VALUES('123', '2026-02-05 10:00:00', 4.2)
ON CONFLICT(station_id, bucket_start) DO UPDATE SET
  bikes_avg=excluded.bikes_avg;
```

### Pattern 3: Time Bucketing with SQLite Date/Time Functions
**What:** Use SQLite date/time functions to floor timestamps to hour/day in UTC.  
**When to use:** Hourly/daily rollups, weekday/weekend grouping.  
**Example:**
```sql
-- Source: https://www.sqlite.org/lang_datefunc.html
SELECT strftime('%Y-%m-%d %H:00:00', recordedAt) AS bucket_hour
FROM StationStatus;
```

### Pattern 4: Gap Filling via Recursive CTE
**What:** Generate a time series and left join aggregates to fill missing buckets.  
**When to use:** Hour-of-day pattern analysis, heatmaps, missing data interpolation.  
**Example:**
```sql
-- Source: https://www.sqlite.org/lang_with.html
WITH RECURSIVE
  buckets(ts) AS (
    VALUES('2026-02-01 00:00:00')
    UNION ALL
    SELECT datetime(ts, '+1 hour') FROM buckets WHERE ts < '2026-02-02 00:00:00'
  )
SELECT ts FROM buckets;
```

### Anti-Patterns to Avoid
- **Aggregating on raw tables at query time:** Use precomputed tables only (risk: slow queries, timeouts).
- **Using localtime without controlling server timezone:** SQLite `localtime` depends on system config; use UTC and convert in app for Europe/Madrid displays.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scheduling rollups | Custom setInterval loops | node-cron | Cron syntax, timezone support, predictable cadence. |
| Aggregate updates | Manual delete/insert | SQLite UPSERT | Idempotent updates, safe conflict handling. |
| Time buckets | App-side bucket math | SQLite date/time funcs | Consistent UTC bucketing at query time. |
| Gap fill | JS loops | Recursive CTE | Efficient SQL-side bucket generation. |
| Raw SQL execution | Hand-rolled query strings | Prisma $queryRaw / TypedSQL | Safer parameterization and integration. |

**Key insight:** Analytics correctness depends on deterministic time bucketing and idempotent updates; SQL-native tools are more reliable than app-side loops.

## Common Pitfalls

### Pitfall 1: Timezone Drift in Hour-of-Day Analysis
**What goes wrong:** Aggregates built in UTC but interpreted as local time in charts.  
**Why it happens:** SQLite `localtime` uses server timezone; there’s no IANA timezone support.  
**How to avoid:** Store and bucket in UTC; convert to Europe/Madrid in the API layer. For weekday/weekend, compute local time in application code.

### Pitfall 2: Double-counting in Incremental Aggregations
**What goes wrong:** Reprocessing the same raw rows inflates aggregates.  
**Why it happens:** Missing watermark or using inclusive bounds.  
**How to avoid:** Track last aggregated timestamp and use strict `>` bounds; make rollups idempotent with UPSERT.

### Pitfall 3: Distinct/GroupBy Overhead in Prisma
**What goes wrong:** Prisma `distinct` is not SQL DISTINCT and can perform in-memory post-processing.  
**Why it happens:** Prisma docs note distinct uses in-memory post-processing for some queries.  
**How to avoid:** Use SQL groupBy or raw SQL for analytics-heavy queries.

### Pitfall 4: Retention Deletes Without Vacuum
**What goes wrong:** Storage does not shrink after deletions; file grows indefinitely.  
**Why it happens:** SQLite only reclaims space with VACUUM or auto_vacuum.  
**How to avoid:** Schedule VACUUM or enable auto_vacuum; run vacuum outside critical paths.

### Pitfall 5: Cron Overlaps on Slow Jobs
**What goes wrong:** Hourly job overlaps with previous run, causing lock contention.  
**Why it happens:** No job locking or long-running aggregation.  
**How to avoid:** Use a job lock row in DB or mutex and skip if previous run still active.

## Code Examples

Verified patterns from official sources:

### Prisma groupBy for aggregate summaries
```typescript
// Source: https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing
const groupUsers = await prisma.user.groupBy({
  by: ['country'],
  _sum: { profileViews: true },
});
```

### Raw SQL execution in Prisma
```typescript
// Source: https://www.prisma.io/docs/orm/prisma-client/using-raw-sql
const result = await prisma.$queryRaw`SELECT 1`;
```

### Cron scheduling
```typescript
// Source: https://github.com/node-cron/node-cron
import cron from 'node-cron';

cron.schedule('* * * * *', () => {
  console.log('running a task every minute');
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Ad-hoc aggregation in app | SQL bucketed aggregates in DB | Ongoing | Predictable query performance, smaller response times. |
| Manual SQL strings | Prisma TypedSQL / $queryRaw | Prisma 5.19+ | Safer and more maintainable raw SQL. |
| Raw data retained indefinitely | Retention ladder with rollups | Ongoing | Prevents storage growth and supports fast dashboards. |

**Deprecated/outdated:**
- **Using app-side time bucketing for analytics:** Leads to inconsistent results; use SQLite date/time functions instead.

## Open Questions

1. **Europe/Madrid timezone bucketing**
   - What we know: SQLite only supports `localtime` (system timezone), not IANA zones.
   - What's unclear: Whether the server timezone is guaranteed to be Europe/Madrid in deployment.
   - Recommendation: Compute local-time buckets in application code or enforce server TZ in deployment.

## Sources

### Primary (HIGH confidence)
- https://www.sqlite.org/lang_datefunc.html - SQLite date/time functions (bucketing, modifiers)
- https://www.sqlite.org/lang_UPSERT.html - UPSERT syntax and behavior
- https://www.sqlite.org/lang_with.html - WITH RECURSIVE for time series generation
- https://www.sqlite.org/lang_vacuum.html - VACUUM and storage reclamation
- https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing - Prisma aggregate/groupBy
- https://www.prisma.io/docs/orm/prisma-client/using-raw-sql - Prisma raw SQL usage
- https://github.com/node-cron/node-cron - node-cron scheduling syntax

### Secondary (MEDIUM confidence)
- None

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - versions verified in repo, but future migration to Timescale remains open.
- Architecture: MEDIUM - patterns derived from SQLite/Prisma docs, not from a single canonical analytics guide.
- Pitfalls: MEDIUM - based on documented behaviors and operational best practices.

**Research date:** February 5, 2026  
**Valid until:** March 7, 2026
