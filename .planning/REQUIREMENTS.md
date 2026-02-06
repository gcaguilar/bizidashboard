# Requirements: BiziDashboard

**Defined:** 2026-02-03
**Core Value:** Anyone can see when and where bikes are available, discover usage patterns, and understand how the Bizi system serves different neighborhoods at different times.

## v1 Requirements

### Data Collection (DATA)

- [x] **DATA-01**: Automated polling of Bizi API every 30 minutes
- [x] **DATA-02**: Store station status (station ID, available bikes, free anchors, timestamp)
- [x] **DATA-03**: Implement data validation (freshness, volume, schema checks)
- [x] **DATA-04**: Handle GBFS API changes gracefully (version-agnostic parsing)
- [x] **DATA-05**: Error handling with exponential backoff for rate limiting
- [x] **DATA-06**: Data retention ladder (raw: 30 days, hourly: 1 year, daily: forever)

### Analytics Engine (ANAL)

- [x] **ANAL-01**: Continuous aggregates for hourly statistics
- [x] **ANAL-02**: Continuous aggregates for daily statistics
- [x] **ANAL-03**: Station rankings by turnover rate (most used)
- [x] **ANAL-04**: Station rankings by availability issues (often empty/full)
- [x] **ANAL-05**: Hour-of-day pattern analysis (weekday vs weekend)
- [x] **ANAL-06**: Heatmap data (occupancy by hour × day of week)
- [x] **ANAL-07**: Basic prediction alerts (threshold-based availability warnings)

### API Layer (API)

- [x] **API-01**: REST endpoint for station list with current status
- [x] **API-02**: REST endpoint for station rankings
- [x] **API-03**: REST endpoint for hour-of-day patterns
- [x] **API-04**: REST endpoint for heatmap data
- [x] **API-05**: REST endpoint for prediction/alerts
- [x] **API-06**: Redis caching layer (5-min TTL for hot queries)

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

- [x] **INFRA-01**: Database schema with proper time-series structure
- [x] **INFRA-02**: Timezone handling (UTC storage, Europe/Madrid display)
- [x] **INFRA-03**: DST handling (March/October transitions)
- [x] **INFRA-04**: Data observability (freshness alerts, volume checks)
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
| DATA-01 | Phase 2 | Complete |
| DATA-02 | Phase 2 | Complete |
| DATA-03 | Phase 2 | Complete |
| DATA-04 | Phase 2 | Complete |
| DATA-05 | Phase 2 | Complete |
| DATA-06 | Phase 3 | Complete |
| ANAL-01 | Phase 3 | Complete |
| ANAL-02 | Phase 3 | Complete |
| ANAL-03 | Phase 3 | Complete |
| ANAL-04 | Phase 3 | Complete |
| ANAL-05 | Phase 3 | Complete |
| ANAL-06 | Phase 3 | Complete |
| ANAL-07 | Phase 3 | Complete |
| API-01 | Phase 4 | Complete |
| API-02 | Phase 4 | Complete |
| API-03 | Phase 4 | Complete |
| API-04 | Phase 4 | Complete |
| API-05 | Phase 4 | Complete |
| API-06 | Phase 4 | Complete |
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
| INFRA-04 | Phase 2 | Complete |
| INFRA-05 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28 ✓
- Unmapped: 0 ✓

**Phase Distribution:**
- Phase 1 (Foundation): 3 requirements
- Phase 2 (Data Collection): 6 requirements
- Phase 3 (Analytics Engine): 8 requirements
- Phase 4 (API Layer): 6 requirements
- Phase 5 (Dashboard): 9 requirements

---
*Requirements defined: 2026-02-03*
*Last updated: 2026-02-06 after Phase 4 completion*
