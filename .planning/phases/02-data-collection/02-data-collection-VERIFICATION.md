---
phase: 02-data-collection
verified: 2026-02-05T21:34:27Z
status: gaps_found
score: 17/20 must-haves verified
gaps:
  - truth: "Cron job runs every 30 minutes automatically"
    status: failed
    reason: "Scheduled job exists but no startup wiring calls startCollectionJob"
    artifacts:
      - path: "src/lib/jobs.ts"
        issue: "initJobs() not invoked anywhere in app startup"
      - path: "src/app/layout.tsx"
        issue: "No initJobs() call to start background jobs"
    missing:
      - "Call initJobs() during server startup (e.g., in src/app/layout.tsx)"
      - "Document startup requirement for background job scheduling"
  - truth: "Schema validation errors logged and tracked"
    status: failed
    reason: "Zod schema errors are logged but never counted in observability metrics"
    artifacts:
      - path: "src/schemas/gbfs.ts"
        issue: "validateStationData logs and throws without metrics tracking"
      - path: "src/services/data-validator.ts"
        issue: "schemaErrors parameter is never passed from gbfs-client"
    missing:
      - "Capture schema validation errors from gbfs-client"
      - "Pass schemaErrors into validateAndStore for metrics tracking"
  - truth: "Metrics stored persistently across restarts"
    status: failed
    reason: "Validation errors and consecutive failures are stored only in memory"
    artifacts:
      - path: "src/lib/metrics.ts"
        issue: "metricsCache holds validationErrors and consecutiveFailures"
    missing:
      - "Persist validation errors and consecutive failures or derive them from DB"
  - truth: "GBFS types available via dedicated types module"
    status: failed
    reason: "Required types file is missing"
    artifacts:
      - path: "src/types/gbfs.ts"
        issue: "File does not exist"
    missing:
      - "Create src/types/gbfs.ts exporting GBFS types"
---

# Phase 2: Data Collection & Validation Verification Report

**Phase Goal:** Reliable automated data pipeline with quality checks and error handling.
**Verified:** 2026-02-05T21:34:27Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | GBFS discovery file can be fetched and parsed | ✓ VERIFIED | `src/services/gbfs-client.ts` uses `fetchDiscovery()` with validation |
| 2 | Station status endpoint discovered dynamically from discovery | ✓ VERIFIED | `extractStationStatusUrl()` used in `fetchStationStatus()` |
| 3 | API calls retry with exponential backoff and jitter | ✓ VERIFIED | `withRetry()` used in `src/services/gbfs-client.ts` |
| 4 | GBFS responses validated against Zod schemas | ✓ VERIFIED | `validateDiscovery()`/`validateStationData()` in `src/schemas/gbfs.ts` |
| 5 | Version-agnostic parsing allows future GBFS upgrades | ✓ VERIFIED | Zod schemas use `.passthrough()` in `src/schemas/gbfs.ts` |
| 6 | Station status records stored in database with UTC timestamps | ✓ VERIFIED | `recordedAt: new Date(last_reported * 1000)` in `src/services/data-storage.ts` |
| 7 | Data freshness checked (>10 min old flagged stale) | ✓ VERIFIED | `maxAgeSeconds` enforced in `src/lib/observability.ts` (5 min threshold) |
| 8 | Volume anomalies detected (station count outside 200-500 range) | ✓ VERIFIED | `QUALITY_THRESHOLDS.volume` in `src/lib/observability.ts` |
| 9 | Schema validation errors logged and tracked | ✗ FAILED | Schema errors logged but not passed into metrics (`src/schemas/gbfs.ts`, `src/services/data-validator.ts`) |
| 10 | Observability metrics recorded for each collection | ✓ VERIFIED | `logObservabilityMetrics()` and `recordCollection()` in `src/services/data-validator.ts`/`src/jobs/bizi-collection.ts` |
| 11 | Cron job runs every 30 minutes automatically | ✗ FAILED | `startCollectionJob()` defined but never invoked in app startup |
| 12 | Collection can be triggered manually via API endpoint | ✓ VERIFIED | `POST /api/collect` uses `runCollection()` in `src/app/api/collect/route.ts` |
| 13 | Each run fetches, validates, and stores station data | ✓ VERIFIED | `runCollection()` calls `fetchStationStatus()` and `validateAndStore()` |
| 14 | Errors logged but don't crash the job | ✓ VERIFIED | Cron callback catches errors in `src/jobs/bizi-collection.ts` |
| 15 | Job reports success/failure with metrics | ✓ VERIFIED | `recordCollection()` in `finally` block of `runCollection()` |
| 16 | Status endpoint shows last successful poll timestamp | ✓ VERIFIED | `getStatus()` includes `lastSuccessfulPoll` in `src/lib/metrics.ts` |
| 17 | Status endpoint shows total rows collected | ✓ VERIFIED | `getTotalRowsCollected()` used in `getMetrics()` |
| 18 | Status endpoint shows validation errors count | ✓ VERIFIED | `validationErrors` in `getMetrics()` returned by `/api/status` |
| 19 | Status endpoint shows data freshness status | ✓ VERIFIED | `isDataFresh()` used in `getStatus()` |
| 20 | Metrics stored persistently across restarts | ✗ FAILED | `metricsCache` stores validation errors and failures only in memory |

**Score:** 17/20 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/lib/retry.ts` | Exponential backoff with jitter for HTTP retries | ✓ VERIFIED | Substantive, exported `withRetry`, used in `src/services/gbfs-client.ts` |
| `src/schemas/gbfs.ts` | Zod schemas for GBFS validation | ✓ VERIFIED | Substantive, exported schemas, used in `src/services/gbfs-client.ts` |
| `src/services/gbfs-client.ts` | GBFS API wrapper with retry | ✓ VERIFIED | Substantive, used by `src/jobs/bizi-collection.ts` |
| `src/types/gbfs.ts` | TypeScript types from Zod schemas | ✗ MISSING | File not found |
| `src/services/data-storage.ts` | Database operations for station status | ✓ VERIFIED | Substantive, used by `src/services/data-validator.ts` |
| `src/lib/observability.ts` | Five Pillars data observability checks | ✓ VERIFIED | Substantive, used by `src/services/data-validator.ts` |
| `src/services/data-validator.ts` | Data validation orchestration | ✓ VERIFIED | Substantive, used by `src/jobs/bizi-collection.ts` |
| `src/jobs/bizi-collection.ts` | Scheduled data collection job | ⚠️ ORPHANED | Scheduled job defined but startup wiring missing |
| `src/app/api/collect/route.ts` | Manual trigger endpoint | ✓ VERIFIED | Substantive, exports `POST` and `GET` |
| `src/app/api/status/route.ts` | Observability dashboard API | ✓ VERIFIED | Substantive, uses `getStatus()` |
| `src/lib/metrics.ts` | Persistent metrics tracking | ⚠️ PARTIAL | DB-backed metrics plus in-memory counters |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `src/services/gbfs-client.ts` | `src/lib/retry.ts` | `withRetry` | ✓ WIRED | Retry wrapper used for discovery and station status fetch |
| `src/services/gbfs-client.ts` | `src/schemas/gbfs.ts` | Zod validation | ✓ WIRED | `validateDiscovery()`/`validateStationData()` calls present |
| `src/services/data-validator.ts` | `src/lib/observability.ts` | `validateDataQuality` | ✓ WIRED | Metrics generated and logged |
| `src/services/data-validator.ts` | `src/services/data-storage.ts` | `storeStationStatuses` | ✓ WIRED | Storage invoked after validation |
| `src/lib/observability.ts` | Prisma StationStatus | count/groupBy | ✓ WIRED | Volume checks query database |
| `src/jobs/bizi-collection.ts` | `src/services/gbfs-client.ts` | `fetchStationStatus` | ✓ WIRED | Fetch step in runCollection |
| `src/jobs/bizi-collection.ts` | `src/services/data-validator.ts` | `validateAndStore` | ✓ WIRED | Validation and storage step |
| `src/app/api/collect/route.ts` | `src/jobs/bizi-collection.ts` | `runCollection` | ✓ WIRED | Manual trigger endpoint calls job |
| `src/app/api/status/route.ts` | `src/lib/metrics.ts` | `getStatus` | ✓ WIRED | Status endpoint uses metrics |
| App startup | `src/jobs/bizi-collection.ts` | `startCollectionJob` | ✗ NOT_WIRED | `initJobs()` not called anywhere |
| `src/lib/observability.ts` | `src/lib/metrics.ts` | `incrementValidationErrors` | ✓ WIRED | Validation errors incremented when metrics errors exist |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
| --- | --- | --- |
| DATA-01: Automated polling every 30 minutes | ✗ BLOCKED | Job not started automatically (missing startup wiring) |
| DATA-02: Store station status fields | ✓ SATISFIED | Storage pipeline persists station status |
| DATA-03: Data validation (freshness, volume, schema) | ✓ SATISFIED | Observability checks + Zod schema validation |
| DATA-04: Version-agnostic GBFS parsing | ✓ SATISFIED | `.passthrough()` schemas and discovery-based endpoints |
| DATA-05: Error handling with exponential backoff | ✓ SATISFIED | `withRetry()` handles 5xx/429 with jitter |
| INFRA-04: Data observability | ✓ SATISFIED | Freshness/volume checks and status endpoint |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `src/app/api/collect/route.ts` | 11 | TODO comment | ⚠️ Warning | Missing API auth for production safety |

### Human Verification Required

1. **Cron job scheduling**

**Test:** Deploy and confirm the background job runs every 30 minutes without manual triggers.
**Expected:** Records are inserted on schedule and `/api/status` shows recent polls.
**Why human:** Requires runtime environment and scheduler behavior.

2. **Status endpoint data quality**

**Test:** Call `/api/status` after several polls.
**Expected:** last poll timestamp, total rows, validation errors, and freshness reflect real data.
**Why human:** Requires real data and DB state.

### Gaps Summary

Automated polling is not wired to app startup, so the cron scheduler never starts. Schema validation errors are logged but not routed into observability metrics. Metrics that should persist across restarts (validation errors and failure counters) are stored only in memory. The GBFS types module declared in must-haves is missing.

---

_Verified: 2026-02-05T21:34:27Z_
_Verifier: Claude (gsd-verifier)_
