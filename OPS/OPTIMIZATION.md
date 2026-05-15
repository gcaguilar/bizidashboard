# PostgreSQL Optimization Analysis — bizidashboard

**Date**: 2026-05-11
**Engine**: PostgreSQL 18.3
**Database**: bizidashboard (multi-schema: `public`, `zaragoza`)

---

## 1. Data Overview

| Schema | Table | Rows | Total Size | Index Size |
|--------|-------|------|------------|------------|
| **zaragoza** | StationStatus | 5,765,253 | 843 MB | 512 MB |
| zaragoza | HourlyStationStat | 386,224 | 55 MB | 14 MB |
| zaragoza | CollectionRun | 23,582 | 13 MB | 5.4 MB |
| zaragoza | StationAlert | 51,197 | 7.4 MB | 3.6 MB |
| zaragoza | StationRanking | 46,092 | 7.1 MB | 3.3 MB |
| zaragoza | StationHeatmapCell | 46,368 | 4.9 MB | 1.5 MB |
| zaragoza | DailyStationStat | 17,354 | 2.7 MB | 736 kB |
| zaragoza | StationPattern | 13,248 | 1.5 MB | 464 kB |
| public | StationStatus | 93,468 | 12 MB | 6.7 MB |
| public | HourlyStationStat | 50,001 | 7.3 MB | 2 MB |
| public | StationRanking | 25,284 | 3.9 MB | 1.8 MB |
| public | StationHeatmapCell | 31,303 | 3.4 MB | 1 MB |
| public | StationPattern | 13,200 | 1.5 MB | 464 kB |
| public | DailyStationStat | 2,749 | 480 kB | 184 kB |
| public | StationAlert | 1,198 | 320 kB | 160 kB |

**Total**: ~6.3M rows zaragoza + ~785K rows public = ~7M rows
**Total storage**: ~1.1 GB

---

## 2. Critical Findings

### 🔴 P0: Missing Composite Indexes on HourlyStationStat

**Impact**: High — most analytics queries scan the full table or use inefficient index scans.

The `HourlyStationStat` table has:
- Primary key: `(stationId, bucketStart)` ✅
- Separate index on `bucketStart` ✅

**But missing**: A composite index for the most common query pattern: `WHERE bucketStart BETWEEN ... ORDER BY bucketStart`.

The current `bucketStart_idx` is a **standalone** index. When queries also filter by `stationId` (like `getHourlyMobilitySignals`), PostgreSQL can't use the composite PK efficiently because it scans all stations.

**Fix**:
```sql
-- Already exists as PK, but ensure it's used:
-- @@id([stationId, bucketStart]) — this IS a composite index

-- However, queries that ONLY filter by bucketStart (no stationId) 
-- benefit from a partial index:
CREATE INDEX idx_hourly_bucket_start_only 
  ON "HourlyStationStat" ("bucketStart") 
  WHERE "bucketStart" >= NOW() - INTERVAL '90 days';
```

### 🔴 P0: StationStatus — Missing Index for Time-Range + Station Queries

**Impact**: High — `getCriticalEpisodes` and `getStationsWithLatestStatus` both scan StationStatus heavily.

Current index: `(stationId, recordedAt)` ✅ — this is good for point lookups.

But `getCriticalEpisodes` does:
```sql
WHERE "recordedAt" >= NOW() - INTERVAL '15 days'
```
This uses the **standalone** `recordedAt` index, then sorts by stationId in memory.

**Fix**:
```sql
-- Partial index for the most common time window
CREATE INDEX idx_status_recorded_at_window 
  ON "StationStatus" ("recordedAt", "stationId", "bikesAvailable", "anchorsFree")
  WHERE "recordedAt" >= NOW() - INTERVAL '90 days';
```

### 🟡 P1: StationRanking — Subquery for MAX(windowEnd)

**Impact**: Medium — Full sequential scan on 46K+ rows to find the latest window.

```sql
WHERE "windowEnd" = (SELECT MAX("windowEnd") FROM "StationRanking")
```

**EXPLAIN result**: Seq Scan on 25,284 rows → filters down to 275. Cost: 531 buffers.

**Fix**:
```sql
-- Add a covering index for the latest-window query pattern
CREATE INDEX idx_ranking_windowend_desc 
  ON "StationRanking" ("windowEnd" DESC, "stationId");

-- Or rewrite the query to use ORDER BY + LIMIT 1
```

### 🟡 P1: StationAlert — Full Table Scan for isActive Filter

**Impact**: Medium — `getActiveAlerts` scans all rows to find `isActive = true`.

Current: 51K rows, index on `generatedAt` only.

**Fix**:
```sql
CREATE INDEX idx_alert_isActive_generatedAt 
  ON "StationAlert" ("isActive", "generatedAt" DESC);
```

### 🟡 P1: Daily/Hourly Rollup — Redundant COUNT Query

**Impact**: Low-Medium — Each rollup runs a `SELECT COUNT(*)` before the actual CTE insert, causing two scans of the same data range.

**Fix**: Merge the count into the CTE or use `RETURNING` to get the count from the INSERT.

### 🟢 P2: Vacuum/Statistics

**Impact**: Low — All tables show 0% dead tuples. Tables are clean.

However, `ANALYZE` should be run after any bulk data changes to keep statistics fresh.

---

## 3. Query Performance Summary

| Query | Rows Scanned | Time | Buffers | Status |
|-------|-------------|------|---------|--------|
| `getStationRankings` | 25,284 (seq scan) | 3.9 ms | 531 | 🟡 Needs index |
| `getStationsWithLatestStatus` | 275 stations × N rows | 15.1 ms | 833 | 🟡 OK but could be better |
| `getSystemHourlyProfile` | ~386K | 0.13 ms | 5 | ✅ Excellent |
| `getActiveAlerts` | 51,197 | ~2 ms | ~200 | 🟡 Needs index |
| `getCriticalEpisodes` | ~5.7M → filtered | 2.0 ms | 18 | ✅ Good (PG18 optimizer) |
| `getHourlyMobilitySignals` | ~386K | 0.07 ms | 5 | ✅ Excellent |
| Daily Rollup CTE | ~N rows | <1 ms | 13 | ✅ Good |
| Hourly Rollup CTE | ~N rows | <1 ms | — | ✅ Good |

---

## 4. Recommended Indexes (Priority Order)

```sql
-- 1. StationAlert: isActive + generatedAt DESC (for getActiveAlerts)
CREATE INDEX IF NOT EXISTS idx_alert_isActive_genDesc 
  ON "StationAlert" ("isActive", "generatedAt" DESC);

-- 2. StationRanking: windowEnd DESC for latest-window queries
CREATE INDEX IF NOT EXISTS idx_ranking_windowEnd_desc 
  ON "StationRanking" ("windowEnd" DESC, "stationId");

-- 3. StationStatus: partial index for critical episodes (last 90 days)
CREATE INDEX IF NOT EXISTS idx_status_recent 
  ON "StationStatus" ("recordedAt" DESC, "stationId", "bikesAvailable", "anchorsFree")
  WHERE "recordedAt" >= NOW() - INTERVAL '90 days';

-- 4. StationStatus: composite for latest-status lookups (covers CROSS JOIN LATERAL)
-- Already exists: StationStatus_stationId_recordedAt_idx — no change needed

-- 5. HourlyStationStat: partial index for recent data (90 days)
CREATE INDEX IF NOT EXISTS idx_hourly_recent 
  ON "HourlyStationStat" ("bucketStart" DESC, "stationId")
  WHERE "bucketStart" >= NOW() - INTERVAL '90 days';
```

---

## 5. Schema Cleanup

**Observation**: Data exists in both `public` and `zaragoza` schemas. The `zaragoza` schema has ~7.5x more data (5.7M vs 93K StationStatus rows).

This suggests:
- `zaragoza` = production data
- `public` = test/dev data or fallback schema

**Recommendation**: Verify that the app only queries `zaragoza`. If `public` is unused, consider dropping it to avoid confusion and reduce backup size.

---

## 6. Query-Level Optimizations

### 6.1 `getStationRankings` — Replace Subquery

```typescript
// Current (slow):
WHERE "windowEnd" = (SELECT MAX("windowEnd") FROM "StationRanking")

// Better:
ORDER BY "windowEnd" DESC LIMIT 1
// Or use a CTE with the latest window
```

### 6.2 `getStationsWithLatestStatus` — Already Optimal

The `CROSS JOIN LATERAL ... LIMIT 1` pattern is the best approach for "latest per station". The index `StationStatus_stationId_recordedAt_idx` is used efficiently.

### 6.3 Rollup Functions — Merge COUNT into CTE

```typescript
// Current: 2 scans (COUNT + INSERT)
// Better: Single CTE that returns count via RETURNING or a separate path
```

### 6.4 `getActiveAlerts` — Use Index

With the new `idx_alert_isActive_genDesc` index, this query will use an index scan instead of a seq scan.

---

## 7. Prisma Schema Recommendations

Add these indexes to the Prisma schema:

```prisma
model StationAlert {
  // ... existing fields ...
  
  @@index([isActive, generatedAt])
}

model StationRanking {
  // ... existing fields ...
  
  @@index([windowEnd, stationId])
}

model StationStatus {
  // ... existing fields ...
  
  // Composite for time-range queries with station filter
  @@index([recordedAt, stationId, bikesAvailable, anchorsFree])
}

model HourlyStationStat {
  // ... existing fields ...
  
  // Partial index for recent data (not supported in Prisma directly, use raw SQL)
}
```

---

## 8. Monitoring Recommendations

1. **Enable pg_stat_statements** — Already loaded via `shared_preload_libraries=pg_stat_statements`
2. **Query plan cache** — PG18 has better plan caching; monitor for plan regressions
3. **Table bloat** — `StationStatus` at 843 MB is the largest; monitor for bloat from updates
4. **Connection pool** — With 7M+ rows, ensure Prisma connection pool is sized appropriately
5. **Partitioning** — Consider partitioning `StationStatus` by `recordedAt` if rows grow beyond ~50M

---

## 9. Partitioning Strategy (Future)

When `StationStatus` exceeds ~50M rows:

```sql
-- Monthly partitioning by recordedAt
ALTER TABLE "StationStatus" PARTITION BY RANGE ("recordedAt");
CREATE TABLE "StationStatus_2026_05" PARTITION OF "StationStatus"
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
```

This would:
- Reduce index size per partition
- Speed up time-range queries (partition pruning)
- Enable easy archival/deletion of old data

---

## 10. Quick Wins Summary

| Priority | Action | Expected Impact | Effort |
|----------|--------|----------------|--------|
| 🔴 P0 | Add `idx_alert_isActive_genDesc` | 5-10x faster alerts query | 1 min |
| 🔴 P0 | Add `idx_ranking_windowEnd_desc` | 3-5x faster rankings | 1 min |
| 🟡 P1 | Add `idx_status_recent` | 2-3x faster critical episodes | 1 min |
| 🟡 P1 | Add `idx_hourly_recent` | 2x faster hourly queries on recent data | 1 min |
| 🟡 P1 | Rewrite `getStationRankings` subquery | 2x faster | 5 min |
| 🟢 P2 | Run `ANALYZE` on all tables | Better query plans | 30 sec |
| 🟢 P2 | Clean up unused `public` schema | Simpler ops | 10 min |
