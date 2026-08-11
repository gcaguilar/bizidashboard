-- DropIndex: redundant with StationStatus_recordedAt_stationId_bikesAvailable_anchorsFr_idx
DROP INDEX IF EXISTS "StationStatus_recordedAt_idx";

-- DropIndex: redundant with HourlyStationStat_bucketStart_stationId_idx
DROP INDEX IF EXISTS "HourlyStationStat_bucketStart_idx";
