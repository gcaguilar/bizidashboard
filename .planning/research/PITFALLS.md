# Domain Pitfalls: Bike-Sharing Analytics Dashboard

**Domain:** Public bike-sharing data analytics dashboard (Bizi Zaragoza)
**Researched:** 2026-02-03
**Confidence:** HIGH (based on verified 2025 industry practices)

## Critical Pitfalls

Mistakes that cause rewrites, data corruption, or system failure.

### Pitfall 1: Unbounded Time-Series Storage Growth

**What goes wrong:**
Collecting bike availability data every 60 seconds creates an explosion of data points. Without retention policies, storage costs outpace infrastructure budgets within 6-12 months. Raw JSON storage of full API responses multiplies storage needs by 10-50x compared to optimized columnar formats.

**Why it happens:**
Developers focus on "getting the data" without designing the data lifecycle. Each station's status every minute × 130+ stations × 365 days = ~68M data points/year. High cardinality (unique station IDs, bike IDs, statuses) creates exponential index growth before disk space even becomes the issue.

**Consequences:**
- Database performance degradation as indices grow
- Query timeouts on historical data
- Infrastructure costs exceeding project budget
- Need for painful emergency data migration

**Prevention:**
1. **Design the "Resolution Ladder" upfront:**
   - Raw data (0-7 days): 1-minute resolution
   - Aggregated (7-90 days): 15-minute averages/min/max
   - Long-term (90+ days): Hourly summaries
2. **Use columnar storage:** Store in compressed formats (Parquet/Zstd) achieving 10:1 to 40:1 compression
3. **Implement TTL policies:** Auto-delete or tier data older than retention threshold
4. **Track only changes (delta approach):** Don't store identical snapshots; only write when bike count changes

**Detection:**
- Monitor storage growth rate (should be linear, not exponential)
- Track table row counts weekly
- Set alerts when daily storage increase exceeds threshold

**Phase to address:** Data Architecture (Phase 2) — Must be designed before collection starts

---

### Pitfall 2: GBFS API Breaking Changes and Data Loss

**What goes wrong:**
The bike-sharing API (GBFS - General Bikeshare Feed Specification) undergoes version migrations. In 2025, operators are transitioning to GBFS v3.0 with breaking changes. Data collection suddenly stops working, or worse, silently produces "ghost data" (bikes appearing available that aren't).

**Why it happens:**
GBFS v3.0 deprecates `free_bike_status.json` in favor of `vehicle_status.json`, changes field structures, and requires new mandatory files. Developers hardcode API endpoints and response parsing without versioning or validation.

**Consequences:**
- Complete data loss during API migration
- "Ghost bikes" appearing on dashboard (bikes shown as available but actually reserved/non-operational)
- Coordinate shifts (bikes appearing in wrong locations)
- Broken integrations during transition periods

**Prevention:**
1. **Use GBFS discovery file:** Always read `gbfs.json` manifest to find endpoints dynamically
2. **Honor TTL headers:** Don't poll more frequently than the `ttl` value specifies (triggers rate limiting)
3. **Validate responses:** Use MobilityData GBFS Validator to catch schema drift
4. **Implement exponential backoff:** On 429 errors, wait 1s, 2s, 4s, 8s... with `Retry-After` header support
5. **Monitor for staleness:** Alert if feed hasn't updated in >5 minutes

**Detection:**
- Schema validation errors in logs
- Sudden drop in data volume
- Unusual patterns in "available" bike counts (spikes/drops)
- HTTP 404 errors on expected endpoints

**Phase to address:** Data Collection (Phase 3) — Must build versioning and validation into the collector

---

### Pitfall 3: Silent Data Pipeline Failures

**What goes wrong:**
The data pipeline appears healthy (green status checks, no errors), but the dashboard shows stale or incorrect data. The failure is "silent" — no alerts fire because the system technically "works."

**Why it happens:**
Traditional monitoring only tracks infrastructure (CPU, memory, status codes), not data quality. Schema drift, partial data loads, distribution shifts, and latency issues bypass infrastructure alerts.

**Consequences:**
- Dashboard displays outdated data for hours/days before discovery
- Loss of trust in the analytics platform
- Decisions based on stale/corrupt data
- Reputation damage if public users notice discrepancies

**Prevention:**
1. **Implement the Five Pillars of Data Observability:**
   - **Freshness:** When was data last updated? (alert if >10 minutes stale)
   - **Volume:** Did expected number of rows arrive?
   - **Schema:** Have any columns been added/dropped/renamed?
   - **Distribution:** Are values within expected bounds? (e.g., bike counts 0-50)
   - **Lineage:** Track which downstream dashboards are affected by upstream failures
2. **Add data quality checks:**
   - Row count validation (expect ~130 stations)
   - Range checks (bike counts never negative, never exceed dock capacity)
   - Referential integrity (all stations exist in station list)
3. **Use circuit breakers:** Stop accepting data that fails validation rather than storing corrupt data

**Detection:**
- Freshness alerts (data hasn't arrived on schedule)
- Volume anomalies (sudden drop in data points)
- Out-of-bound values in data quality checks
- Schema change notifications

**Phase to address:** Data Collection (Phase 3) and Monitoring (Phase 5) — Build observability from day one

---

### Pitfall 4: Europe/Madrid Timezone and DST Handling Errors

**What goes wrong:**
Timestamps are stored without timezone context, or conversions between UTC and local time are handled incorrectly. During DST transitions, data appears duplicated or missing.

**Why it happens:**
Zaragoza uses Europe/Madrid timezone (UTC+1 winter, UTC+2 summer). DST transitions on last Sunday of March (02:00→03:00) and October (03:00→02:00). Developers:
- Store local time without offset
- Use abbreviations like "CET" or "CEST" (ambiguous)
- Rely on client-side timestamps (prone to system clock errors)
- Don't account for the "missing hour" (spring forward) or "ambiguous hour" (fall back)

**Consequences:**
- "Missing" data points during spring forward (hour never exists)
- Duplicate timestamps during fall back (hour occurs twice)
- Incorrect time-based aggregations (hourly/daily counts wrong)
- Off-by-one-hour errors in historical comparisons

**Prevention:**
1. **Always store UTC:** Server-side UTC timestamps only; convert to Europe/Madrid for display
2. **Use IANA timezone names:** Reference as `Europe/Madrid`, never abbreviations
3. **Use proper timestamp types:** PostgreSQL `TIMESTAMPTZ` not `DATETIME`
4. **Handle DST explicitly:**
   - Spring forward: The hour 02:00-03:00 doesn't exist — skip it gracefully
   - Fall back: The hour 02:00-03:00 occurs twice — store with offset (CEST vs CET)
5. **Use modern libraries:** Temporal (JavaScript), `zoneinfo` (Python 3.9+), `java.time` (Java)

**Detection:**
- Aggregations that show zero values during specific hours
- Duplicate timestamp warnings in logs
- User reports of time display issues in March/October
- Mismatches between stored and displayed times

**Phase to address:** Data Architecture (Phase 2) — Must be designed into schema and collection logic

---

### Pitfall 5: Dashboard Query Timeouts with Historical Data

**What goes wrong:**
Dashboard queries that work fine with 1 week of data timeout when users request 1 year of historical data. Users see spinning loaders, 504 Gateway Timeout errors, or incomplete charts.

**Why it happens:**
- Queries scan entire raw data tables without partition pruning
- Calculations happen at query time instead of pre-computation
- No caching layer — same query runs 100 times for 100 users
- Dashboard requests more columns/rows than visualization needs

**Consequences:**
- Poor user experience (slow/unusable dashboard)
- Database overload from repeated expensive queries
- Need to restrict historical range (defeating analytics purpose)
- Server resource exhaustion

**Prevention:**
1. **Pre-aggregate data:**
   - Create materialized views or summary tables for common queries
   - Store hourly/daily/weekly rollups separately from raw data
   - Use continuous aggregates (TimescaleDB) or incremental refreshes
2. **Implement partition pruning:**
   - Partition tables by time (monthly partitions)
   - Ensure all queries include date range filters
3. **Add caching layers:**
   - Query result caching (Redis) with 5-minute TTL
   - Frontend caching (React Query/SWR) to prevent re-fetches
4. **Pushdown aggregation:**
   - Database does SUM/AVG/COUNT; dashboard receives final aggregated results (hundreds of rows, not millions)
5. **Use approximate aggregations:** HyperLogLog for unique counts (99% accuracy, 100x faster)

**Detection:**
- Query execution times trending upward
- Database CPU spikes during dashboard usage
- 504/timeout errors in logs
- User complaints about slow performance

**Phase to address:** Analytics Engine (Phase 4) — Must design aggregation layer before building visualizations

---

## Moderate Pitfalls

Mistakes that cause delays or technical debt but don't immediately break the system.

### Pitfall: Aggressive Rate Limiting Triggering API Bans

**What goes wrong:**
The data collector hits API rate limits and gets IP-banned by the bike-sharing operator, halting all data collection.

**Why it happens:**
- Polling more frequently than TTL suggests
- Making concurrent requests without respecting `Retry-After`
- Missing `Accept-Encoding: gzip` header (increases server load)
- No User-Agent identification (appears as malicious bot)
- No staggered polling (all requests at :00 seconds)

**Prevention:**
- Read and respect `ttl` field from GBFS responses
- Implement exponential backoff with jitter
- Send descriptive User-Agent with project contact info
- Use `If-Modified-Since` for conditional requests (saves bandwidth)
- Add random offset (0-5s) to polling schedule

**Phase to address:** Data Collection (Phase 3)

---

### Pitfall: Wrong Downsampling Aggregators

**What goes wrong:**
When downsampling 1-minute data to 1-hour data for long-term storage, you lose important insights because wrong aggregation functions are used.

**Why it happens:**
- Using AVERAGE for peak detection (loses micro-bursts)
- Not storing MIN/MAX alongside AVERAGE
- Aligning windows incorrectly (spikes split across buckets)
- Not including COUNT in rollups

**Prevention:**
- Store multiple aggregators: `min`, `max`, `avg`, `count`, `sum`
- Use time-based bucketing that captures peak times correctly
- Document what each rollup represents
- Test that downsampled data can still answer key questions (peak usage, total rides)

**Phase to address:** Data Architecture (Phase 2)

---

### Pitfall: Missing Data Without Interpolation Strategy

**What goes wrong:**
Data gaps from API outages or station downtime create holes in time-series. Analytics incorrectly show zero usage or calculations fail on null values.

**Why it happens:**
- No strategy for handling missing data points
- Using simple mean imputation (inappropriate for bike-sharing patterns)
- Not distinguishing between "no data" and "zero bikes"
- Not considering seasonality in interpolation

**Prevention:**
1. **Identify missingness pattern:**
   - MCAR: Random sensor glitch (interpolate)
   - MAR: Station maintenance (use nearby station correlation)
   - MNAR: Station full/empty (don't interpolate, mark as censored)
2. **Choose appropriate method:**
   - Short gaps (<1 hour): Linear or cubic spline interpolation
   - Medium gaps (1-6 hours): Seasonal decomposition using same time previous week
   - Long gaps (>6 hours): Multivariate imputation using weather/day-of-week
3. **Mark interpolated data:** Always flag interpolated values so users know

**Phase to address:** Data Processing (Phase 3)

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable without major rework.

### Pitfall: No Data Freshness Indicator in UI

**What goes wrong:**
Users don't know if the dashboard shows real-time data or stale cached data. Trust is eroded when displayed data doesn't match observed reality.

**Prevention:**
- Display "Last updated: 2 minutes ago" prominently
- Show data collection status indicator
- Use visual cues (color fade) for stale data

**Phase to address:** Frontend (Phase 4)

---

### Pitfall: Hardcoded Station Lists

**What goes wrong:**
Dashboard breaks or shows wrong data when Bizi adds/removes/repositions stations.

**Prevention:**
- Always fetch current station list from `station_information.json`
- Use station IDs as primary keys (not array indices)
- Handle unknown stations gracefully (don't crash)

**Phase to address:** Data Collection (Phase 3)

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store full JSON blobs | Simple, flexible | 10-50x storage overhead, slow queries | Never for production |
| Poll every 10 seconds | "More real-time" | API bans, wasted storage | Only if TTL < 10s |
| Skip data validation | Faster collection | Silent corruption, untrustworthy analytics | Never |
| Use client timestamps | No server clock needed | Timezone/DST errors, user clock drift | Never |
| No retention policy | "Keep everything" | Storage cost explosion, query timeouts | Never |
| Inline API parsing | Simpler code | Breaks on every schema change | MVP only with validation |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Bizi GBFS API | Hardcoded v2.2 endpoints | Use `gbfs.json` discovery, handle v3.0 migration |
| GBFS polling | Ignore `ttl` field | Respect TTL, implement backoff |
| Timezone display | Convert once at collection | Store UTC, convert at display time |
| Data storage | Use plain PostgreSQL | Use TimescaleDB or implement partitioning |
| Weather correlation | No weather data | Integrate weather API for usage analysis |

---

## Performance Traps

Patterns that work at small scale but fail as data grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Query raw data directly | 30s+ query times | Pre-aggregate with materialized views | >1 month of data |
| No partitioning | Full table scans | Partition by date, use date filters | >10M rows |
| No caching | Database overload on reload | Redis caching with 5-min TTL | >10 concurrent users |
| SELECT * | Fetching unused columns | Projection pushdown — select only needed columns | Any scale (wastes bandwidth) |
| Client-side aggregation | Browser freezing | Server-side aggregation, client gets results | >1000 data points |

---

## Security Considerations

| Concern | Risk | Mitigation |
|---------|------|------------|
| API key exposure | Unauthorized data access | Store keys in environment variables, never commit |
| Rate limit abuse | IP banned, data collection stops | Implement respectful polling with backoff |
| Data poisoning | Malicious data injection | Validate all incoming data against schema |
| Public dashboard DoS | Resource exhaustion | Rate limiting, caching, query timeouts |

---

## "Looks Done But Isn't" Checklist

Features that appear complete but are missing critical pieces:

- [ ] **Data Collection:** Often missing retry logic, backoff, and error recovery — verify all failure modes handled
- [ ] **Storage:** Often missing retention policy and compression — verify storage growth is bounded
- [ ] **Timestamp Handling:** Often missing DST transition tests — verify March and October transitions work
- [ ] **Dashboard:** Often missing loading states and error boundaries — verify UX for slow/failed queries
- [ ] **Monitoring:** Often only tracks "up/down" not data quality — verify freshness and volume checks exist
- [ ] **API Integration:** Often hardcodes endpoints — verify discovery file parsing and version handling
- [ ] **Historical Data:** Often shows only recent data — verify 6+ months of data performs acceptably

---

## Recovery Strategies

When pitfalls occur despite prevention:

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Storage explosion | MEDIUM | Implement retention policy, downsample historical data, migrate to columnar format |
| API version change | LOW-MEDIUM | Update parser to handle new schema, backfill missing data if possible |
| Silent data corruption | HIGH | Identify corrupted range, delete/recollect data, add validation to prevent recurrence |
| DST bug | LOW | Fix timezone handling, reprocess affected date ranges |
| Query timeouts | LOW | Add materialized views, implement caching, optimize queries |
| Rate limit ban | LOW | Wait for ban expiry, implement proper backoff, restart collection |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Unbounded storage | Phase 2: Architecture | Storage growth rate < 10% month-over-month |
| API breaking changes | Phase 3: Collection | Schema validation passes, no 404 errors |
| Silent failures | Phase 3-5: Collection & Monitoring | Data quality checks pass, freshness alerts work |
| Timezone/DST errors | Phase 2: Architecture | Tests pass for March/October transitions |
| Query timeouts | Phase 4: Analytics | 95th percentile query time < 2 seconds |
| Rate limiting | Phase 3: Collection | No 429 errors in logs for 30 days |
| Missing data handling | Phase 3: Processing | Interpolation tests pass, gaps < 1% of data |

---

## Domain-Specific Warnings

### Bike-Sharing Data Characteristics

**Temporal Patterns:**
- Rush hours (8-9am, 6-7pm) show 5-10x baseline usage
- Weekend patterns differ significantly from weekdays
- Weather impacts: rain reduces usage 30-70%
- Seasonal: summer usage > winter usage

**Data Quality Challenges:**
- "Ghost bikes" — bikes shown available but actually in use/reserved
- Station overflows — data shows available docks but station is full
- Sensor lag — bike return may not show for 1-5 minutes
- Maintenance mode — station offline but not marked in data

**Correlation Factors:**
- Weather (temperature, precipitation)
- Public transit schedules (bus/metro)
- Events (football matches, festivals)
- Zaragoza-specific: Feria del Pilar (October) major usage spike

---

## Sources

- MobilityData GBFS Specification v3.0 (2025): https://github.com/MobilityData/gbfs
- GBFS Best Practices: https://gbfs.org/specification
- TimescaleDB Documentation: Continuous Aggregates and Retention Policies
- Data Observability Practices (Monte Carlo, Bigeye): 5 Pillars Framework
- IANA Time Zone Database: Europe/Madrid timezone rules
- Time-Series Storage Best Practices: Downsampling, tiering, compression strategies
- Dashboard Performance Optimization: Pre-aggregation, caching, semantic layers

---

*Pitfalls research for: BiziDashboard — Bizi Zaragoza bike-sharing analytics*
*Researched: 2026-02-03*
