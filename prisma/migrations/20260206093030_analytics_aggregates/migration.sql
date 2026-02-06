-- CreateTable
CREATE TABLE "HourlyStationStat" (
    "stationId" TEXT NOT NULL,
    "bucketStart" DATETIME NOT NULL,
    "bikesMin" INTEGER NOT NULL,
    "bikesMax" INTEGER NOT NULL,
    "bikesAvg" REAL NOT NULL,
    "anchorsMin" INTEGER NOT NULL,
    "anchorsMax" INTEGER NOT NULL,
    "anchorsAvg" REAL NOT NULL,
    "occupancyAvg" REAL NOT NULL,
    "sampleCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("stationId", "bucketStart"),
    CONSTRAINT "HourlyStationStat_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyStationStat" (
    "stationId" TEXT NOT NULL,
    "bucketDate" DATETIME NOT NULL,
    "bikesMin" INTEGER NOT NULL,
    "bikesMax" INTEGER NOT NULL,
    "bikesAvg" REAL NOT NULL,
    "anchorsMin" INTEGER NOT NULL,
    "anchorsMax" INTEGER NOT NULL,
    "anchorsAvg" REAL NOT NULL,
    "occupancyAvg" REAL NOT NULL,
    "sampleCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("stationId", "bucketDate"),
    CONSTRAINT "DailyStationStat_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StationRanking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stationId" TEXT NOT NULL,
    "turnoverScore" REAL NOT NULL,
    "emptyHours" INTEGER NOT NULL,
    "fullHours" INTEGER NOT NULL,
    "totalHours" INTEGER NOT NULL,
    "windowStart" DATETIME NOT NULL,
    "windowEnd" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StationRanking_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StationPattern" (
    "stationId" TEXT NOT NULL,
    "dayType" TEXT NOT NULL,
    "hour" INTEGER NOT NULL,
    "bikesAvg" REAL NOT NULL,
    "anchorsAvg" REAL NOT NULL,
    "occupancyAvg" REAL NOT NULL,
    "sampleCount" INTEGER NOT NULL,

    PRIMARY KEY ("stationId", "dayType", "hour"),
    CONSTRAINT "StationPattern_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StationHeatmapCell" (
    "stationId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "hour" INTEGER NOT NULL,
    "bikesAvg" REAL NOT NULL,
    "anchorsAvg" REAL NOT NULL,
    "occupancyAvg" REAL NOT NULL,
    "sampleCount" INTEGER NOT NULL,

    PRIMARY KEY ("stationId", "dayOfWeek", "hour"),
    CONSTRAINT "StationHeatmapCell_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StationAlert" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stationId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "metricValue" REAL NOT NULL,
    "windowHours" INTEGER NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "StationAlert_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnalyticsWatermark" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "lastAggregatedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JobLock" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "lockedAt" DATETIME,
    "lockExpiresAt" DATETIME,
    "lockedBy" TEXT
);

-- CreateIndex
CREATE INDEX "HourlyStationStat_bucketStart_idx" ON "HourlyStationStat"("bucketStart");

-- CreateIndex
CREATE INDEX "DailyStationStat_bucketDate_idx" ON "DailyStationStat"("bucketDate");

-- CreateIndex
CREATE INDEX "StationRanking_stationId_idx" ON "StationRanking"("stationId");

-- CreateIndex
CREATE INDEX "StationAlert_generatedAt_idx" ON "StationAlert"("generatedAt");
