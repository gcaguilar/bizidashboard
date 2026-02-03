# Data Retention Ladder

## Policy Overview

| Resolution | Retention Period | Storage Estimate | Implementation Phase |
|------------|------------------|------------------|---------------------|
| Raw (30-min) | 30 days | ~187k records | Phase 2 (collection) |
| Hourly aggregates | 1 year | ~1.1M records | Phase 3 (analytics) |
| Daily aggregates | Forever | ~365 records/year | Phase 3 (analytics) |

## Rationale

- **Raw data 30 days**: Sufficient for debugging and detailed analysis
- **Hourly 1 year**: Supports seasonal pattern analysis
- **Daily forever**: Long-term trend analysis and capacity planning

## Storage Calculations

- 130 stations × 48 readings/day = 6,240 records/day raw
- 6,240 × 30 days = 187,200 raw records
- Hourly: 130 × 24 = 3,120 records/day
- 3,120 × 365 days = 1,138,800 hourly records/year

## Implementation Timeline

- **Phase 1**: Schema supports timestamps, no cleanup yet
- **Phase 2**: Raw collection begins, 30-day retention via cron job
- **Phase 3**: Hourly/daily aggregates created, retention enforced

## Activation Prerequisites

- Backups configured for production database before cleanup jobs run
- Retention enforcement runs off-peak to avoid ingest latency spikes
- Cleanup jobs log deletions and failures for observability
