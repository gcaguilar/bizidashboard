import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import { ALERT_THRESHOLDS, ANALYTICS_WINDOWS, AlertType } from '@/analytics/types';
import type { RollupResult } from '@/analytics/types';
import { getWatermark, setWatermark } from '@/analytics/watermarks';
import { chunkRowsForBulkQuery } from '@/analytics/queries/bulk-upsert';

interface AlertMetricAccumulator {
  bikesSum: number;
  anchorsSum: number;
  sampleCount: number;
}

interface AlertRow {
  stationId: string;
  alertType: AlertType;
  severity: number;
  metricValue: number;
  windowHours: number;
  generatedAt: Date;
  isActive: boolean;
}

const ALERT_WATERMARK = 'alert-rollup';

const DEACTIVATE_BATCH_SIZE = 50;

export async function deactivateActiveAlerts(): Promise<void> {
  let updated: number;
  do {
    const result = await prisma.$executeRaw`
      UPDATE "StationAlert" SET "isActive" = false
      WHERE "id" IN (
        SELECT "id" FROM "StationAlert"
        WHERE "isActive" = true
        LIMIT ${DEACTIVATE_BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      )
    `;
    updated = Number(result);
  } while (updated >= DEACTIVATE_BATCH_SIZE);
}

export async function runAlertRollup(cutoff: Date): Promise<RollupResult> {
  const windowEnd = cutoff;
  const windowStart = new Date(
    windowEnd.getTime() - ANALYTICS_WINDOWS.alertWindowHours * 60 * 60 * 1000
  );
  const watermark = await getWatermark(ALERT_WATERMARK, new Date(0));

  if (windowEnd <= watermark) {
    return {
      processedCount: 0,
      upsertedCount: 0,
      watermark,
      cutoff,
    };
  }

  const hourlyStats = await prisma.$queryRaw<
    {
      stationId: string;
      bikesAvg: number;
      anchorsAvg: number;
      sampleCount: number;
    }[]
  >`SELECT "stationId", "bikesAvg", "anchorsAvg", "sampleCount" FROM "HourlyStationStat" WHERE "bucketStart" > ${windowStart} AND "bucketStart" <= ${windowEnd};`;

  const aggregates = new Map<string, AlertMetricAccumulator>();

  for (const stat of hourlyStats) {
    const existing = aggregates.get(stat.stationId);
    const weight = Number(stat.sampleCount) || 0;

    if (existing) {
      existing.bikesSum += Number(stat.bikesAvg) * weight;
      existing.anchorsSum += Number(stat.anchorsAvg) * weight;
      existing.sampleCount += weight;
    } else {
      aggregates.set(stat.stationId, {
        bikesSum: Number(stat.bikesAvg) * weight,
        anchorsSum: Number(stat.anchorsAvg) * weight,
        sampleCount: weight,
      });
    }
  }

  const alerts: AlertRow[] = [];

  for (const [stationId, aggregate] of aggregates.entries()) {
    if (aggregate.sampleCount <= 0) {
      continue;
    }

    const avgBikes = aggregate.bikesSum / aggregate.sampleCount;
    const avgAnchors = aggregate.anchorsSum / aggregate.sampleCount;

    if (avgBikes < ALERT_THRESHOLDS.lowBikes) {
      alerts.push({
        stationId,
        alertType: AlertType.LOW_BIKES,
        severity: avgBikes < 2 ? 2 : 1,
        metricValue: avgBikes,
        windowHours: ANALYTICS_WINDOWS.alertWindowHours,
        generatedAt: windowEnd,
        isActive: true,
      });
    }

    if (avgAnchors < ALERT_THRESHOLDS.lowAnchors) {
      alerts.push({
        stationId,
        alertType: AlertType.LOW_ANCHORS,
        severity: avgAnchors < 2 ? 2 : 1,
        metricValue: avgAnchors,
        windowHours: ANALYTICS_WINDOWS.alertWindowHours,
        generatedAt: windowEnd,
        isActive: true,
      });
    }
  }

  // First upsert new alerts
  if (alerts.length > 0) {
    for (const chunk of chunkRowsForBulkQuery(alerts, 7)) {
      const values = chunk.map((alert) =>
        Prisma.sql`(${alert.stationId}, ${alert.alertType}, ${alert.severity}, ${alert.metricValue}, ${alert.windowHours}, ${alert.generatedAt}, ${alert.isActive})`
      );

      await prisma.$executeRaw`
        INSERT INTO "StationAlert" (
          "stationId",
          "alertType",
          severity,
          "metricValue",
          "windowHours",
          "generatedAt",
          "isActive"
        )
        VALUES ${Prisma.join(values)}
        ON CONFLICT("stationId", "alertType", "windowHours", "generatedAt") DO UPDATE SET
          severity = excluded.severity,
          "metricValue" = excluded."metricValue",
          "isActive" = excluded."isActive";
      `;
    }
  }

  // Then deactivate only for stations that no longer meet criteria
  if (aggregates.size === 0) {
    await deactivateActiveAlerts();
  } else {
    const stationIdsWithIssues = new Set(alerts.map((a) => a.stationId));
    const resolvedStations = Array.from(aggregates.keys()).filter(
      (id: string) => !stationIdsWithIssues.has(id)
    );
    if (resolvedStations.length > 0) {
      await prisma.$executeRaw`UPDATE "StationAlert" SET "isActive" = false WHERE "isActive" = true AND "stationId" IN (${Prisma.join(resolvedStations)});`;
    }
  }

  await setWatermark(ALERT_WATERMARK, windowEnd);

  return {
    processedCount: hourlyStats.length,
    upsertedCount: alerts.length,
    watermark: windowEnd,
    cutoff,
  };
}
