import { prisma } from '@/lib/db';

export async function getWatermark(name: string, defaultDate: Date): Promise<Date> {
  const record = await prisma.analyticsWatermark.findUnique({
    where: { name },
  });

  if (record?.lastAggregatedAt) {
    return record.lastAggregatedAt;
  }

  if (!record) {
    await prisma.analyticsWatermark.create({
      data: {
        name,
        lastAggregatedAt: defaultDate,
      },
    });
  } else {
    await prisma.analyticsWatermark.update({
      where: { name },
      data: { lastAggregatedAt: defaultDate },
    });
  }

  return defaultDate;
}

export async function setWatermark(name: string, date: Date): Promise<void> {
  await prisma.analyticsWatermark.upsert({
    where: { name },
    create: {
      name,
      lastAggregatedAt: date,
    },
    update: {
      lastAggregatedAt: date,
    },
  });
}
