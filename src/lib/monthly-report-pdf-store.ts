/**
 * Persistencia del PDF publico del informe mensual.
 *
 * El PDF se genera una sola vez al sellar el mes y se guarda en la base de
 * datos municipal (una fila por mes). La API lo sirve tal cual: los lectores no
 * vuelven a renderizar la pagina ni generan el documento.
 */

import { prisma } from '@/lib/db';
import type { PrismaClient } from '@/generated/prisma/client';

export async function getStoredMonthlyReportPdf(
  monthKey: string,
  client: PrismaClient = prisma
): Promise<Uint8Array | null> {
  const row = await client.monthlyReportPdf.findUnique({
    where: { monthKey },
    select: { bytes: true },
  });

  return row?.bytes ?? null;
}

export async function hasStoredMonthlyReportPdf(
  monthKey: string,
  client: PrismaClient = prisma
): Promise<boolean> {
  const row = await client.monthlyReportPdf.findUnique({
    where: { monthKey },
    select: { monthKey: true },
  });

  return row !== null;
}

export async function storeMonthlyReportPdf(
  monthKey: string,
  bytes: Uint8Array,
  client: PrismaClient = prisma
): Promise<void> {
  const payload = Buffer.from(bytes);

  await client.monthlyReportPdf.upsert({
    where: { monthKey },
    create: { monthKey, bytes: payload, byteSize: payload.byteLength },
    update: { bytes: payload, byteSize: payload.byteLength },
  });
}

export async function deleteStoredMonthlyReportPdf(
  monthKey: string,
  client: PrismaClient = prisma
): Promise<void> {
  await client.monthlyReportPdf.deleteMany({ where: { monthKey } });
}
