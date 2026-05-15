-- AlterTable
ALTER TABLE "CollectionRun" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "description" TEXT,
    "ownerEmail" TEXT,
    "customRateLimit" INTEGER,
    "customRateWindow" INTEGER,
    "lastUsedAt" TIMESTAMP(3),
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_isActive_revokedAt_idx" ON "ApiKey"("isActive", "revokedAt");

-- CreateIndex
CREATE INDEX "ApiKey_keyPrefix_idx" ON "ApiKey"("keyPrefix");

-- CreateIndex
CREATE INDEX "ApiKey_createdAt_idx" ON "ApiKey"("createdAt");

-- CreateIndex
CREATE INDEX "HourlyStationStat_bucketStart_stationId_idx" ON "HourlyStationStat"("bucketStart", "stationId");

-- CreateIndex
CREATE INDEX "StationAlert_isActive_generatedAt_idx" ON "StationAlert"("isActive", "generatedAt");

-- CreateIndex
CREATE INDEX "StationRanking_windowEnd_stationId_idx" ON "StationRanking"("windowEnd", "stationId");

-- CreateIndex
CREATE INDEX "StationStatus_recordedAt_stationId_bikesAvailable_anchorsFr_idx" ON "StationStatus"("recordedAt", "stationId", "bikesAvailable", "anchorsFree");
