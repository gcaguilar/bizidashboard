CREATE TABLE "HourlyTransitImpact" (
  "stationId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "bucketStart" DATETIME NOT NULL,
  "departures" REAL NOT NULL,
  "arrivalPressureAvg" REAL NOT NULL,
  "arrivalEvents" INTEGER NOT NULL,
  "sampleCount" INTEGER NOT NULL,
  "hasArrivalEvent" BOOLEAN NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,

  PRIMARY KEY ("stationId", "provider", "bucketStart"),
  CONSTRAINT "HourlyTransitImpact_stationId_fkey"
    FOREIGN KEY ("stationId") REFERENCES "Station" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "StationTransitLink_provider_stationId_idx"
ON "StationTransitLink"("provider", "stationId");

CREATE INDEX "TransitSnapshot_provider_isStale_observedAt_transitStopId_idx"
ON "TransitSnapshot"("provider", "isStale", "observedAt", "transitStopId");

CREATE INDEX "TransitSnapshot_provider_transitStopId_observedAt_idx"
ON "TransitSnapshot"("provider", "transitStopId", "observedAt");

CREATE INDEX "HourlyTransitImpact_provider_bucketStart_idx"
ON "HourlyTransitImpact"("provider", "bucketStart");

CREATE INDEX "HourlyTransitImpact_bucketStart_idx"
ON "HourlyTransitImpact"("bucketStart");

CREATE INDEX "HourlyTransitImpact_stationId_bucketStart_idx"
ON "HourlyTransitImpact"("stationId", "bucketStart");
