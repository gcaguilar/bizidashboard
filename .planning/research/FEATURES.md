# Feature Landscape: Bike-Sharing Analytics Dashboard

**Domain:** Bike-Sharing System Analytics Dashboard  
**Project:** BiziDashboard - Public analytics dashboard for Bizi Zaragoza  
**Researched:** 2026-02-03  
**Overall confidence:** MEDIUM (based on GBFS ecosystem research and Citi Bike analysis)

---

## Table Stakes

Features users expect from any bike-sharing analytics dashboard. Missing these makes the product feel incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Station Status Map** | Basic visualization showing station locations with current occupancy | Low | GBFS standard; expected for any system visualization |
| **Station Rankings** | "Which stations are most used?" Core question every dashboard answers | Low | Sortable table by metrics like total rides, turnover rate |
| **Hour-of-Day Patterns** | When do people ride? Shows rush hour vs leisure usage | Low | Standard bar chart; weekday vs weekend patterns expected |
| **Daily/Weekly Usage Charts** | Time-series showing overall system activity over time | Low | Line charts showing ridership trends are table stakes |
| **Station Occupancy Heatmap** | Shows when stations fill/empty (hour × day matrix) | Medium | Confirms patterns like "which stations are empty at 9am Monday" |
| **Real-Time Status Indicator** | Is the data current? Last update timestamp | Low | Users need to trust data freshness |
| **Station List with Metrics** | Searchable list of stations with basic stats | Low | GBFS provides this data natively |

---

## Differentiators

Features that set a dashboard apart. Not expected, but create unique value and insights.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Flow Visualization (Origin-Destination)** | Reveals movement patterns between neighborhoods; answers "where are people going?" | **HIGH** | Requires trip data, not just station status. Visualizes commute corridors like Brooklyn↔Manhattan |
| **Prediction/Availability Forecasting** | "Will bikes be available when I arrive?" Reduces failed pickup attempts | **HIGH** | Simple: trend-based alerts. Complex: ML models. HIGH complexity for good accuracy |
| **Neighborhood-Level Aggregation** | Compare districts/barangays usage patterns; equity analysis | Medium | Groups stations by area; reveals service coverage gaps |
| **Weather Impact Analysis** | Quantify how rain/temperature affects ridership; explains anomalies | Medium | Correlate weather data with usage; seasonality patterns |
| **Peak vs Off-Peak Comparison** | Identify stations that transform from commuter hubs to leisure destinations | Medium | Requires temporal clustering analysis |
| **Empty/Full Station Alerts** | Proactive notifications for stations likely to have issues | Medium | Simple thresholds → sophisticated prediction |
| **Trip Duration Analysis** | How long do rides take? Route efficiency insights | Medium | Requires trip-level data, not just status |
| **Bike Rebalancing Insights** | "Magic transport" tracking - where are bikes moved by operators? | **HIGH** | Detects bikes appearing at different stations between rides |
| **Demographic Insights** | Subscriber vs casual patterns, age/gender breakdowns | Low-Medium | If trip data includes demographics (Citi Bike does) |
| **Route Popularity Map** | Most-traveled road segments (not just stations) | **HIGH** | Requires mapping trip paths (Google Maps routing or GPS traces) |
| **Comparative Analysis** | How does Zaragoza compare to similar-sized cities? | Medium | Benchmarking against other GBFS systems |

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in bike-sharing dashboard projects.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Real-Time Bike Locator** | Bizi already provides this via their official app | Focus on historical patterns and analytics they don't offer |
| **User Authentication** | Creates friction for public tool; unnecessary for analytics | Keep it fully public; add auth only if user-specific features needed later |
| **Trip Booking/Reservation** | Out of scope; requires integration with Bizi's operational system | Stay read-only; visualize only |
| **Mobile Native App** | Web dashboard sufficient for MVP; app store friction slows adoption | Progressive Web App (PWA) if mobile optimization needed |
| **Advanced ML Predictions** | Over-engineering for MVP; complex models need lots of training data | Start with simple threshold-based alerts ("<5 bikes = likely empty soon") |
| **Multi-City Comparison** | Dilutes focus; adds complexity without value for Zaragoza users | Stay Zaragoza-focused; maybe add comparison post-MVP |
| **Individual Trip History** | Privacy concerns; requires authentication; not useful for public dashboard | Aggregate only; no individual tracking |
| **Live Navigation/Routing** | Duplicates Google Maps, Citymapper, Transit apps | Integrate with those apps via GBFS rather than building routing |
| **Historical Data Beyond 6 Months** | Storage costs grow; diminishing returns for pattern analysis | 6-month rolling window; export/archival if needed |
| **Social Features (check-ins, leaderboards)** | Gamification doesn't serve the core value proposition | Stay focused on insights, not engagement metrics |

---

## Feature Dependencies

```
Data Collection (30min polling)
    ↓
Station Status Storage
    ↓
    ├── Station Rankings (aggregate count)
    ├── Station Occupancy Heatmap (time-series aggregation)
    ├── Hour/Day Patterns (time bucketing)
    └── Basic Threshold Alerts (current values)

Trip Data Collection (if available)
    ↓
    ├── Flow Visualization (OD matrix)
    ├── Trip Duration Analysis (time calculations)
    ├── Route Popularity (path mapping)
    └── Rebalancing Detection (station-to-station tracking)

Historical Data (weeks of history)
    ↓
    └── Prediction/Forecasting (trend analysis)
        └── ML Predictions (large training set)
```

---

## MVP Recommendation

For BiziDashboard MVP, prioritize in this order:

### Must Have (Phase 1)
1. **Station Occupancy Heatmap (DASH-01)** - Differentiator from Bizi's official app
2. **Station Rankings (DASH-02)** - Quick value, easy to implement
3. **Basic Prediction/Alerts (DASH-04 simple)** - Threshold-based "low bike" warnings
4. **Hour/Day Pattern Charts** - Table stakes visualization

### Should Have (Phase 2)
5. **Flow Visualization (DASH-03)** - HIGH complexity but major differentiator
6. **Neighborhood Aggregation** - Context for Zaragoza's districts
7. **Weather Correlation** - Explains usage anomalies

### Could Have (Phase 3+)
8. **Trip Duration Analysis** - Requires trip-level data
9. **Bike Rebalancing Tracking** - Operational insight
10. **Route Popularity Map** - Visual wow factor

### Defer/Don't Build
- Real-time map (Bizi has this)
- User accounts (no value for public tool)
- Mobile app (PWA instead if needed)
- Advanced ML predictions (start simple)

---

## Complexity Assessment

| Feature | Backend Complexity | Frontend Complexity | Data Requirements |
|---------|-------------------|---------------------|-------------------|
| Station Rankings | Low (aggregation) | Low (sortable table) | Station status history |
| Occupancy Heatmap | Low (time bucketing) | Medium (heatmap viz) | 2+ weeks of hourly data |
| Hour/Day Charts | Low (GROUP BY) | Low (bar charts) | Timestamped status data |
| Basic Alerts | Low (thresholds) | Low (badge/indicator) | Current station status |
| Flow Visualization | **HIGH** (OD matrix) | **HIGH** (flow map) | **Trip data required** |
| Weather Analysis | Medium (API integration) | Low (correlation chart) | Weather API + usage data |
| Predictions | **HIGH** (trend/ML) | Medium (forecast UI) | Months of historical data |

---

## Data Source Implications

### From GBFS Feed (Station Status Only)
- ✅ Station Rankings (by turnover/occupancy changes)
- ✅ Occupancy Heatmap (station-level, not trip-based)
- ✅ Current availability
- ❌ Flow patterns (no origin-destination data)
- ❌ Trip duration
- ❌ Route popularity

### From Historical Trip Data (if available from Bizi)
- ✅ Flow Visualization (OD matrix)
- ✅ Trip Duration Analysis
- ✅ Commuter pattern validation
- ✅ Rebalancing detection

**Critical Question for Roadmap:** Does Bizi Zaragoza's open data API include trip histories or only station status? This determines if flow visualization (DASH-03) is possible.

---

## Sources

1. **Todd Schneider's Citi Bike Analysis** (https://toddwschneider.com/posts/a-tale-of-twenty-two-million-citi-bikes/)
   - Trip patterns by time of day and day of week
   - Flow visualization techniques (Torque.js, CartoDB)
   - Weather impact modeling approach
   - Bike rebalancing detection methodology

2. **GBFS Specification** (https://github.com/MobilityData/gbfs)
   - Standard data feeds available (station_status, system_information)
   - Real-time vs historical data distinction
   - Community tools and visualization approaches

3. **GBFS Tools Directory** (https://gbfs.org/tools/)
   - Existing visualization libraries
   - Common dashboard patterns in ecosystem
   - Integration approaches

4. **Bike Share Research** (https://bikeshare-research.org/)
   - Data structure standards across systems
   - Parser approaches for different feed formats

5. **Bike Share Map** (https://bikesharemap.com/)
   - Global dashboard patterns
   - Real-time visualization approaches

---

*Confidence note: Most findings are MEDIUM confidence based on analysis of existing dashboards and GBFS ecosystem. LOW confidence on Zaragoza-specific data availability - requires verification of Bizi API capabilities.*
