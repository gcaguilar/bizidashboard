-- Cache durable del informe mensual (L2 tras Redis). Un mes cerrado es
-- inmutable: se guarda el payload ya ensamblado y se evita reagregar la
-- historia cruda cada vez que Redis se vacia.
CREATE TABLE "MonthlyReportSnapshot" (
    "monthKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "schemaVersion" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyReportSnapshot_pkey" PRIMARY KEY ("monthKey")
);

-- Episodios criticos exactos al minuto. La duracion se calcula con los
-- timestamps reales de StationStatus; la tabla solo evita repetir el escaneo
-- de millones de filas en cada lectura del informe.
CREATE TABLE "StationCriticalEpisode" (
    "id" BIGSERIAL NOT NULL,
    "stationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" DOUBLE PRECISION NOT NULL,
    "monthKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationCriticalEpisode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StationCriticalEpisode_stationId_kind_startedAt_key"
    ON "StationCriticalEpisode"("stationId", "kind", "startedAt");
CREATE INDEX "StationCriticalEpisode_monthKey_stationId_idx"
    ON "StationCriticalEpisode"("monthKey", "stationId");
CREATE INDEX "StationCriticalEpisode_monthKey_kind_durationMinutes_idx"
    ON "StationCriticalEpisode"("monthKey", "kind", "durationMinutes");
CREATE INDEX "StationCriticalEpisode_startedAt_idx"
    ON "StationCriticalEpisode"("startedAt");

ALTER TABLE "StationCriticalEpisode"
    ADD CONSTRAINT "StationCriticalEpisode_stationId_fkey"
    FOREIGN KEY ("stationId") REFERENCES "Station"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
