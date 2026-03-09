CREATE TABLE "TransitStop" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "provider" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "lat" REAL NOT NULL,
  "lon" REAL NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "StationTransitLink" (
  "stationId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "transitStopId" TEXT NOT NULL,
  "distanceMeters" REAL NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,

  PRIMARY KEY ("stationId", "provider"),
  CONSTRAINT "StationTransitLink_stationId_fkey"
    FOREIGN KEY ("stationId") REFERENCES "Station" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "StationTransitLink_transitStopId_fkey"
    FOREIGN KEY ("transitStopId") REFERENCES "TransitStop" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "TransitSnapshot" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "provider" TEXT NOT NULL,
  "transitStopId" TEXT NOT NULL,
  "observedAt" DATETIME NOT NULL,
  "sourceUpdatedAt" DATETIME,
  "etaMinutes" INTEGER,
  "arrivalPressure" REAL NOT NULL,
  "arrivalEvents" INTEGER NOT NULL,
  "isStale" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TransitSnapshot_transitStopId_fkey"
    FOREIGN KEY ("transitStopId") REFERENCES "TransitStop" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TransitStop_provider_externalId_key"
ON "TransitStop"("provider", "externalId");

CREATE INDEX "TransitStop_provider_isActive_idx"
ON "TransitStop"("provider", "isActive");

CREATE INDEX "TransitStop_lat_lon_idx"
ON "TransitStop"("lat", "lon");

CREATE INDEX "StationTransitLink_provider_transitStopId_idx"
ON "StationTransitLink"("provider", "transitStopId");

CREATE INDEX "TransitSnapshot_provider_observedAt_idx"
ON "TransitSnapshot"("provider", "observedAt");

CREATE INDEX "TransitSnapshot_transitStopId_observedAt_idx"
ON "TransitSnapshot"("transitStopId", "observedAt");

CREATE INDEX "TransitSnapshot_isStale_observedAt_idx"
ON "TransitSnapshot"("isStale", "observedAt");
