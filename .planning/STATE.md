# BiziDashboard State

## Project Reference

**Core Value:** Anyone can see when and where bikes are available, discover usage patterns, and understand how the Bizi system serves different neighborhoods at different times.

**Current Focus:** Phase 2 — Data Collection & Validation (Planning Complete)

**MVP Deadline:** 2 weeks of data collection + basic dashboard

---

## Current Position

| Attribute | Value |
|-----------|-------|
| **Phase** | 2 of 5 — Data Collection & Validation |
| **Plan** | 1 of 4 in current phase |
| **Status** | 🟡 In Progress |
| **Last activity** | 2026-02-05 — Completed 02-01-PLAN.md |
| **Blockers** | None |

### Phase 2 Progress

```
[████░░░░░░░░░░░░░░░░] 25%
```

**Plans in Phase:**
- [x] 02-01: GBFS API Client Infrastructure
- [ ] 02-02: Data Fetcher & Scheduler
- [ ] 02-03: Data Storage Layer
- [ ] 02-04: Pipeline Observability

---

## Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| **Phases Complete** | 2/5 in progress | Phase 1 complete, Phase 2 in progress |
| **Requirements Complete** | 3/28 | In progress |
| **Success Criteria Met** | 5/35 | In progress |
| **Open Blockers** | 0 | Clear for Phase 2 |
| **Research Flags** | 0 | Phase 2 research completed |

### Phase Status Overview

| Phase | Status | Progress |
|-------|--------|----------|
| 1 - Foundation | 🟢 Complete | 100% |
| 2 - Data Collection | 🟡 In Progress | 25% |
| 3 - Analytics Engine | 🔴 Not Started | 0% |
| 4 - API Layer | 🔴 Not Started | 0% |
| 5 - Dashboard | 🔴 Not Started | 0% |

---

## Accumulated Context

### Key Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| 30-minute polling | Balance granularity vs API load and storage | Pending Phase 2 |
| SQLite for MVP | Zero-config for 87k records, migrate to TimescaleDB at scale | Pending Phase 1 |
| Prisma LibSQL adapter for SQLite client | Required by Prisma 7 driver adapters for SQLite | Phase 1 |
| DATABASE_URL configured via prisma.config.ts | Prisma 7 disallows datasource URLs in schema files | Phase 1 |
| Spanish UI | Target users in Zaragoza | Pending Phase 5 |
| 2-week data for MVP | Sufficient to demonstrate patterns | Pending Phase 3 |
| UTC storage | Prevent DST errors | Phase 1 |
| Vitest for DST/unit tests | Fast Node-based test runner | Phase 1 |
| Normalize missing spring hour to 03:00 local | Avoid invalid timestamps | Phase 1 |
| Resolve ambiguous fall-back hour to first occurrence | Consistent storage choice | Phase 1 |
| CI validation uses sqlite DATABASE_URL | Avoids secrets on PR validation/generation | Phase 1 |
| Health check reads _prisma_migrations | Confirms schema reachability post-deploy | Phase 1 |
| Native fetch over axios | Smaller bundle size, Node 18+ built-in | Phase 2 |
| Custom retry with exponential backoff + jitter | More control than retry-axios | Phase 2 |
| Zod with .passthrough() for GBFS | Version-agnostic parsing for forward compatibility | Phase 2 |
| 10-second API request timeout | Balance reliability and responsiveness | Phase 2 |

### Critical Pitfalls (From Research)

1. **Unbounded Time-Series Storage** — Prevention: Resolution ladder defined Phase 1, enforced Phase 3
2. **GBFS API Breaking Changes** — Prevention: Version-agnostic discovery parsing Phase 2
3. **Silent Data Pipeline Failures** — Prevention: Five Pillars observability Phase 2
4. **Europe/Madrid Timezone/DST** — Prevention: UTC storage with IANA names Phase 1
5. **Dashboard Query Timeouts** — Prevention: Pre-computed aggregates Phase 3, thin API Phase 4

### Open Questions

1. Does Bizi API provide trip data (origin-destination) or only station status? — *Determines if flow visualization (Phase 6/v2) is possible*
2. What is Bizi's exact GBFS version and rate limits? — *Research in Phase 2 planning*
3. Which weather API for Zaragoza? — *Defer to Phase 6/v2 research*

### Technical Debt Watchlist

- [x] Migration path from SQLite to TimescaleDB documented
- [ ] Data retention policies tested before data volume grows
- [ ] API rate limiting validated against actual Bizi limits
- [x] DST transitions tested with historical edge cases

---

## Session Continuity

### Last Action
Phase 2 Plan 01 execution — 2026-02-05

### Next Action
Execute 02-02-PLAN.md (Data Fetcher & Scheduler)

Last session: 2026-02-05 21:03 UTC
Stopped at: Completed 02-01-PLAN.md
Resume file: None

### Context Recovery

**If resuming after context loss:**

1. Read `.planning/ROADMAP.md` for phase structure
2. Read `.planning/REQUIREMENTS.md` for detailed requirements
3. Read `.planning/research/SUMMARY.md` for technical context and pitfalls
4. This file (`.planning/STATE.md`) for current position
5. Run `/gsd-plan-phase 1` to start Phase 1 planning

**Quick state check:**
```bash
cat .planning/STATE.md | grep -A 5 "Current Position"
cat .planning/ROADMAP.md | grep -A 10 "Progress"
```

---

## Notes

- Phase 1 complete — Foundation & Data Architecture ready
- Phase 2 in progress — Data Collection & Validation
  - 02-01 complete: GBFS API client with retry and validation
  - Wave 1 plans (02-01, 02-02) ready for execution
- No blockers for Phase 2 execution
- All 28 v1 requirements mapped to 5 phases with clear success criteria

---

*State file created: 2026-02-03*
*Last updated: 2026-02-05 after 02-01 execution*
