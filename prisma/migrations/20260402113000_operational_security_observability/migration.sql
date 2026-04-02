CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "Install"
ADD COLUMN "publicKeyFingerprint" TEXT,
ADD COLUMN "refreshTokenHash" TEXT,
ADD COLUMN "refreshTokenIssuedAt" TIMESTAMP(3),
ADD COLUMN "lastSeenAt" TIMESTAMP(3),
ADD COLUMN "lastAuthAt" TIMESTAMP(3),
ADD COLUMN "revokedAt" TIMESTAMP(3);

UPDATE "Install"
SET
  "publicKeyFingerprint" = encode(digest("publicKey", 'sha256'), 'hex'),
  "refreshTokenHash" = encode(digest("refreshToken", 'sha256'), 'hex'),
  "refreshTokenIssuedAt" = COALESCE("updatedAt", "createdAt"),
  "lastSeenAt" = COALESCE("updatedAt", "createdAt"),
  "lastAuthAt" = COALESCE("updatedAt", "createdAt")
WHERE "publicKeyFingerprint" IS NULL
   OR "refreshTokenHash" IS NULL
   OR "refreshTokenIssuedAt" IS NULL;

ALTER TABLE "Install"
ALTER COLUMN "publicKeyFingerprint" SET NOT NULL,
ALTER COLUMN "refreshTokenHash" SET NOT NULL,
ALTER COLUMN "refreshTokenIssuedAt" SET NOT NULL;

DROP INDEX IF EXISTS "Install_refreshToken_key";

ALTER TABLE "Install"
DROP COLUMN "refreshToken";

CREATE UNIQUE INDEX "Install_refreshTokenHash_key" ON "Install"("refreshTokenHash");
CREATE INDEX "Install_publicKeyFingerprint_idx" ON "Install"("publicKeyFingerprint");
CREATE INDEX "Install_revokedAt_idx" ON "Install"("revokedAt");

CREATE TABLE "CollectionRun" (
  "id" TEXT NOT NULL,
  "collectionId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "trigger" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "gbfsVersion" TEXT,
  "snapshotRecordedAt" TIMESTAMP(3),
  "expectedStationCount" INTEGER,
  "insertedCount" INTEGER NOT NULL DEFAULT 0,
  "duplicateCount" INTEGER NOT NULL DEFAULT 0,
  "warningCount" INTEGER NOT NULL DEFAULT 0,
  "errorCount" INTEGER NOT NULL DEFAULT 0,
  "warnings" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "errors" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "durationMs" INTEGER,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CollectionRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CollectionRun_collectionId_key" ON "CollectionRun"("collectionId");
CREATE INDEX "CollectionRun_startedAt_idx" ON "CollectionRun"("startedAt");
CREATE INDEX "CollectionRun_status_startedAt_idx" ON "CollectionRun"("status", "startedAt");
CREATE INDEX "CollectionRun_city_startedAt_idx" ON "CollectionRun"("city", "startedAt");

CREATE TABLE "SecurityEvent" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "installId" TEXT,
  "collectionId" TEXT,
  "ipHash" TEXT,
  "userAgentHash" TEXT,
  "outcome" TEXT NOT NULL,
  "reasonCode" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SecurityEvent_createdAt_idx" ON "SecurityEvent"("createdAt");
CREATE INDEX "SecurityEvent_eventType_createdAt_idx" ON "SecurityEvent"("eventType", "createdAt");
CREATE INDEX "SecurityEvent_route_createdAt_idx" ON "SecurityEvent"("route", "createdAt");
CREATE INDEX "SecurityEvent_installId_createdAt_idx" ON "SecurityEvent"("installId", "createdAt");
