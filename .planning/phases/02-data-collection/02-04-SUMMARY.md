---
phase: 02-data-collection
plan: 04
subsystem: api
tags: [nextjs, api-routes, metrics, observability, sqlite, prisma]

# Dependency graph
requires:
  - phase: 02-data-collection
    provides: "Data validation (Five Pillars) from Plan 02-02"
  - phase: 02-data-collection
    provides: "Collection job from Plan 02-03"
provides:
  - Persistent metrics store with database aggregation queries
  - GET /api/status endpoint for observability dashboard
  - Pipeline health status calculation (healthy/degraded/down)
  - Real-time metrics tracking wired into collection pipeline
  - Data freshness, volume, and validation error tracking
affects:
  - 03-analytics-engine
  - 04-api-layer
  - 05-dashboard

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Database aggregation for metrics (avoids separate metrics table)"
    - "In-memory cache for high-frequency metrics (consecutive failures, validation errors)"
    - "Health status calculation based on multiple factors"
    - "API route with caching headers for dashboard optimization"

key-files:
  created:
    - src/lib/metrics.ts
    - src/app/api/status/route.ts
  modified:
    - src/jobs/bizi-collection.ts
    - src/services/data-validator.ts

key-decisions:
  - "Use database aggregation queries instead of separate metrics table - simpler, always accurate, no migration needed"
  - "Hybrid storage: in-memory for high-frequency events (failures, errors), database for historical data"
  - "Health status considers: consecutive failures, last poll time, polls per day, validation error count"

patterns-established:
  - "Metrics functions follow pattern: async function with try/catch returning 0 on error"
  - "CacheControl headers on status endpoint: 30s max-age with 60s stale-while-revalidate"
  - "CORS support on observability endpoints for dashboard flexibility"

# Metrics
duration: 1min
completed: 2026-02-05
---

# Phase 2 Plan 4: Pipeline Observability Summary

**Persistent metrics tracking with database aggregation and /api/status endpoint providing real-time pipeline health, data freshness, and quality metrics.**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-05T21:06:00Z
- **Completed:** 2026-02-05T21:07:51Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Created persistent metrics store (`src/lib/metrics.ts`) with database-backed metrics tracking
- Built `/api/status` API endpoint returning comprehensive pipeline health and quality metrics
- Wired metrics tracking into collection pipeline at key points (collection results, validation errors)
- Implemented intelligent health status calculation (healthy/degraded/down) based on multiple factors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Persistent Metrics Store** - `ffbd798` (feat)
2. **Task 2: Create Status API Endpoint** - `5691de4` (feat)
3. **Task 3: Wire Metrics into Collection Pipeline** - `bb8ad65` (feat)

**Plan metadata:** [pending] (docs: complete plan)

## Files Created/Modified

- `src/lib/metrics.ts` - Persistent metrics tracking with database aggregation queries
- `src/app/api/status/route.ts` - GET /api/status endpoint for observability dashboard
- `src/jobs/bizi-collection.ts` - Wired recordCollection() calls into runCollection()
- `src/services/data-validator.ts` - Wired incrementValidationErrors() on validation failures

## Decisions Made

- **Database aggregation vs separate metrics table:** Used aggregation queries on StationStatus table instead of creating a separate metrics table. This ensures metrics are always accurate (derived from actual data), requires no migration, and avoids data duplication. Trade-off: slightly more expensive queries, but acceptable for dashboard use (cached 30s).

- **Hybrid storage approach:** Used in-memory cache for high-frequency, ephemeral metrics (consecutive failures, validation errors, app uptime) and database aggregation for historical metrics (total rows, poll counts). This balances durability with performance.

- **Health status algorithm:** Health is calculated based on four factors: consecutive failures (down if ≥5), last poll time (down if >1 hour), polls per day (degraded if <40), validation errors (degraded if >10). This provides actionable insight into pipeline state.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all files and dependencies were in place from previous plans.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Pipeline observability complete and ready for Phase 3 (Analytics Engine)
- /api/status endpoint provides foundation for dashboard widgets
- Metrics tracking enables monitoring and alerting capabilities
- No blockers for next phase

---
*Phase: 02-data-collection*
*Completed: 2026-02-05*
