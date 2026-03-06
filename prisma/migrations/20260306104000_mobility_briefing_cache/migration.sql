CREATE TABLE "MobilityBriefingCache" (
  "dateKey" TEXT NOT NULL PRIMARY KEY,
  "payload" TEXT NOT NULL,
  "sourceLastDay" DATETIME,
  "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "MobilityBriefingCache_generatedAt_idx"
ON "MobilityBriefingCache"("generatedAt");
