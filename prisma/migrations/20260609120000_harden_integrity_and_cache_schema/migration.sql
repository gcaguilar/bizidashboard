-- Drop redundant index covered by StationStatus_stationId_recordedAt_key.
DROP INDEX IF EXISTS "StationStatus_stationId_recordedAt_idx";

-- Store mobility briefing payloads as validated JSON instead of text.
ALTER TABLE "MobilityBriefingCache"
  ALTER COLUMN "payload" TYPE JSONB USING "payload"::jsonb;

-- Ensure one active install record per public-key fingerprint so registration upsert is atomic.
CREATE UNIQUE INDEX "Install_publicKeyFingerprint_key" ON "Install"("publicKeyFingerprint");

-- Speed up denied/success security summaries.
CREATE INDEX "SecurityEvent_outcome_createdAt_idx" ON "SecurityEvent"("outcome", "createdAt");

-- Make station deletion safe by cascading dependent time-series and analytics rows.
ALTER TABLE "StationStatus" DROP CONSTRAINT IF EXISTS "StationStatus_stationId_fkey";
ALTER TABLE "StationStatus" ADD CONSTRAINT "StationStatus_stationId_fkey"
  FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HourlyStationStat" DROP CONSTRAINT IF EXISTS "HourlyStationStat_stationId_fkey";
ALTER TABLE "HourlyStationStat" ADD CONSTRAINT "HourlyStationStat_stationId_fkey"
  FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DailyStationStat" DROP CONSTRAINT IF EXISTS "DailyStationStat_stationId_fkey";
ALTER TABLE "DailyStationStat" ADD CONSTRAINT "DailyStationStat_stationId_fkey"
  FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StationRanking" DROP CONSTRAINT IF EXISTS "StationRanking_stationId_fkey";
ALTER TABLE "StationRanking" ADD CONSTRAINT "StationRanking_stationId_fkey"
  FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StationPattern" DROP CONSTRAINT IF EXISTS "StationPattern_stationId_fkey";
ALTER TABLE "StationPattern" ADD CONSTRAINT "StationPattern_stationId_fkey"
  FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StationHeatmapCell" DROP CONSTRAINT IF EXISTS "StationHeatmapCell_stationId_fkey";
ALTER TABLE "StationHeatmapCell" ADD CONSTRAINT "StationHeatmapCell_stationId_fkey"
  FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StationAlert" DROP CONSTRAINT IF EXISTS "StationAlert_stationId_fkey";
ALTER TABLE "StationAlert" ADD CONSTRAINT "StationAlert_stationId_fkey"
  FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;
