-- Retention cleanup (Phase 3 activation)
-- NOTE: Table names for aggregates are placeholders until Phase 3 schema exists.
-- Run in a maintenance window after backups are verified.

-- Raw station status: keep 30 days
DELETE FROM StationStatus
WHERE recordedAt < datetime('now', '-30 days');

-- Hourly aggregates: keep 1 year
-- DELETE FROM StationStatusHourly
-- WHERE bucketedAt < datetime('now', '-1 year');

-- Daily aggregates: keep forever (no deletion)
-- DELETE FROM StationStatusDaily
-- WHERE bucketedAt < datetime('now', '-5 years');
