-- CreateEnum
CREATE TYPE "DayType" AS ENUM ('WEEKDAY', 'WEEKEND');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('LOW_BIKES', 'LOW_ANCHORS');

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "capacity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationStatus" (
    "id" SERIAL NOT NULL,
    "stationId" TEXT NOT NULL,
    "bikesAvailable" INTEGER NOT NULL,
    "anchorsFree" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StationStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HourlyStationStat" (
    "stationId" TEXT NOT NULL,
    "bucketStart" TIMESTAMP(3) NOT NULL,
    "bikesMin" INTEGER NOT NULL,
    "bikesMax" INTEGER NOT NULL,
    "bikesAvg" DOUBLE PRECISION NOT NULL,
    "anchorsMin" INTEGER NOT NULL,
    "anchorsMax" INTEGER NOT NULL,
    "anchorsAvg" DOUBLE PRECISION NOT NULL,
    "occupancyAvg" DOUBLE PRECISION NOT NULL,
    "sampleCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HourlyStationStat_pkey" PRIMARY KEY ("stationId","bucketStart")
);

-- CreateTable
CREATE TABLE "DailyStationStat" (
    "stationId" TEXT NOT NULL,
    "bucketDate" TIMESTAMP(3) NOT NULL,
    "bikesMin" INTEGER NOT NULL,
    "bikesMax" INTEGER NOT NULL,
    "bikesAvg" DOUBLE PRECISION NOT NULL,
    "anchorsMin" INTEGER NOT NULL,
    "anchorsMax" INTEGER NOT NULL,
    "anchorsAvg" DOUBLE PRECISION NOT NULL,
    "occupancyAvg" DOUBLE PRECISION NOT NULL,
    "sampleCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyStationStat_pkey" PRIMARY KEY ("stationId","bucketDate")
);

-- CreateTable
CREATE TABLE "StationRanking" (
    "id" SERIAL NOT NULL,
    "stationId" TEXT NOT NULL,
    "turnoverScore" DOUBLE PRECISION NOT NULL,
    "emptyHours" INTEGER NOT NULL,
    "fullHours" INTEGER NOT NULL,
    "totalHours" INTEGER NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationRanking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationPattern" (
    "stationId" TEXT NOT NULL,
    "dayType" "DayType" NOT NULL,
    "hour" INTEGER NOT NULL,
    "bikesAvg" DOUBLE PRECISION NOT NULL,
    "anchorsAvg" DOUBLE PRECISION NOT NULL,
    "occupancyAvg" DOUBLE PRECISION NOT NULL,
    "sampleCount" INTEGER NOT NULL,

    CONSTRAINT "StationPattern_pkey" PRIMARY KEY ("stationId","dayType","hour")
);

-- CreateTable
CREATE TABLE "StationHeatmapCell" (
    "stationId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "hour" INTEGER NOT NULL,
    "bikesAvg" DOUBLE PRECISION NOT NULL,
    "anchorsAvg" DOUBLE PRECISION NOT NULL,
    "occupancyAvg" DOUBLE PRECISION NOT NULL,
    "sampleCount" INTEGER NOT NULL,

    CONSTRAINT "StationHeatmapCell_pkey" PRIMARY KEY ("stationId","dayOfWeek","hour")
);

-- CreateTable
CREATE TABLE "StationAlert" (
    "id" SERIAL NOT NULL,
    "stationId" TEXT NOT NULL,
    "alertType" "AlertType" NOT NULL,
    "severity" INTEGER NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "windowHours" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "StationAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsWatermark" (
    "name" TEXT NOT NULL,
    "lastAggregatedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsWatermark_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "MobilityBriefingCache" (
    "dateKey" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "sourceLastDay" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobilityBriefingCache_pkey" PRIMARY KEY ("dateKey")
);

-- CreateTable
CREATE TABLE "JobLock" (
    "name" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3),
    "lockExpiresAt" TIMESTAMP(3),
    "lockedBy" TEXT,

    CONSTRAINT "JobLock_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "Install" (
    "id" TEXT NOT NULL,
    "installId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "appVersion" TEXT NOT NULL,
    "osVersion" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Install_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Station_isActive_idx" ON "Station"("isActive");

-- CreateIndex
CREATE INDEX "Station_lat_lon_idx" ON "Station"("lat", "lon");

-- CreateIndex
CREATE INDEX "StationStatus_stationId_recordedAt_idx" ON "StationStatus"("stationId", "recordedAt");

-- CreateIndex
CREATE INDEX "StationStatus_recordedAt_idx" ON "StationStatus"("recordedAt");

-- CreateIndex
CREATE INDEX "HourlyStationStat_bucketStart_idx" ON "HourlyStationStat"("bucketStart");

-- CreateIndex
CREATE INDEX "DailyStationStat_bucketDate_idx" ON "DailyStationStat"("bucketDate");

-- CreateIndex
CREATE INDEX "StationRanking_stationId_idx" ON "StationRanking"("stationId");

-- CreateIndex
CREATE UNIQUE INDEX "StationRanking_stationId_windowStart_windowEnd_key" ON "StationRanking"("stationId", "windowStart", "windowEnd");

-- CreateIndex
CREATE INDEX "StationAlert_generatedAt_idx" ON "StationAlert"("generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StationAlert_stationId_alertType_windowHours_generatedAt_key" ON "StationAlert"("stationId", "alertType", "windowHours", "generatedAt");

-- CreateIndex
CREATE INDEX "MobilityBriefingCache_generatedAt_idx" ON "MobilityBriefingCache"("generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Install_installId_key" ON "Install"("installId");

-- CreateIndex
CREATE UNIQUE INDEX "Install_refreshToken_key" ON "Install"("refreshToken");

-- AddForeignKey
ALTER TABLE "StationStatus" ADD CONSTRAINT "StationStatus_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HourlyStationStat" ADD CONSTRAINT "HourlyStationStat_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyStationStat" ADD CONSTRAINT "DailyStationStat_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationRanking" ADD CONSTRAINT "StationRanking_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationPattern" ADD CONSTRAINT "StationPattern_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationHeatmapCell" ADD CONSTRAINT "StationHeatmapCell_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationAlert" ADD CONSTRAINT "StationAlert_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
