import 'server-only';

import { prisma } from '@/lib/db';
import { TIMEZONE } from '@/lib/timezone';

const madridDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

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

export type MobilityConclusionsPayload = {
  dateKey: string;
  generatedAt: string;
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
  topStationsByDemand: Array<{
    stationId: string;
    stationName: string;
    avgDemand: number;
  }>;
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

function toNumber(value: number | null | undefined): number {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 0;
  }

  return Number(value);
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

function toDateOrNull(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const withTime = value.length <= 10 ? `${value}T00:00:00.000Z` : value;
  const parsed = new Date(withTime);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function buildMobilityConclusionsPayload(dateKey: string): Promise<MobilityConclusionsPayload> {
  const generatedAt = new Date();

  const [coverageRows, demandLastRows, demandPreviousRows, occupancyLastRows, occupancyPreviousRows, activeStations, topStationsRows] =
    await Promise.all([
      prisma.$queryRaw<CoverageRow[]>`
        SELECT
          MIN(date(bucketDate)) AS firstDay,
          MAX(date(bucketDate)) AS lastDay,
          COUNT(DISTINCT date(bucketDate)) AS totalDays,
          COUNT(DISTINCT stationId) AS stationsWithData
        FROM DailyStationStat;
      `,
      prisma.$queryRaw<NumericRow[]>`
        SELECT COALESCE(SUM((bikesMax - bikesMin) + (anchorsMax - anchorsMin)), 0) AS value
        FROM DailyStationStat
        WHERE datetime(bucketDate) >= datetime('now', '-6 days');
      `,
      prisma.$queryRaw<NumericRow[]>`
        SELECT COALESCE(SUM((bikesMax - bikesMin) + (anchorsMax - anchorsMin)), 0) AS value
        FROM DailyStationStat
        WHERE datetime(bucketDate) >= datetime('now', '-13 days')
          AND datetime(bucketDate) < datetime('now', '-6 days');
      `,
      prisma.$queryRaw<NumericRow[]>`
        SELECT COALESCE(AVG(occupancyAvg), 0) AS value
        FROM DailyStationStat
        WHERE datetime(bucketDate) >= datetime('now', '-6 days');
      `,
      prisma.$queryRaw<NumericRow[]>`
        SELECT COALESCE(AVG(occupancyAvg), 0) AS value
        FROM DailyStationStat
        WHERE datetime(bucketDate) >= datetime('now', '-13 days')
          AND datetime(bucketDate) < datetime('now', '-6 days');
      `,
      prisma.station.count({ where: { isActive: true } }),
      prisma.$queryRaw<TopStationRow[]>`
        SELECT
          DailyStationStat.stationId AS stationId,
          Station.name AS stationName,
          AVG((DailyStationStat.bikesMax - DailyStationStat.bikesMin) + (DailyStationStat.anchorsMax - DailyStationStat.anchorsMin)) AS avgDemand
        FROM DailyStationStat
        INNER JOIN Station ON Station.id = DailyStationStat.stationId
        WHERE datetime(DailyStationStat.bucketDate) >= datetime('now', '-29 days')
        GROUP BY DailyStationStat.stationId, Station.name
        ORDER BY avgDemand DESC
        LIMIT 5;
      `,
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

  const summary =
    demandDeltaRatio === null
      ? `La ciudad acumula ${Math.round(demandLast7Days)} puntos de demanda agregada en la ultima semana, con ocupacion media del ${Math.round(
          occupancyLast7Days * 100
        )}% sobre ${toNumber(coverage.totalDays)} dias historicos disponibles.`
      : `La demanda semanal se mueve ${formatDelta(demandDeltaRatio)} frente a la semana previa y la ocupacion media se situa en ${Math.round(
          occupancyLast7Days * 100
        )}% (${formatDelta(occupancyDeltaRatio)}).`;

  const highlights = [
    {
      title: 'Demanda semanal',
      detail: `${Math.round(demandLast7Days)} puntos en 7 dias (${formatDelta(demandDeltaRatio)} vs semana previa).`,
    },
    {
      title: 'Ocupacion media',
      detail: `${Math.round(occupancyLast7Days * 100)}% en la ultima semana (${formatDelta(occupancyDeltaRatio)}).`,
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

  const recommendations: string[] = [];

  if (demandDeltaRatio !== null && demandDeltaRatio > 0.08) {
    recommendations.push(
      'Refuerza la redistribucion preventiva en franjas de entrada laboral para absorber el incremento de demanda semanal.'
    );
  } else if (demandDeltaRatio !== null && demandDeltaRatio < -0.08) {
    recommendations.push(
      'Ajusta el despliegue operativo a una demanda mas contenida y prioriza zonas con mayor variabilidad antes que volumen absoluto.'
    );
  } else {
    recommendations.push(
      'Mantener el plan operativo actual con seguimiento diario, ya que la demanda semanal evoluciona dentro de un rango estable.'
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

  return {
    dateKey,
    generatedAt: generatedAt.toISOString(),
    sourceFirstDay: coverage.firstDay,
    sourceLastDay: coverage.lastDay,
    totalHistoricalDays: toNumber(coverage.totalDays),
    stationsWithData: toNumber(coverage.stationsWithData),
    activeStations,
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
    topStationsByDemand,
  };
}

function parseCachedPayload(rawPayload: string): MobilityConclusionsPayload | null {
  try {
    const parsed = JSON.parse(rawPayload) as MobilityConclusionsPayload;

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    if (typeof parsed.dateKey !== 'string') {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function getDailyMobilityConclusions(): Promise<{
  payload: MobilityConclusionsPayload;
  fromCache: boolean;
}> {
  const dateKey = getMadridDateKey();

  const cached = await prisma.mobilityBriefingCache.findUnique({
    where: { dateKey },
  });

  if (cached) {
    const parsed = parseCachedPayload(cached.payload);

    if (parsed) {
      return {
        payload: parsed,
        fromCache: true,
      };
    }
  }

  const payload = await buildMobilityConclusionsPayload(dateKey);
  const sourceLastDay = toDateOrNull(payload.sourceLastDay);

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

  return {
    payload,
    fromCache: false,
  };
}
