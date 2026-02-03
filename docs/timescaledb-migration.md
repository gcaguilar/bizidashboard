# Migration Guide: SQLite -> TimescaleDB

## When to Migrate

Migrate when ANY of these conditions are met:

- Raw data exceeds 1 million records (query slowdown)
- Analytics queries take >2 seconds consistently
- Need continuous aggregates (automatic refresh)
- Planning multi-year data retention

Timeline: Typically 3-6 months after Phase 3 launch.

## Schema Changes

### 1. Hypertable Conversion

```sql
-- Convert StationStatus to hypertable
SELECT create_hypertable('StationStatus', 'recordedAt');
```

### 2. Continuous Aggregates

```sql
-- Hourly aggregates (auto-refreshed)
CREATE MATERIALIZED VIEW hourly_station_stats
WITH (timescaledb.continuous) AS
SELECT
  stationId,
  time_bucket('1 hour', recordedAt) AS bucket_start,
  AVG(bikesAvailable) AS avg_bikes_available,
  AVG(anchorsFree) AS avg_anchors_free
FROM StationStatus
GROUP BY time_bucket('1 hour', recordedAt), stationId;
```

### 3. Prisma Schema Updates

- Change provider from "sqlite" to "postgresql"
- Add TimescaleDB extension: `extensions = [timescaledb]`
- Update connection string format

## Data Migration Strategy

1. **Backup SQLite**: `cp dev.db dev.db.backup.$(date +%Y%m%d)`
2. **Export data**: Use `prisma db seed` or `sqlite3 .dump`
3. **Setup TimescaleDB**: Docker or managed service
4. **Import with Prisma**: `prisma db seed` with migration script
5. **Validate**: Compare record counts, run test queries

## Deployment

- Keep SQLite for local development
- Use TimescaleDB for production only (via DATABASE_URL)
- Environment-specific schema with conditional providers
- Apply retention jobs only after backups are automated

## Rollback Strategy

1. **Freeze writes**: Pause ingestion jobs before switching back
2. **Restore SQLite**: Promote the pre-migration backup
3. **Repoint DATABASE_URL**: Switch back to SQLite connection string
4. **Verify**: Run record-count checks and smoke queries
