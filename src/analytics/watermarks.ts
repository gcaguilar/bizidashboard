import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';

type WatermarkRow = {
  name: string;
  lastAggregatedAt: string | Date | null;
};

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Lee un watermark sin crearlo si no existe. Necesario para saber si un
 * artefacto precalculado esta disponible: `getWatermark` insertaria el valor
 * por defecto y marcaria como calculado algo que nunca se calculo.
 */
export async function findWatermark(name: string): Promise<Date | null> {
  try {
    const rows = await prisma.$queryRaw<WatermarkRow[]>`
      SELECT name, "lastAggregatedAt"
      FROM "AnalyticsWatermark"
      WHERE name = ${name}
      LIMIT 1;
    `;

    return toDate(rows[0]?.lastAggregatedAt);
  } catch (error) {
    captureExceptionWithContext(error, {
      area: 'watermarks',
      operation: 'findWatermark',
      extra: { watermarkName: name },
    });
    logger.error('watermarks.find_failed', { error, watermarkName: name });
    return null;
  }
}

export async function getWatermark(name: string, defaultDate: Date): Promise<Date> {
  try {
    const rows = await prisma.$queryRaw<WatermarkRow[]>`
      SELECT name, "lastAggregatedAt"
      FROM "AnalyticsWatermark"
      WHERE name = ${name}
      LIMIT 1;
    `;

    const record = rows[0] ?? null;
    const storedDate = toDate(record?.lastAggregatedAt);

    if (storedDate) {
      return storedDate;
    }

    await setWatermark(name, defaultDate);
    return defaultDate;
  } catch (error) {
    captureExceptionWithContext(error, { area: 'watermarks', operation: 'getWatermark', extra: { watermarkName: name } });
    logger.error('watermarks.get_failed', { error, watermarkName: name });
    return defaultDate;
  }
}

export async function setWatermark(name: string, date: Date): Promise<void> {
  try {
    await prisma.$executeRaw`
      INSERT INTO "AnalyticsWatermark" (name, "lastAggregatedAt", "updatedAt")
      VALUES (${name}, ${date}, CURRENT_TIMESTAMP)
      ON CONFLICT(name) DO UPDATE SET
        "lastAggregatedAt" = excluded."lastAggregatedAt",
        "updatedAt" = CURRENT_TIMESTAMP;
    `;
  } catch (error) {
    captureExceptionWithContext(error, { area: 'watermarks', operation: 'setWatermark', extra: { watermarkName: name } });
    logger.error('watermarks.set_failed', { error, watermarkName: name });
  }
}
