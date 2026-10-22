import { withCache } from '@/lib/cache/cache';
import { CacheTTL } from '@/lib/cache/config';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { NetworkBriefingBaseline } from '@/lib/network-briefing';

const BASELINE_WEEKS = 6;
const HOUR_MS = 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * HOUR_MS;

type BaselineRow = {
  bucketStart: Date;
  stationCount: bigint | number;
  criticalStationsCount: bigint | number;
};

const localPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Madrid',
  weekday: 'short',
  hour: 'numeric',
  hourCycle: 'h23',
});

function localParts(value: Date): { weekday: number; hour: number } {
  const parts = localPartsFormatter.formatToParts(value);
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
    parts.find((part) => part.type === 'weekday')?.value ?? 'Sun',
  );
  return {
    weekday,
    hour: Number(parts.find((part) => part.type === 'hour')?.value ?? -1),
  };
}

export function selectComparableHourlyBaseline(
  rows: BaselineRow[],
  referenceAt: Date,
  currentStationCount: number,
): { baseline: NetworkBriefingBaseline; bucketStart: Date } | null {
  if (currentStationCount <= 0) return null;

  const target = localParts(referenceAt);
  const candidate = rows.find((row) => {
    const parts = localParts(new Date(row.bucketStart));
    return parts.weekday === target.weekday && parts.hour === target.hour &&
      Number(row.stationCount) >= Math.max(1, Math.floor(currentStationCount * 0.8));
  });
  if (!candidate) return null;

  return {
    baseline: {
      criticalStationsCount: Number(candidate.criticalStationsCount),
      activeAlertsCount: null,
      label: 'la misma franja de la semana anterior',
    },
    bucketStart: new Date(candidate.bucketStart),
  };
}

async function fetchHistoricalAlertCount(bucketStart: Date): Promise<number | null> {
  const searchStart = new Date(bucketStart.getTime() - 3 * 60 * 60 * 1000);
  const searchEnd = new Date(bucketStart.getTime() + 3 * 60 * 60 * 1000);

  try {
    const rows = await prisma.$queryRaw<Array<{ alertCount: bigint | number }>>`
      WITH alert_snapshots AS (
        SELECT "generatedAt", COUNT(DISTINCT ("stationId", "alertType")) AS "alertCount"
        FROM "StationAlert"
        WHERE "generatedAt" >= ${searchStart} AND "generatedAt" <= ${searchEnd}
        GROUP BY "generatedAt"
      )
      SELECT "alertCount"
      FROM alert_snapshots
      ORDER BY ABS(EXTRACT(EPOCH FROM ("generatedAt" - ${bucketStart}))) ASC
      LIMIT 1
    `;
    return rows.length > 0 ? Number(rows[0].alertCount) : null;
  } catch (error) {
    logger.warn('network_briefing.alert_baseline_failed', { error });
    return null;
  }
}

/**
 * Inicio de las horas UTC que pueden ser "la misma franja" en cada una de las
 * ultimas seis semanas: la hora de referencia menos k semanas, con +-1 h para
 * cubrir el cambio de horario. `selectComparableHourlyBaseline` comprueba
 * despues el dia y la hora locales, asi que leer de mas no cambia el resultado.
 */
function candidateBucketStarts(referenceAt: Date): Date[] {
  const referenceHour = new Date(referenceAt);
  referenceHour.setUTCMinutes(0, 0, 0);
  const starts: Date[] = [];
  for (let week = 1; week <= BASELINE_WEEKS; week += 1) {
    for (const shiftHours of [-1, 0, 1]) {
      starts.push(new Date(referenceHour.getTime() - week * WEEK_MS + shiftHours * HOUR_MS));
    }
  }
  return starts;
}

/** Lee solo los ~18 buckets candidatos en vez de agrupar seis semanas (~280k filas). */
async function fetchHourlyRows(referenceAt: Date): Promise<BaselineRow[]> {
  const candidates = candidateBucketStarts(referenceAt).map((start) => start.toISOString());
  return prisma.$queryRaw<BaselineRow[]>`
    SELECT "bucketStart",
           COUNT(*) AS "stationCount",
           COUNT(*) FILTER (WHERE "bikesMin" <= 0 OR "anchorsMin" <= 0) AS "criticalStationsCount"
    FROM "HourlyStationStat"
    WHERE "bucketStart" = ANY(${candidates}::timestamp[])
    GROUP BY "bucketStart"
    ORDER BY "bucketStart" DESC
  `;
}

/** Mismas horas candidatas sobre el crudo, como rangos de una hora cada uno. */
async function fetchSnapshotRows(referenceAt: Date): Promise<BaselineRow[]> {
  const ranges = candidateBucketStarts(referenceAt).map(
    (start) => Prisma.sql`("recordedAt" >= ${start} AND "recordedAt" < ${new Date(start.getTime() + HOUR_MS)})`,
  );
  return prisma.$queryRaw<BaselineRow[]>`
    SELECT "recordedAt" AS "bucketStart",
           COUNT(*) AS "stationCount",
           COUNT(*) FILTER (WHERE "bikesAvailable" <= 0 OR "anchorsFree" <= 0) AS "criticalStationsCount"
    FROM "StationStatus"
    WHERE ${Prisma.join(ranges, ' OR ')}
    GROUP BY "recordedAt"
    ORDER BY "recordedAt" DESC
  `;
}

/**
 * Finds a same-weekday, same-local-hour historical reference.
 *
 * Home and dashboard SSR call this on every render; the answer only changes
 * when the reference hour (or the network size) does, so it is cached per
 * UTC hour. Only the candidate buckets are read (see `candidateBucketStarts`).
 */
export async function fetchComparableNetworkBaseline(
  referenceAt: Date,
  currentStationCount: number,
): Promise<NetworkBriefingBaseline | null> {
  if (currentStationCount <= 0 || Number.isNaN(referenceAt.getTime())) return null;

  const referenceHour = new Date(referenceAt);
  referenceHour.setUTCMinutes(0, 0, 0);

  // Se cachea envuelto: `withCache` trata un `null` guardado como fallo de
  // cache, y "no hay franja comparable" (despliegue nuevo, hueco de datos) es
  // justo el caso en que se repetian las dos consultas en cada render. Un
  // error de base de datos no se cachea.
  try {
    const { baseline } = await withCache(
      `network-briefing:baseline:${referenceHour.toISOString()}:${currentStationCount}`,
      CacheTTL.LONG_TERM,
      () => computeComparableNetworkBaseline(referenceAt, currentStationCount),
    );
    return baseline;
  } catch {
    return null;
  }
}

async function computeComparableNetworkBaseline(
  referenceAt: Date,
  currentStationCount: number,
): Promise<{ baseline: NetworkBriefingBaseline | null }> {
  let selection: ReturnType<typeof selectComparableHourlyBaseline> = null;
  let failed = false;
  try {
    selection = selectComparableHourlyBaseline(
      await fetchHourlyRows(referenceAt),
      referenceAt,
      currentStationCount,
    );
  } catch (error) {
    logger.warn('network_briefing.hourly_baseline_failed', { error });
    failed = true;
  }

  if (!selection) {
    try {
      selection = selectComparableHourlyBaseline(
        await fetchSnapshotRows(referenceAt),
        referenceAt,
        currentStationCount,
      );
    } catch (error) {
      logger.warn('network_briefing.snapshot_baseline_failed', { error });
      failed = true;
    }
  }

  if (!selection) {
    if (failed) {
      // Que la consulta falle no es lo mismo que no haya franja: no se cachea.
      throw new Error('network briefing baseline unavailable');
    }
    return { baseline: null };
  }

  return {
    baseline: {
      ...selection.baseline,
      activeAlertsCount: await fetchHistoricalAlertCount(selection.bucketStart),
    },
  };
}
