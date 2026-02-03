# Requirements: BiziDashboard

**Defined:** 2026-02-03
**Core Value:** Anyone can see when and where bikes are available, discover usage patterns, and understand how the Bizi system serves different neighborhoods at different times.

## v1 Requirements

### Data Collection (DATA)

- [ ] **DATA-01**: Automated polling of Bizi API every 30 minutes
- [ ] **DATA-02**: Store station status (station ID, available bikes, free anchors, timestamp)
- [ ] **DATA-03**: Implement data validation (freshness, volume, schema checks)
- [ ] **DATA-04**: Handle GBFS API changes gracefully (version-agnostic parsing)
- [ ] **DATA-05**: Error handling with exponential backoff for rate limiting
- [ ] **DATA-06**: Data retention ladder (raw: 30 days, hourly: 1 year, daily: forever)

### Analytics Engine (ANAL)

- [ ] **ANAL-01**: Continuous aggregates for hourly statistics
- [ ] **ANAL-02**: Continuous aggregates for daily statistics
- [ ] **ANAL-03**: Station rankings by turnover rate (most used)
- [ ] **ANAL-04**: Station rankings by availability issues (often empty/full)
- [ ] **ANAL-05**: Hour-of-day pattern analysis (weekday vs weekend)
- [ ] **ANAL-06**: Heatmap data (occupancy by hour × day of week)
- [ ] **ANAL-07**: Basic prediction alerts (threshold-based availability warnings)

### API Layer (API)

- [ ] **API-01**: REST endpoint for station list with current status
- [ ] **API-02**: REST endpoint for station rankings
- [ ] **API-03**: REST endpoint for hour-of-day patterns
- [ ] **API-04**: REST endpoint for heatmap data
- [ ] **API-05**: REST endpoint for prediction/alerts
- [ ] **API-06**: Redis caching layer (5-min TTL for hot queries)

### Dashboard Frontend (DASH)

- [ ] **DASH-01**: Station map with occupancy indicators
- [ ] **DASH-02**: Real-time status indicator (last update timestamp)
- [ ] **DASH-03**: Station rankings table (sortable, searchable)
- [ ] **DASH-04**: Hour-of-day charts (weekday vs weekend patterns)
- [ ] **DASH-05**: Occupancy heatmap (station × hour × day)
- [ ] **DASH-06**: Basic prediction alerts (stations likely to empty soon)
- [ ] **DASH-07**: Spanish UI (all text in Spanish for Zaragoza audience)
- [ ] **DASH-08**: Responsive design (mobile and desktop)

### Infrastructure (INFRA)

- [ ] **INFRA-01**: Database schema with proper time-series structure
- [ ] **INFRA-02**: Timezone handling (UTC storage, Europe/Madrid display)
- [ ] **INFRA-03**: DST handling (March/October transitions)
- [ ] **INFRA-04**: Data observability (freshness alerts, volume checks)
- [ ] **INFRA-05**: Public deployment (accessible URL)

## v2 Requirements

### Analytics

- **ANAL-08**: Flow visualization (origin-destination trips) — *requires trip data from API*
- **ANAL-09**: Neighborhood-level aggregation (compare Zaragoza districts)
- **ANAL-10**: Weather impact analysis (correlate with weather API)
- **ANAL-11**: Peak vs off-peak station transformation analysis

### Dashboard

- **DASH-09**: Flow map visualization (if trip data available)
- **DASH-10**: Weather correlation charts
- **DASH-11**: Advanced predictions (ML-based availability forecasting)

### Data

- **DATA-07**: Historical data beyond 6 months (long-term trends)
- **DATA-08**: Data export functionality (CSV/JSON)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time bike locator map | Bizi official app already provides this — we focus on historical patterns |
| User accounts/authentication | Creates friction for public tool — anonymous access only |
| Trip booking/reservation | Requires Bizi operational integration — out of scope |
| Mobile native app | PWA/web sufficient for MVP — defer to v2+ |
| Advanced ML predictions | Over-engineering for MVP — threshold-based alerts sufficient |
| Multi-city support | Dilutes Zaragoza focus — single city only |
| Social features/gamification | Doesn't serve core value proposition |
| Real-time push notifications | Requires infrastructure complexity — polling-based dashboard sufficient |

## Pivot Plan

**If Bizi API lacks trip data (origin-destination):**
- Flow visualization (ANAL-08, DASH-09) moves to v2 or out of scope
- Pivot focus to: Occupancy pattern analysis (rate of fill/empty by station)
- Alternative insight: "Estaciones que más rápido se vacían/llenan" instead of "De dónde a dónde van"

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
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 2 | Pending |
| INFRA-05 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 0 (pending roadmap creation)
- Unmapped: 28 ⚠️

---
*Requirements defined: 2026-02-03*
*Last updated: 2026-02-03 after initialization*
