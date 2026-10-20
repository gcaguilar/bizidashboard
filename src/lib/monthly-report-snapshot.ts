/**
 * Persistencia del informe mensual ya ensamblado.
 *
 * Redis es la cache L1, pero un mes cerrado no puede depender de que Redis
 * conserve la entrada: si se reinicia o se vacia, reconstruir el informe vuelve
 * a escanear millones de snapshots. Postgres guarda el mismo payload como
 * cache L2 y se lee antes de ensamblar.
 *
 * El payload es JSON puro (sin Date ni BigInt), asi que se puede guardar y
 * recuperar tal cual. `schemaVersion` invalida snapshots de una forma anterior.
 */

import { Prisma } from '@/generated/prisma/client';
import type { PrismaClient } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import type { MonthlyReport } from '@/lib/monthly-report-types';
import { MONTHLY_REPORT_SCHEMA_VERSION } from '@/lib/monthly-report-version';

export async function readMonthlyReportSnapshot(
  monthKey: string,
  client: PrismaClient = prisma
): Promise<MonthlyReport | null> {
  const row = await client.monthlyReportSnapshot.findUnique({
    where: { monthKey },
    select: { payload: true, schemaVersion: true },
  });

  if (!row || row.schemaVersion !== MONTHLY_REPORT_SCHEMA_VERSION) {
    return null;
  }

  return row.payload as unknown as MonthlyReport;
}

export async function writeMonthlyReportSnapshot(
  monthKey: string,
  report: MonthlyReport,
  client: PrismaClient = prisma
): Promise<void> {
  const generatedAt = new Date(report.generatedAt);
  const payload = report as unknown as Prisma.InputJsonValue;

  await client.monthlyReportSnapshot.upsert({
    where: { monthKey },
    create: {
      monthKey,
      payload,
      schemaVersion: MONTHLY_REPORT_SCHEMA_VERSION,
      generatedAt,
    },
    update: {
      payload,
      schemaVersion: MONTHLY_REPORT_SCHEMA_VERSION,
      generatedAt,
    },
  });
}

export async function deleteMonthlyReportSnapshot(
  monthKey: string,
  client: PrismaClient = prisma
): Promise<void> {
  await client.monthlyReportSnapshot.deleteMany({
    where: { monthKey },
  });
}
