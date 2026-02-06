-- Add unique index for StationRanking window upserts
CREATE UNIQUE INDEX "StationRanking_stationId_windowStart_windowEnd_key"
ON "StationRanking"("stationId", "windowStart", "windowEnd");

-- Add unique index for StationAlert alert window upserts
CREATE UNIQUE INDEX "StationAlert_stationId_alertType_windowHours_generatedAt_key"
ON "StationAlert"("stationId", "alertType", "windowHours", "generatedAt");
