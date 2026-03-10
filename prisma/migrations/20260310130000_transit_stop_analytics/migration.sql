CREATE TABLE "HourlyTransitStopStat" (
  "transitStopId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "bucketStart" DATETIME NOT NULL,
  "etaMin" INTEGER,
  "etaAvg" REAL,
  "etaMax" INTEGER,
  "arrivalPressureAvg" REAL NOT NULL,
  "arrivalEvents" INTEGER NOT NULL,
  "sampleCount" INTEGER NOT NULL,
  "staleSampleCount" INTEGER NOT NULL,
  "realtimeSampleCount" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,

  PRIMARY KEY ("transitStopId", "bucketStart"),
  CONSTRAINT "HourlyTransitStopStat_transitStopId_fkey"
    FOREIGN KEY ("transitStopId") REFERENCES "TransitStop" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "TransitStopPattern" (
  "transitStopId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "dayType" TEXT NOT NULL,
  "hour" INTEGER NOT NULL,
  "etaAvg" REAL,
  "arrivalPressureAvg" REAL NOT NULL,
  "arrivalEventsAvg" REAL NOT NULL,
  "staleRate" REAL NOT NULL,
  "sampleCount" INTEGER NOT NULL,

  PRIMARY KEY ("transitStopId", "dayType", "hour"),
  CONSTRAINT "TransitStopPattern_transitStopId_fkey"
    FOREIGN KEY ("transitStopId") REFERENCES "TransitStop" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "TransitStopHeatmapCell" (
  "transitStopId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "hour" INTEGER NOT NULL,
  "etaAvg" REAL,
  "arrivalPressureAvg" REAL NOT NULL,
  "arrivalEventsAvg" REAL NOT NULL,
  "staleRate" REAL NOT NULL,
  "sampleCount" INTEGER NOT NULL,

  PRIMARY KEY ("transitStopId", "dayOfWeek", "hour"),
  CONSTRAINT "TransitStopHeatmapCell_transitStopId_fkey"
    FOREIGN KEY ("transitStopId") REFERENCES "TransitStop" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "TransitStopRanking" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "transitStopId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "criticalityScore" REAL NOT NULL,
  "staleRate" REAL NOT NULL,
  "avgEta" REAL,
  "noRealtimeHours" INTEGER NOT NULL,
  "totalHours" INTEGER NOT NULL,
  "windowStart" DATETIME NOT NULL,
  "windowEnd" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "TransitStopRanking_transitStopId_fkey"
    FOREIGN KEY ("transitStopId") REFERENCES "TransitStop" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "TransitStopAlert" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "transitStopId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "alertType" TEXT NOT NULL,
  "severity" INTEGER NOT NULL,
  "metricValue" REAL NOT NULL,
  "windowHours" INTEGER NOT NULL,
  "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "TransitStopAlert_transitStopId_fkey"
    FOREIGN KEY ("transitStopId") REFERENCES "TransitStop" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "HourlyTransitStopStat_provider_bucketStart_idx"
ON "HourlyTransitStopStat"("provider", "bucketStart");

CREATE INDEX "HourlyTransitStopStat_bucketStart_idx"
ON "HourlyTransitStopStat"("bucketStart");

CREATE INDEX "TransitStopPattern_provider_dayType_hour_idx"
ON "TransitStopPattern"("provider", "dayType", "hour");

CREATE INDEX "TransitStopHeatmapCell_provider_dayOfWeek_hour_idx"
ON "TransitStopHeatmapCell"("provider", "dayOfWeek", "hour");

CREATE UNIQUE INDEX "TransitStopRanking_transitStopId_windowStart_windowEnd_key"
ON "TransitStopRanking"("transitStopId", "windowStart", "windowEnd");

CREATE INDEX "TransitStopRanking_provider_windowEnd_idx"
ON "TransitStopRanking"("provider", "windowEnd");

CREATE UNIQUE INDEX "TransitStopAlert_transitStopId_alertType_windowHours_generatedAt_key"
ON "TransitStopAlert"("transitStopId", "alertType", "windowHours", "generatedAt");

CREATE INDEX "TransitStopAlert_provider_generatedAt_idx"
ON "TransitStopAlert"("provider", "generatedAt");
