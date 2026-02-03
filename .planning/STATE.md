# BiziDashboard State

## Project Reference

**Core Value:** Anyone can see when and where bikes are available, discover usage patterns, and understand how the Bizi system serves different neighborhoods at different times.

**Current Focus:** Phase 1 — Foundation & Data Architecture

**MVP Deadline:** 2 weeks of data collection + basic dashboard

---

## Current Position

| Attribute | Value |
|-----------|-------|
| **Phase** | 1 of 5 — Foundation & Data Architecture |
| **Plan** | 1 of 4 complete |
| **Status** | 🟡 In Progress |
| **Last activity** | 2026-02-03 — Completed 01-01-PLAN.md |
| **Blockers** | None |

### Phase 1 Progress

```
[█████░░░░░░░░░░░░░] 25%
```

**Requirements (3 total):**
- [ ] INFRA-01: Database schema with proper time-series structure
- [ ] INFRA-02: Timezone handling (UTC storage, Europe/Madrid display)
- [ ] INFRA-03: DST handling (March/October transitions)

**Success Criteria (5 total):**
1. [ ] Database schema supports time-series station data with proper indexes
2. [ ] All timestamps stored in UTC with Europe/Madrid display conversion
3. [ ] DST transitions handled correctly (no missing/duplicate hours)
4. [ ] Data retention ladder defined (raw: 30 days, hourly: 1 year, daily: forever)
5. [ ] Prisma migrations run successfully in CI/CD

---

## Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| **Phases Complete** | 0/5 | Roadmap just created |
| **Requirements Complete** | 0/28 | Not started |
| **Success Criteria Met** | 0/35 | Not started |
| **Open Blockers** | 0 | Clear for Phase 1 |
| **Research Flags** | 1 | Phase 2 needs `/gsd-research-phase` |

### Phase Status Overview

| Phase | Status | Progress |
|-------|--------|----------|
| 1 - Foundation | 🟡 In Progress | 25% |
| 2 - Data Collection | 🔴 Not Started | 0% |
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
| UTC storage | Prevent DST errors | Pending Phase 1 |

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

- [ ] Migration path from SQLite to TimescaleDB documented
- [ ] Data retention policies tested before data volume grows
- [ ] API rate limiting validated against actual Bizi limits
- [ ] DST transitions tested with historical edge cases

---

## Session Continuity

### Last Action
Roadmap creation — 2026-02-03

### Next Action
`/gsd-execute-phase 1` — Execute Phase 1 plans for Foundation & Data Architecture

Last session: 2026-02-03 21:13 UTC
Stopped at: Completed 01-01-PLAN.md
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

- Research complete — high confidence in stack and architecture
- One research flag pending: Phase 2 data collection needs verification of Bizi API specifics
- No blockers for Phase 1 start
- All 28 v1 requirements mapped to 5 phases with clear success criteria

---

*State file created: 2026-02-03*
*Last updated: 2026-02-03 after roadmap creation*
