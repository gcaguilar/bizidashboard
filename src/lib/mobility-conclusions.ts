import 'server-only';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { buildStationDistrictMap, DISTRICTS_GEOJSON_URL, isDistrictCollection } from '@/lib/districts';
import { formatMonthLabel, getMonthBounds, isValidMonthKey } from '@/lib/months';
import { captureWarningWithContext } from '@/lib/sentry-reporting';
import { TIMEZONE } from '@/lib/timezone';

const madridDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
let hasReportedMissingMobilityBriefingCacheTable = false;

type CoverageRow = {
  firstDay: string | null;
  lastDay: string | null;
  totalDays: number | null;
  stationsWithData: number | null;
};

type NumericRow = {
  value: number | null;
};

type TopStationRow = {
  stationId: string;
  stationName: string;
  avgDemand: number | null;
};

type PeakHourRow = {
  hour: number | null;
  demandScore: number | null;
};

type StationDemandRow = {
  stationId: string;
  demandScore: number | null;
};

type DayTypeProfileRow = {
  dayType: string;
  avgDemand: number | null;
  avgOccupancy: number | null;
  daysCount: number | null;
};

type CachedBriefingRecord = {
  payload: string;
  sourceLastDay: Date | null;
};

type CoverageSignature = {
  firstDay: string | null;
  lastDay: string | null;
  totalDays: number;
};

export type MobilityConclusionsPayload = {
  dateKey: string;
  generatedAt: string;
  selectedMonth: string | null;
  sourceFirstDay: string | null;
  sourceLastDay: string | null;
  totalHistoricalDays: number;
  stationsWithData: number;
  activeStations: number;
  metrics: {
    demandLast7Days: number;
    demandPrevious7Days: number;
    demandDeltaRatio: number | null;
    occupancyLast7Days: number;
    occupancyPrevious7Days: number;
    occupancyDeltaRatio: number | null;
  };
  summary: string;
  highlights: Array<{
    title: string;
    detail: string;
  }>;
  recommendations: string[];
  peakDemandHours: Array<{
    hour: number;
    demandScore: number;
  }>;
  topDistrictsByDemand: Array<{
    district: string;
    demandScore: number;
  }>;
  topStationsByDemand: Array<{
    stationId: string;
    stationName: string;
    avgDemand: number;
  }>;
  leastUsedStations: Array<{
    stationId: string;
    stationName: string;
    avgDemand: number;
  }>;
  weekdayWeekendProfile: {
    weekday: {
      avgDemand: number;
      avgOccupancy: number;
      daysCount: number;
    };
    weekend: {
      avgDemand: number;
      avgOccupancy: number;
      daysCount: number;
    };
    demandGapRatio: number | null;
    dominantPeriod: 'weekday' | 'weekend' | null;
  };
};

function getMadridDateKey(value: Date = new Date()): string {
  const formatted = madridDateFormatter.format(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) {
    return formatted;
  }

  const [month, day, year] = formatted.split('/');

  if (year && month && day) {
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return value.toISOString().slice(0, 10);
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function calculateDelta(current: number, previous: number): number | null {
  if (!Number.isFinite(previous) || previous <= 0) {
    return null;
  }

  return (current - previous) / previous;
}

function formatDelta(deltaRatio: number | null): string {
  if (deltaRatio === null || !Number.isFinite(deltaRatio)) {
    return 'sin referencia previa';
  }

  const prefix = deltaRatio >= 0 ? '+' : '';
  return `${prefix}${Math.round(deltaRatio * 100)}%`;
}

async function getDistrictCollection() {
  try {
    const response = await fetch(DISTRICTS_GEOJSON_URL, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return isDistrictCollection(payload) ? payload : null;
  } catch {
    return null;
  }
}

function toDateOrNull(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const withTime = value.length <= 10 ? `${value}T00:00:00.000Z` : value;
  const parsed = new Date(withTime);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isOptionalFiniteNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value);
}

function isOptionalString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function getErrorMessages(error: unknown): string[] {
  if (!error || typeof error !== 'object') {
    return [];
  }

  const typedError = error as { message?: unknown; cause?: unknown };
  const messages: string[] = [];

  if (typeof typedError.message === 'string' && typedError.message.length > 0) {
    messages.push(typedError.message);
  }

  if (typedError.cause && typedError.cause !== error) {
    messages.push(...getErrorMessages(typedError.cause));
  }

  return messages;
}

function isMissingMobilityBriefingCacheTableError(error: unknown): boolean {
  return getErrorMessages(error).some((message) => {
    const normalized = message.toLowerCase();

    if (!normalized.includes('mobilitybriefingcache')) {
      return false;
    }

    return (
      normalized.includes('no such table') ||
      normalized.includes('does not exist') ||
      normalized.includes('p2021')
    );
  });
}

function hasCacheShape(payload: unknown): payload is MobilityConclusionsPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const typed = payload as Partial<MobilityConclusionsPayload>;

  if (
    typeof typed.dateKey !== 'string' ||
    typeof typed.generatedAt !== 'string' ||
    !isOptionalString(typed.selectedMonth) ||
    typeof typed.summary !== 'string' ||
    !isFiniteNumber(typed.totalHistoricalDays) ||
    !isFiniteNumber(typed.stationsWithData) ||
    !isFiniteNumber(typed.activeStations)
  ) {
    return false;
  }

  if (!typed.metrics || typeof typed.metrics !== 'object') {
    return false;
  }

  const metrics = typed.metrics as Partial<MobilityConclusionsPayload['metrics']>;

  if (
    !isFiniteNumber(metrics.demandLast7Days) ||
    !isFiniteNumber(metrics.demandPrevious7Days) ||
    !isOptionalFiniteNumber(metrics.demandDeltaRatio) ||
    !isFiniteNumber(metrics.occupancyLast7Days) ||
    !isFiniteNumber(metrics.occupancyPrevious7Days) ||
    !isOptionalFiniteNumber(metrics.occupancyDeltaRatio)
  ) {
    return false;
  }

  if (
    !Array.isArray(typed.highlights) ||
    !Array.isArray(typed.recommendations) ||
    !Array.isArray(typed.topStationsByDemand) ||
    !Array.isArray(typed.leastUsedStations)
  ) {
    return false;
  }

  if (
    !Array.isArray(typed.peakDemandHours) ||
    !Array.isArray(typed.topDistrictsByDemand) ||
    !typed.weekdayWeekendProfile ||
    typeof typed.weekdayWeekendProfile !== 'object'
  ) {
    return false;
  }

  return true;
}

function buildConclusionsRange(monthKey?: string): {
  currentDaily: Prisma.Sql;
  previousDaily: Prisma.Sql;
  currentHourly: Prisma.Sql;
  topStationsDaily: Prisma.Sql;
  summaryScope: string;
  comparisonScope: string;
} {
  if (monthKey && isValidMonthKey(monthKey)) {
    const { start, endExclusive } = getMonthBounds(monthKey);
    const [year, month] = monthKey.split('-').map(Number);
    const previousStart = new Date(Date.UTC((year ?? 1970), (month ?? 1) - 2, 1)).toISOString();

    return {
      currentDaily: Prisma.sql`"bucketDate" >= ${start}::timestamp AND "bucketDate" < ${endExclusive}::timestamp`,
      previousDaily: Prisma.sql`"bucketDate" >= ${previousStart}::timestamp AND "bucketDate" < ${start}::timestamp`,
      currentHourly: Prisma.sql`"bucketStart" >= ${start}::timestamp AND "bucketStart" < ${endExclusive}::timestamp`,
      topStationsDaily: Prisma.sql`"DailyStationStat"."bucketDate" >= ${start}::timestamp AND "DailyStationStat"."bucketDate" < ${endExclusive}::timestamp`,
      summaryScope: `en ${formatMonthLabel(monthKey)}`,
      comparisonScope: 'vs mes previo',
    };
  }

  return {
    currentDaily: Prisma.sql`"bucketDate" >= CURRENT_DATE - INTERVAL '6 days'`,
    previousDaily: Prisma.sql`"bucketDate" >= CURRENT_DATE - INTERVAL '13 days' AND "bucketDate" < CURRENT_DATE - INTERVAL '6 days'`,
    currentHourly: Prisma.sql`"bucketStart" >= CURRENT_DATE - INTERVAL '6 days'`,
    topStationsDaily: Prisma.sql`"DailyStationStat"."bucketDate" >= CURRENT_DATE - INTERVAL '29 days'`,
    summaryScope: 'en la ultima semana',
    comparisonScope: 'vs semana previa',
  };
}

function getDominantPeriod(weekdayDemand: number, weekendDemand: number): 'weekday' | 'weekend' | null {
  if (weekdayDemand <= 0 && weekendDemand <= 0) {
    return null;
  }

  return weekdayDemand >= weekendDemand ? 'weekday' : 'weekend';
}

async function buildMobilityConclusionsPayload(dateKey: string, monthKey?: string | null): Promise<MobilityConclusionsPayload> {
  const generatedAt = new Date();
  const selectedMonth = monthKey && isValidMonthKey(monthKey) ? monthKey : null;
  const range = buildConclusionsRange(selectedMonth ?? undefined);

  const [
    coverageRows,
    demandLastRows,
    demandPreviousRows,
    occupancyLastRows,
    occupancyPreviousRows,
    activeStationRows,
    topStationsRows,
    leastUsedStationsRows,
    dayTypeProfileRows,
    peakHourRows,
    stationDemandRows,
    districts,
  ] = await Promise.all([
      prisma.$queryRaw<CoverageRow[]>`
        SELECT
          MIN(TO_CHAR("bucketDate", 'YYYY-MM-DD')) AS "firstDay",
          MAX(TO_CHAR("bucketDate", 'YYYY-MM-DD')) AS "lastDay",
          COUNT(DISTINCT TO_CHAR("bucketDate", 'YYYY-MM-DD')) AS "totalDays",
          COUNT(DISTINCT "stationId") AS "stationsWithData"
        FROM "DailyStationStat"
        ${selectedMonth ? Prisma.sql`WHERE ${range.currentDaily}` : Prisma.sql``};
      `,
      prisma.$queryRaw<NumericRow[]>`
        SELECT COALESCE(SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")), 0) AS value
        FROM "DailyStationStat"
        WHERE ${range.currentDaily};
      `,
      prisma.$queryRaw<NumericRow[]>`
        SELECT COALESCE(SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")), 0) AS value
        FROM "DailyStationStat"
        WHERE ${range.previousDaily};
      `,
      prisma.$queryRaw<NumericRow[]>`
        SELECT COALESCE(AVG("occupancyAvg"), 0) AS value
        FROM "DailyStationStat"
        WHERE ${range.currentDaily};
      `,
      prisma.$queryRaw<NumericRow[]>`
        SELECT COALESCE(AVG("occupancyAvg"), 0) AS value
        FROM "DailyStationStat"
        WHERE ${range.previousDaily};
      `,
      prisma.station.findMany({
        where: { isActive: true },
        select: {
          id: true,
          lat: true,
          lon: true,
        },
      }),
      prisma.$queryRaw<TopStationRow[]>`
        SELECT
          "DailyStationStat"."stationId" AS "stationId",
          "Station".name AS "stationName",
          AVG(("DailyStationStat"."bikesMax" - "DailyStationStat"."bikesMin") + ("DailyStationStat"."anchorsMax" - "DailyStationStat"."anchorsMin")) AS "avgDemand"
        FROM "DailyStationStat"
        INNER JOIN "Station" ON "Station".id = "DailyStationStat"."stationId"
        WHERE ${range.topStationsDaily}
        GROUP BY "DailyStationStat"."stationId", "Station".name
        ORDER BY "avgDemand" DESC
        LIMIT 5;
      `,
      prisma.$queryRaw<TopStationRow[]>`
        SELECT
          "DailyStationStat"."stationId" AS "stationId",
          "Station".name AS "stationName",
          AVG(("DailyStationStat"."bikesMax" - "DailyStationStat"."bikesMin") + ("DailyStationStat"."anchorsMax" - "DailyStationStat"."anchorsMin")) AS "avgDemand"
        FROM "DailyStationStat"
        INNER JOIN "Station" ON "Station".id = "DailyStationStat"."stationId"
        WHERE ${range.topStationsDaily}
        GROUP BY "DailyStationStat"."stationId", "Station".name
        HAVING COUNT(*) > 0
        ORDER BY "avgDemand" ASC, "Station".name ASC
        LIMIT 5;
      `,
      prisma.$queryRaw<DayTypeProfileRow[]>`
        WITH daily_totals AS (
          SELECT
            "bucketDate"::date AS "bucketDay",
            SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")) AS "demandScore",
            AVG("occupancyAvg") AS "occupancyAvg"
          FROM "DailyStationStat"
          WHERE ${range.currentDaily}
          GROUP BY "bucketDate"::date
        )
        SELECT
          CASE
            WHEN EXTRACT(DOW FROM "bucketDay")::int IN (0, 6) THEN 'weekend'
            ELSE 'weekday'
          END AS "dayType",
          AVG("demandScore") AS "avgDemand",
          AVG("occupancyAvg") AS "avgOccupancy",
          COUNT(*) AS "daysCount"
        FROM daily_totals
        GROUP BY "dayType";
      `,
      prisma.$queryRaw<PeakHourRow[]>`
        SELECT
          EXTRACT(HOUR FROM "bucketStart")::int AS hour,
          COALESCE(SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")), 0) AS "demandScore"
        FROM "HourlyStationStat"
        WHERE ${range.currentHourly}
        GROUP BY EXTRACT(HOUR FROM "bucketStart")::int
        ORDER BY "demandScore" DESC, hour ASC
        LIMIT 3;
      `,
      prisma.$queryRaw<StationDemandRow[]>`
        SELECT
          "stationId",
          COALESCE(SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")), 0) AS "demandScore"
        FROM "DailyStationStat"
        WHERE ${range.currentDaily}
        GROUP BY "stationId"
        ORDER BY "demandScore" DESC;
      `,
      getDistrictCollection(),
    ]);

  const coverage = coverageRows[0] ?? {
    firstDay: null,
    lastDay: null,
    totalDays: 0,
    stationsWithData: 0,
  };

  const demandLast7Days = toNumber(demandLastRows[0]?.value);
  const demandPrevious7Days = toNumber(demandPreviousRows[0]?.value);
  const occupancyLast7Days = toNumber(occupancyLastRows[0]?.value);
  const occupancyPrevious7Days = toNumber(occupancyPreviousRows[0]?.value);

  const demandDeltaRatio = calculateDelta(demandLast7Days, demandPrevious7Days);
  const occupancyDeltaRatio = calculateDelta(occupancyLast7Days, occupancyPrevious7Days);

  const topStationsByDemand = topStationsRows.map((row) => ({
    stationId: row.stationId,
    stationName: row.stationName,
    avgDemand: round(toNumber(row.avgDemand), 1),
  }));

  const leastUsedStations = leastUsedStationsRows.map((row) => ({
    stationId: row.stationId,
    stationName: row.stationName,
    avgDemand: round(toNumber(row.avgDemand), 1),
  }));

  const weekdayProfile = dayTypeProfileRows.find((row) => row.dayType === 'weekday');
  const weekendProfile = dayTypeProfileRows.find((row) => row.dayType === 'weekend');

  const weekdayWeekendProfile = {
    weekday: {
      avgDemand: round(toNumber(weekdayProfile?.avgDemand), 1),
      avgOccupancy: round(toNumber(weekdayProfile?.avgOccupancy), 4),
      daysCount: Math.round(toNumber(weekdayProfile?.daysCount)),
    },
    weekend: {
      avgDemand: round(toNumber(weekendProfile?.avgDemand), 1),
      avgOccupancy: round(toNumber(weekendProfile?.avgOccupancy), 4),
      daysCount: Math.round(toNumber(weekendProfile?.daysCount)),
    },
    demandGapRatio: calculateDelta(
      toNumber(weekendProfile?.avgDemand),
      toNumber(weekdayProfile?.avgDemand)
    ),
    dominantPeriod: getDominantPeriod(
      toNumber(weekdayProfile?.avgDemand),
      toNumber(weekendProfile?.avgDemand)
    ),
  };

  const peakDemandHours = peakHourRows
    .map((row) => ({
      hour: Math.max(0, Math.min(23, toNumber(row.hour))),
      demandScore: Math.round(toNumber(row.demandScore)),
    }))
    .filter((row) => row.demandScore > 0);

  const topDistrictsByDemand = (() => {
    if (!districts || activeStationRows.length === 0 || stationDemandRows.length === 0) {
      return [] as MobilityConclusionsPayload['topDistrictsByDemand'];
    }

    const stationDistrictMap = buildStationDistrictMap(activeStationRows, districts);
    const districtTotals = new Map<string, number>();

    for (const row of stationDemandRows) {
      const district = stationDistrictMap.get(row.stationId);

      if (!district) {
        continue;
      }

      districtTotals.set(district, (districtTotals.get(district) ?? 0) + toNumber(row.demandScore));
    }

    return Array.from(districtTotals.entries())
      .map(([district, demandScore]) => ({ district, demandScore: Math.round(demandScore) }))
      .sort((left, right) => right.demandScore - left.demandScore || left.district.localeCompare(right.district, 'es'))
      .slice(0, 3);
  })();

  const summary =
    demandDeltaRatio === null
      ? `La ciudad acumula ${Math.round(demandLast7Days)} puntos de demanda agregada ${range.summaryScope}, con ocupacion media del ${Math.round(
          occupancyLast7Days * 100
        )}% sobre ${toNumber(coverage.totalDays)} dias historicos disponibles.`
      : `La demanda ${selectedMonth ? 'mensual' : 'semanal'} se mueve ${formatDelta(demandDeltaRatio)} ${range.comparisonScope} y la ocupacion media se situa en ${Math.round(
          occupancyLast7Days * 100
        )}% (${formatDelta(occupancyDeltaRatio)}).`;

  const highlights = [
    {
      title: selectedMonth ? 'Demanda del mes' : 'Demanda semanal',
      detail: `${Math.round(demandLast7Days)} puntos ${selectedMonth ? `en ${formatMonthLabel(selectedMonth)}` : 'en 7 dias'} (${formatDelta(
        demandDeltaRatio
      )} ${range.comparisonScope}).`,
    },
    {
      title: selectedMonth ? 'Ocupacion media del mes' : 'Ocupacion media',
      detail: `${Math.round(occupancyLast7Days * 100)}% ${range.summaryScope} (${formatDelta(occupancyDeltaRatio)}).`,
    },
    {
      title: 'Cobertura historica',
      detail: `${toNumber(coverage.totalDays)} dias con datos y ${toNumber(
        coverage.stationsWithData
      )} estaciones con muestra.`,
    },
  ];

  if (topStationsByDemand[0]) {
    highlights.push({
      title: 'Estacion con mayor presion',
      detail: `${topStationsByDemand[0].stationName} lidera el promedio diario de demanda (indice ${topStationsByDemand[0].avgDemand}).`,
    });
  }

  if (weekdayWeekendProfile.dominantPeriod) {
    highlights.push({
      title: 'Patron semanal',
      detail:
        weekdayWeekendProfile.dominantPeriod === 'weekday'
          ? `La red rinde mas entre semana, con ${weekdayWeekendProfile.weekday.avgDemand.toFixed(1)} puntos medios al dia frente a ${weekdayWeekendProfile.weekend.avgDemand.toFixed(1)} en fin de semana.`
          : `La red rinde mas en fin de semana, con ${weekdayWeekendProfile.weekend.avgDemand.toFixed(1)} puntos medios al dia frente a ${weekdayWeekendProfile.weekday.avgDemand.toFixed(1)} entre semana.`,
    });
  }

  const recommendations: string[] = [];

  if (demandDeltaRatio !== null && demandDeltaRatio > 0.08) {
    recommendations.push(
       `Refuerza la redistribucion preventiva para absorber el incremento de demanda ${selectedMonth ? 'del mes' : 'semanal'}.`
     );
  } else if (demandDeltaRatio !== null && demandDeltaRatio < -0.08) {
    recommendations.push(
      `Ajusta el despliegue operativo a una demanda mas contenida ${selectedMonth ? 'en el mes seleccionado' : 'esta semana'} y prioriza zonas con mayor variabilidad.`
    );
  } else {
    recommendations.push(
      `Mantener el plan operativo actual con seguimiento diario, ya que la demanda ${selectedMonth ? 'del periodo' : 'semanal'} evoluciona dentro de un rango estable.`
    );
  }

  if (occupancyLast7Days < 0.32) {
    recommendations.push(
      'Hay margen para reforzar disponibilidad de bicicletas en nodos de salida temprana para reducir riesgo de estaciones vacias.'
    );
  } else if (occupancyLast7Days > 0.68) {
    recommendations.push(
      'La ocupacion media alta sugiere reforzar retirada en estaciones de alta recepcion para evitar saturacion de anclajes.'
    );
  } else {
    recommendations.push(
      'La ocupacion media se mantiene equilibrada; conviene centrar recursos en estaciones con picos abruptos de demanda.'
    );
  }

  if (topStationsByDemand.length > 0) {
    recommendations.push(
      `Monitoriza diariamente ${topStationsByDemand[0].stationName} y ${
        topStationsByDemand[1]?.stationName ?? topStationsByDemand[0].stationName
      } como puntos de mayor friccion potencial.`
    );
  }

  if (peakDemandHours[0]) {
    recommendations.push(
      `Refuerza seguimiento y redistribucion en torno a las ${String(peakDemandHours[0].hour).padStart(2, '0')}:00, la franja con mayor intensidad reciente.`
    );
  }

  if (weekdayWeekendProfile.dominantPeriod === 'weekday') {
    recommendations.push(
      'Dimensiona el operativo principal para dias laborables y reserva ajustes mas ligeros para sabados y domingos.'
    );
  } else if (weekdayWeekendProfile.dominantPeriod === 'weekend') {
    recommendations.push(
      'Refuerza capacidad y seguimiento en fines de semana, donde la red concentra mayor intensidad media de uso.'
    );
  }

  return {
    dateKey,
    generatedAt: generatedAt.toISOString(),
    selectedMonth,
    sourceFirstDay: coverage.firstDay,
    sourceLastDay: coverage.lastDay,
    totalHistoricalDays: toNumber(coverage.totalDays),
    stationsWithData: toNumber(coverage.stationsWithData),
    activeStations: activeStationRows.length,
    metrics: {
      demandLast7Days: Math.round(demandLast7Days),
      demandPrevious7Days: Math.round(demandPrevious7Days),
      demandDeltaRatio: demandDeltaRatio === null ? null : round(demandDeltaRatio, 4),
      occupancyLast7Days: round(occupancyLast7Days, 4),
      occupancyPrevious7Days: round(occupancyPrevious7Days, 4),
      occupancyDeltaRatio: occupancyDeltaRatio === null ? null : round(occupancyDeltaRatio, 4),
    },
    summary,
    highlights,
    recommendations,
    peakDemandHours,
    topDistrictsByDemand,
    topStationsByDemand,
    leastUsedStations,
    weekdayWeekendProfile,
  };
}

function parseCachedPayload(rawPayload: string): MobilityConclusionsPayload | null {
  try {
    const parsed = JSON.parse(rawPayload);
    return hasCacheShape(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function hasSameSourceLastDay(cachedSourceLastDay: Date | null, sourceLastDay: Date | null): boolean {
  if (!cachedSourceLastDay && !sourceLastDay) {
    return true;
  }

  if (!cachedSourceLastDay || !sourceLastDay) {
    return false;
  }

  return cachedSourceLastDay.getTime() === sourceLastDay.getTime();
}

async function getCoverageSignature(): Promise<CoverageSignature> {
  const [coverage] = await prisma.$queryRaw<CoverageRow[]>`
    SELECT
      MIN(TO_CHAR("bucketDate", 'YYYY-MM-DD')) AS "firstDay",
      MAX(TO_CHAR("bucketDate", 'YYYY-MM-DD')) AS "lastDay",
      COUNT(DISTINCT TO_CHAR("bucketDate", 'YYYY-MM-DD')) AS "totalDays",
      COUNT(DISTINCT "stationId") AS "stationsWithData"
    FROM "DailyStationStat";
  `;

  return {
    firstDay: coverage?.firstDay ?? null,
    lastDay: coverage?.lastDay ?? null,
    totalDays: toNumber(coverage?.totalDays),
  };
}

function hasSameCoverageSignature(
  payload: MobilityConclusionsPayload,
  coverage: CoverageSignature,
  sourceLastDay: Date | null
): boolean {
  if (!hasSameSourceLastDay(toDateOrNull(payload.sourceLastDay), sourceLastDay)) {
    return false;
  }

  return (
    payload.sourceFirstDay === coverage.firstDay &&
    payload.sourceLastDay === coverage.lastDay &&
    payload.totalHistoricalDays === coverage.totalDays
  );
}

export async function getDailyMobilityConclusions(monthKey?: string | null): Promise<{
  payload: MobilityConclusionsPayload;
  fromCache: boolean;
}> {
  const dateKey = getMadridDateKey();

  if (monthKey && isValidMonthKey(monthKey)) {
    return {
      payload: await buildMobilityConclusionsPayload(dateKey, monthKey),
      fromCache: false,
    };
  }

  let cached: CachedBriefingRecord | null = null;
  let cacheTableAvailable = true;

  try {
    cached = await prisma.mobilityBriefingCache.findUnique({
      where: { dateKey },
      select: {
        payload: true,
        sourceLastDay: true,
      },
    });
  } catch (error) {
    if (!isMissingMobilityBriefingCacheTableError(error)) {
      throw error;
    }

    cacheTableAvailable = false;
    if (!hasReportedMissingMobilityBriefingCacheTable) {
      captureWarningWithContext('MobilityBriefingCache table is missing; using uncached mobility conclusions.', {
        area: 'mobility.conclusions',
        operation: 'readMobilityBriefingCache',
        tags: {
          handled: true,
        },
        dedupeKey: 'mobility-conclusions.missing-cache-table',
      });
      hasReportedMissingMobilityBriefingCacheTable = true;
    }
    console.warn('[MobilityConclusions] MobilityBriefingCache table is missing; computing payload without cache.');
  }

  if (cached) {
    const parsed = parseCachedPayload(cached.payload);

    const coverage = await getCoverageSignature();
    const sourceLastDay = toDateOrNull(coverage.lastDay);

    if (parsed && hasSameCoverageSignature(parsed, coverage, sourceLastDay)) {
      return {
        payload: parsed,
        fromCache: true,
      };
    }
  }

  const payload = await buildMobilityConclusionsPayload(dateKey);
  const sourceLastDay = toDateOrNull(payload.sourceLastDay);

  if (cacheTableAvailable) {
    try {
      await prisma.mobilityBriefingCache.upsert({
        where: { dateKey },
        create: {
          dateKey,
          payload: JSON.stringify(payload),
          sourceLastDay,
        },
        update: {
          payload: JSON.stringify(payload),
          sourceLastDay,
        },
      });
    } catch (error) {
      if (!isMissingMobilityBriefingCacheTableError(error)) {
        throw error;
      }

      if (!hasReportedMissingMobilityBriefingCacheTable) {
        captureWarningWithContext('MobilityBriefingCache table is missing; skipping cache persistence.', {
          area: 'mobility.conclusions',
          operation: 'writeMobilityBriefingCache',
          tags: {
            handled: true,
          },
          dedupeKey: 'mobility-conclusions.missing-cache-table',
        });
        hasReportedMissingMobilityBriefingCacheTable = true;
      }
      console.warn('[MobilityConclusions] MobilityBriefingCache table is missing; skipping cache persistence.');
    }
  }

  return {
    payload,
    fromCache: false,
  };
}
