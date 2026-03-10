import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { forEachSqliteBatch } from '@/analytics/sqlite';
import { getWatermark, setWatermark } from '@/analytics/watermarks';

export interface RollupResult {
  processedCount: number;
  upsertedCount: number;
  watermark: Date;
  cutoff: Date;
}

const ALERT_WINDOW_HOURS = 3;
const TRANSIT_ALERT_WATERMARK = 'transit-alert-rollup';

type AlertRow = {
  transitStopId: string;
  provider: string;
  alertType: string;
  severity: number;
  metricValue: number;
  windowHours: number;
  generatedAt: Date;
  isActive: boolean;
};

export async function deactivateActiveTransitAlerts(): Promise<void> {
  await prisma.$executeRaw`UPDATE TransitStopAlert SET isActive = false WHERE isActive = true;`;
}

export async function runTransitAlertRollup(cutoff: Date): Promise<RollupResult> {
  const windowEnd = cutoff;
  const windowStart = new Date(windowEnd.getTime() - ALERT_WINDOW_HOURS * 60 * 60 * 1000);
  const watermark = await getWatermark(TRANSIT_ALERT_WATERMARK, new Date(0));

  if (windowEnd <= watermark) {
    return { processedCount: 0, upsertedCount: 0, watermark, cutoff };
  }

  const hourlyStats = await prisma.$queryRaw<
    {
      transitStopId: string;
      provider: string;
      etaAvg: number | null;
      staleSampleCount: number;
      sampleCount: number;
      realtimeSampleCount: number;
    }[]
  >`SELECT transitStopId, provider, etaAvg, staleSampleCount, sampleCount, realtimeSampleCount FROM HourlyTransitStopStat WHERE datetime(bucketStart) > datetime(${windowStart}) AND datetime(bucketStart) <= datetime(${windowEnd});`;

  const grouped = new Map<string, {
    transitStopId: string;
    provider: string;
    staleSum: number;
    sampleSum: number;
    realtimeHours: number;
    totalHours: number;
    etaSum: number;
    etaSamples: number;
  }>();

  for (const row of hourlyStats) {
    const key = row.transitStopId;
    const current = grouped.get(key) ?? {
      transitStopId: row.transitStopId,
      provider: row.provider,
      staleSum: 0,
      sampleSum: 0,
      realtimeHours: 0,
      totalHours: 0,
      etaSum: 0,
      etaSamples: 0,
    };

    current.staleSum += row.staleSampleCount;
    current.sampleSum += row.sampleCount;
    current.realtimeHours += row.realtimeSampleCount > 0 ? 1 : 0;
    current.totalHours += 1;

    if (row.etaAvg !== null) {
      current.etaSum += row.etaAvg;
      current.etaSamples += 1;
    }

    grouped.set(key, current);
  }

  const alerts: AlertRow[] = [];

  for (const entry of grouped.values()) {
    const staleRate = entry.sampleSum > 0 ? entry.staleSum / entry.sampleSum : 0;
    const realtimeCoverage = entry.totalHours > 0 ? entry.realtimeHours / entry.totalHours : 0;
    const avgEta = entry.etaSamples > 0 ? entry.etaSum / entry.etaSamples : null;

    if (staleRate >= 0.5) {
      alerts.push({
        transitStopId: entry.transitStopId,
        provider: entry.provider,
        alertType: 'STALE_DATA',
        severity: staleRate >= 0.75 ? 2 : 1,
        metricValue: staleRate,
        windowHours: ALERT_WINDOW_HOURS,
        generatedAt: windowEnd,
        isActive: true,
      });
    }

    if (realtimeCoverage <= 0.34) {
      alerts.push({
        transitStopId: entry.transitStopId,
        provider: entry.provider,
        alertType: 'NO_REALTIME',
        severity: realtimeCoverage <= 0.1 ? 2 : 1,
        metricValue: realtimeCoverage,
        windowHours: ALERT_WINDOW_HOURS,
        generatedAt: windowEnd,
        isActive: true,
      });
    }

    if (avgEta !== null && avgEta >= 12) {
      alerts.push({
        transitStopId: entry.transitStopId,
        provider: entry.provider,
        alertType: 'SLOW_SERVICE',
        severity: avgEta >= 18 ? 2 : 1,
        metricValue: avgEta,
        windowHours: ALERT_WINDOW_HOURS,
        generatedAt: windowEnd,
        isActive: true,
      });
    }
  }

  if (alerts.length > 0) {
    await forEachSqliteBatch(alerts, 7, async (alertChunk) => {
      const values = alertChunk.map((alert) =>
        Prisma.sql`(${alert.transitStopId}, ${alert.provider}, ${alert.alertType}, ${alert.severity}, ${alert.metricValue}, ${alert.windowHours}, ${alert.generatedAt}, ${alert.isActive})`
      );

      await prisma.$executeRaw`
        INSERT INTO TransitStopAlert (
          transitStopId,
          provider,
          alertType,
          severity,
          metricValue,
          windowHours,
          generatedAt,
          isActive
        )
        VALUES ${Prisma.join(values)}
        ON CONFLICT(transitStopId, alertType, windowHours, generatedAt) DO UPDATE SET
          provider = excluded.provider,
          severity = excluded.severity,
          metricValue = excluded.metricValue,
          isActive = excluded.isActive;
      `;
    });

    await setWatermark(TRANSIT_ALERT_WATERMARK, windowEnd);
  }

  return {
    processedCount: hourlyStats.length,
    upsertedCount: alerts.length,
    watermark: alerts.length > 0 ? windowEnd : watermark,
    cutoff,
  };
}
