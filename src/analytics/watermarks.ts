import { prisma } from '@/lib/db';

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

export async function getWatermark(name: string, defaultDate: Date): Promise<Date> {
  const rows = await prisma.$queryRaw<WatermarkRow[]>`
    SELECT name, lastAggregatedAt
    FROM AnalyticsWatermark
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
}

export async function setWatermark(name: string, date: Date): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO AnalyticsWatermark (name, lastAggregatedAt, updatedAt)
    VALUES (${name}, ${date}, CURRENT_TIMESTAMP)
    ON CONFLICT(name) DO UPDATE SET
      lastAggregatedAt = excluded.lastAggregatedAt,
      updatedAt = CURRENT_TIMESTAMP;
  `;
}
