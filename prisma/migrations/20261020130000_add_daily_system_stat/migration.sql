-- Serie diaria de red precalculada para /api/history. Sustituye los escaneos
-- completos de StationStatus por una lectura de una fila por dia. El dia en
-- curso se sigue calculando en vivo desde los snapshots crudos.
CREATE TABLE "DailySystemStat" (
    "day" DATE NOT NULL,
    "demandScore" INTEGER NOT NULL,
    "avgOccupancy" DOUBLE PRECISION NOT NULL,
    "balanceIndex" DOUBLE PRECISION NOT NULL,
    "sampleCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySystemStat_pkey" PRIMARY KEY ("day")
);
