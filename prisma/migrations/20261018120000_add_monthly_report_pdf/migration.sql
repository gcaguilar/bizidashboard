-- PDF publico del informe mensual, generado una vez al sellar el mes.

CREATE TABLE "MonthlyReportPdf" (
    "monthKey" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyReportPdf_pkey" PRIMARY KEY ("monthKey")
);
