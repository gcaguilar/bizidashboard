# BiziDashboard

## What This Is

A public analytics dashboard for the Bizi Zaragoza bike-sharing system. Collects real-time station data every 30 minutes, builds historical dataset, and provides predefined analysis panels showing usage patterns, station occupancy trends, and insights about how the city's bike service is used.

## Core Value

Anyone can see when and where bikes are available, discover usage patterns, and understand how the Bizi system serves different neighborhoods at different times.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **DATA-01**: Automated data collection from Bizi API every 30 minutes
- [ ] **DATA-02**: Store station status data (available bikes, free anchors, station ID, timestamp)
- [ ] **DATA-03**: Maintain minimum 2 weeks of historical data for MVP
- [ ] **DASH-01**: Heatmap showing station occupancy by hour and day of week
- [ ] **DASH-02**: Station rankings (most used, most empty bikes, most full anchors)
- [ ] **DASH-03**: Flow visualization showing movement patterns between areas
- [ ] **DASH-04**: Basic prediction/alerts for stations likely to run out of bikes
- [ ] **API-01**: Backend API serving aggregated analytics data
- [ ] **UI-01**: Public web dashboard with all analysis panels
- [ ] **DEPLOY-01**: Deployed and accessible publicly

### Out of Scope

- Real-time bike availability map (Bizi already has this) — focus on historical patterns instead
- User accounts/authentication — public access only for MVP
- Mobile app — web dashboard sufficient for v1
- Advanced ML predictions — basic trend-based alerts only
- Multi-city support — Zaragoza only for now
- Data older than 6 months — purge policy to manage storage

## Context

- **Data source**: Zaragoza open data API (catalog/70) providing station status every 2 minutes
- **Collection strategy**: Poll every 30 minutes to build time-series dataset without overwhelming API
- **Analysis approach**: Start with descriptive analytics (what happened), add predictive later (what will happen)
- **Public nature**: No authentication needed, anyone can access insights

## Constraints

- **API Rate Limiting**: Must respect Bizi API limits (hence 30min polling, not 2min)
- **Storage**: Self-hosted solution preferred to minimize costs for MVP
- **Timeline**: MVP focused — 1-2 weeks data collection + basic dashboard, then iterate
- **Language**: Spanish UI (target audience in Zaragoza)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 30-minute polling | Balance data granularity vs API load and storage | — Pending |
| Web-only MVP | Faster to build, no app store friction | — Pending |
| Spanish UI | Target users are in Zaragoza | — Pending |
| 2-week data for MVP | Sufficient to demonstrate patterns, extend later | — Pending |

---
*Last updated: 2025-02-03 after initialization*
