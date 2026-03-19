DELETE FROM "StationStatus" AS duplicate
USING "StationStatus" AS original
WHERE duplicate."stationId" = original."stationId"
  AND duplicate."recordedAt" = original."recordedAt"
  AND duplicate.id > original.id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = current_schema()
      AND tablename = 'StationStatus'
      AND indexdef LIKE 'CREATE UNIQUE INDEX % ON %"StationStatus"%("stationId", "recordedAt")%'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX "StationStatus_stationId_recordedAt_key" ON "StationStatus"("stationId", "recordedAt")';
  END IF;
END $$;
