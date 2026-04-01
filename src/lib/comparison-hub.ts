import 'server-only';

import { prisma } from '@/lib/db';
import { combineDataStates, type DataState } from '@/lib/data-state';
import { fetchDistrictCollection } from '@/lib/districts';
import { getDailyMobilityConclusions } from '@/lib/mobility-conclusions';
import { formatMonthLabel, isValidMonthKey } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { buildDistrictSeoRows } from '@/lib/seo-districts';
import { getDailyDemandCurve, getMonthlyDemandCurve, getSystemHourlyProfile } from '@/analytics/queries/read';
import {
  fetchAvailableDataMonths,
  fetchRankingsLite,
  fetchSharedDatasetSnapshot,
  fetchStations,
} from '@/lib/api';
import {
  buildFallbackDatasetSnapshot,
  buildFallbackStations,
} from '@/lib/shared-data-fallbacks';

type HistoryCompareRow = {
  day: string;
  demandScore: number;
  avgOccupancy: number;
  balanceIndex: number;
  sampleCount: number;
};

export type ComparisonCard = {
  id:
    | 'station-vs-station'
    | 'district-vs-district'
    | 'month-vs-month'
    | 'year-vs-year'
    | 'weekday-vs-weekend'
    | 'hour-vs-hour'
    | 'periods'
    | 'before-after-expansion'
    | 'events-vs-normal'
    | 'ranking-changes'
    | 'demand-changes'
    | 'balance-changes';
  title: string;
  eyebrow: string;
  summary: string;
  metricA: string;
  metricB: string;
  delta: string;
  href: string;
  note?: string;
};

export type ComparisonSection = {
  id: 'current' | 'historical' | 'changes';
  title: string;
  description: string;
  cards: ComparisonCard[];
};

export type InteractiveComparisonDimensionId =
  | 'stations'
  | 'districts'
  | 'months'
  | 'years'
  | 'hours'
  | 'periods';

export type InteractiveComparisonOption = {
  id: string;
  label: string;
  href: string;
  primaryLabel: string;
  primaryValue: number | null;
  primaryDisplay: string;
  secondaryLabel: string;
  secondaryDisplay: string;
  tertiaryLabel?: string;
  tertiaryDisplay?: string;
  note?: string;
};

export type InteractiveComparisonDimension = {
  id: InteractiveComparisonDimensionId;
  label: string;
  description: string;
  options: InteractiveComparisonOption[];
  defaultLeftId: string | null;
  defaultRightId: string | null;
};

export type InteractiveComparisonData = {
  defaultDimensionId: InteractiveComparisonDimensionId | null;
  dimensions: InteractiveComparisonDimension[];
};

export type ComparisonHubData = {
  latestMonth: string | null;
  generatedAt: string;
  dataState: DataState;
  interactive: InteractiveComparisonData;
  sections: ComparisonSection[];
};

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallbackValue: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallbackValue), timeoutMs);
    }),
  ]);
}

function buildFallbackComparisonSections(): ComparisonSection[] {
  return [
    {
      id: 'current',
      title: 'Comparativas operativas',
      description:
        'Lecturas directas para comparar estaciones, barrios, franjas horarias y comportamiento laboral frente al fin de semana.',
      cards: [],
    },
    {
      id: 'historical',
      title: 'Comparativas historicas',
      description:
        'Cortes temporales para comparar meses, anos, periodos y grandes cambios en la red o en la demanda.',
      cards: [],
    },
    {
      id: 'changes',
      title: 'Cambios detectados',
      description:
        'Deltas recientes de rankings, demanda y balance para entender si el sistema mejora, empeora o gira de lideres.',
      cards: [],
    },
  ];
}

export function buildFallbackComparisonHubData(nowIso = new Date().toISOString()): ComparisonHubData {
  return {
    latestMonth: null,
    generatedAt: nowIso,
    dataState: 'no_coverage',
    interactive: {
      defaultDimensionId: null,
      dimensions: [],
    },
    sections: buildFallbackComparisonSections(),
  };
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value);
}

function formatDecimal(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits }).format(value);
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'Sin datos';
  }

  return new Intl.NumberFormat('es-ES', {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDelta(deltaRatio: number | null | undefined): string {
  if (deltaRatio === null || deltaRatio === undefined || !Number.isFinite(deltaRatio)) {
    return 'Sin referencia comparable';
  }

  const prefix = deltaRatio >= 0 ? '+' : '';
  return `${prefix}${Math.round(deltaRatio * 100)}%`;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildUnavailableCard(
  id: ComparisonCard['id'],
  title: string,
  eyebrow: string,
  href: string,
  note?: string
): ComparisonCard {
  return {
    id,
    title,
    eyebrow,
    summary: 'Todavia no hay suficiente dato agregado para esta comparativa.',
    metricA: 'Sin muestra suficiente',
    metricB: 'Sin referencia previa',
    delta: 'Pendiente de cobertura',
    href,
    note,
  };
}

async function getRecentHistoryRows(): Promise<HistoryCompareRow[]> {
  return prisma.$queryRaw<HistoryCompareRow[]>`
    SELECT
      TO_CHAR("bucketStart", 'YYYY-MM-DD') AS day,
      SUM(("bikesMax" - "bikesMin") + ("anchorsMax" - "anchorsMin")) AS "demandScore",
      AVG("occupancyAvg") AS "avgOccupancy",
      AVG(CASE
        WHEN ABS("occupancyAvg" - 0.5) >= 0.5 THEN 0
        ELSE 1 - (2 * ABS("occupancyAvg" - 0.5))
      END) AS "balanceIndex",
      SUM("sampleCount") AS "sampleCount"
    FROM "HourlyStationStat"
    WHERE "bucketStart" >= NOW() - INTERVAL '90 days'
      AND "occupancyAvg" IS NOT NULL
    GROUP BY TO_CHAR("bucketStart", 'YYYY-MM-DD')
    ORDER BY day ASC;
  `;
}

function toTimestamp(day: string): number {
  return new Date(`${day}T00:00:00.000Z`).getTime();
}

function buildInteractiveDimension(config: {
  id: InteractiveComparisonDimensionId;
  label: string;
  description: string;
  options: InteractiveComparisonOption[];
  defaultLeftId?: string | null;
  defaultRightId?: string | null;
}): InteractiveComparisonDimension | null {
  if (config.options.length === 0) {
    return null;
  }

  const fallbackLeftId = config.options[0]?.id ?? null;
  const fallbackRightId = config.options[1]?.id ?? fallbackLeftId;

  return {
    id: config.id,
    label: config.label,
    description: config.description,
    options: config.options,
    defaultLeftId: config.defaultLeftId ?? fallbackLeftId,
    defaultRightId: config.defaultRightId ?? fallbackRightId,
  };
}

export async function getComparisonHubData(): Promise<ComparisonHubData> {
  const nowIso = new Date().toISOString();
  const sourceTimeoutMs = 8_000;
  const [
    stationsResponse,
    turnoverResponse,
    availabilityResponse,
    districtCollection,
    monthsResponse,
    monthlySeries,
    recentDemand,
    hourlyProfile,
    historyRows,
    dataset,
  ] = await Promise.all([
    withTimeout(
      fetchStations().catch(() => buildFallbackStations(nowIso)),
      sourceTimeoutMs,
      buildFallbackStations(nowIso)
    ),
    withTimeout(
      fetchRankingsLite('turnover', 10).catch(() => ({
        type: 'turnover' as const,
        limit: 10,
        rankings: [],
        generatedAt: nowIso,
        dataState: 'no_coverage' as const,
      })),
      sourceTimeoutMs,
      {
        type: 'turnover' as const,
        limit: 10,
        rankings: [],
        generatedAt: nowIso,
        dataState: 'no_coverage' as const,
      }
    ),
    withTimeout(
      fetchRankingsLite('availability', 10).catch(() => ({
        type: 'availability' as const,
        limit: 10,
        rankings: [],
        generatedAt: nowIso,
        dataState: 'no_coverage' as const,
      })),
      sourceTimeoutMs,
      {
        type: 'availability' as const,
        limit: 10,
        rankings: [],
        generatedAt: nowIso,
        dataState: 'no_coverage' as const,
      }
    ),
    withTimeout(fetchDistrictCollection().catch(() => null), sourceTimeoutMs, null),
    withTimeout(
      fetchAvailableDataMonths().catch(() => ({ months: [], generatedAt: nowIso })),
      sourceTimeoutMs,
      { months: [], generatedAt: nowIso }
    ),
    withTimeout(getMonthlyDemandCurve(24).catch(() => []), sourceTimeoutMs, []),
    withTimeout(getDailyDemandCurve(90).catch(() => []), sourceTimeoutMs, []),
    withTimeout(getSystemHourlyProfile(30).catch(() => []), sourceTimeoutMs, []),
    withTimeout(getRecentHistoryRows().catch(() => []), sourceTimeoutMs, []),
    withTimeout(
      fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)),
      sourceTimeoutMs,
      buildFallbackDatasetSnapshot(nowIso)
    ),
  ]);
  const districtRows = buildDistrictSeoRows({
    stations: stationsResponse.stations,
    districtCollection,
    turnoverRankings: turnoverResponse.rankings,
    availabilityRankings: availabilityResponse.rankings,
  });

  const validMonths = monthsResponse.months.filter(isValidMonthKey);
  const latestMonth = validMonths[0] ?? monthlySeries[monthlySeries.length - 1]?.monthKey ?? null;
  const previousMonth = validMonths[1] ?? monthlySeries[monthlySeries.length - 2]?.monthKey ?? null;
  const [recentConclusions, latestMonthConclusions, previousMonthConclusions] = await Promise.all([
    withTimeout(getDailyMobilityConclusions().catch(() => null), sourceTimeoutMs, null),
    latestMonth
      ? withTimeout(getDailyMobilityConclusions(latestMonth).catch(() => null), sourceTimeoutMs, null)
      : Promise.resolve(null),
    previousMonth
      ? withTimeout(getDailyMobilityConclusions(previousMonth).catch(() => null), sourceTimeoutMs, null)
      : Promise.resolve(null),
  ]);

  const stationMap = new Map(stationsResponse.stations.map((station) => [station.id, station]));
  const turnoverMap = new Map(
    turnoverResponse.rankings.map((row) => [row.stationId, Number(row.turnoverScore)])
  );
  const availabilityMap = new Map(
    availabilityResponse.rankings.map((row) => [
      row.stationId,
      Number(row.emptyHours) + Number(row.fullHours),
    ])
  );

  const currentCards: ComparisonCard[] = [];
  const historicalCards: ComparisonCard[] = [];
  const changeCards: ComparisonCard[] = [];

  const topStation = turnoverResponse.rankings[0] ?? null;
  const secondStation = turnoverResponse.rankings[1] ?? null;

  if (topStation && secondStation) {
    const topStationMeta = stationMap.get(topStation.stationId);
    const secondStationMeta = stationMap.get(secondStation.stationId);
    const demandGap =
      Number(secondStation.turnoverScore) > 0
        ? (Number(topStation.turnoverScore) - Number(secondStation.turnoverScore)) /
          Number(secondStation.turnoverScore)
        : null;

    currentCards.push({
      id: 'station-vs-station',
      title: 'Estacion vs estacion',
      eyebrow: 'Comparativa operativa',
      summary: `${topStationMeta?.name ?? topStation.stationId} lidera el uso relativo frente a ${secondStationMeta?.name ?? secondStation.stationId}.`,
      metricA: `${topStationMeta?.name ?? topStation.stationId}: giro ${formatDecimal(Number(topStation.turnoverScore))} · ${topStationMeta?.bikesAvailable ?? 0}/${topStationMeta?.capacity ?? 0} bicis`,
      metricB: `${secondStationMeta?.name ?? secondStation.stationId}: giro ${formatDecimal(Number(secondStation.turnoverScore))} · ${secondStationMeta?.bikesAvailable ?? 0}/${secondStationMeta?.capacity ?? 0} bicis`,
      delta: `Brecha de actividad ${formatDelta(demandGap)}`,
      href: appRoutes.dashboardStations(),
      note: `Riesgo de disponibilidad: ${formatDecimal(availabilityMap.get(topStation.stationId) ?? 0)} vs ${formatDecimal(availabilityMap.get(secondStation.stationId) ?? 0)} horas problema.`,
    });
  } else {
    currentCards.push(
      buildUnavailableCard(
        'station-vs-station',
        'Estacion vs estacion',
        'Comparativa operativa',
        appRoutes.dashboardStations()
      )
    );
  }

  const topDistrict = districtRows[0] ?? null;
  const bottomDistrict = districtRows[districtRows.length - 1] ?? null;

  if (topDistrict && bottomDistrict && topDistrict.slug !== bottomDistrict.slug) {
    const districtGap =
      bottomDistrict.avgTurnover > 0
        ? (topDistrict.avgTurnover - bottomDistrict.avgTurnover) / bottomDistrict.avgTurnover
        : null;

    currentCards.push({
      id: 'district-vs-district',
      title: 'Barrio vs barrio',
      eyebrow: 'Lectura territorial',
      summary: `${topDistrict.name} concentra la mayor actividad relativa mientras ${bottomDistrict.name} se comporta como el extremo mas calmado.`,
      metricA: `${topDistrict.name}: ${formatDecimal(topDistrict.avgTurnover)} pts · ${topDistrict.stationCount} estaciones`,
      metricB: `${bottomDistrict.name}: ${formatDecimal(bottomDistrict.avgTurnover)} pts · ${bottomDistrict.stationCount} estaciones`,
      delta: `Brecha territorial ${formatDelta(districtGap)}`,
      href: appRoutes.districtLanding(),
      note: `${topDistrict.bikesAvailable} bicis disponibles ahora mismo frente a ${bottomDistrict.bikesAvailable}.`,
    });
  } else {
    currentCards.push(
      buildUnavailableCard(
        'district-vs-district',
        'Barrio vs barrio',
        'Lectura territorial',
        appRoutes.districtLanding()
      )
    );
  }

  const weekdayWeekendProfile = recentConclusions?.payload.weekdayWeekendProfile ?? null;
  const sortedHoursByDemand = [...hourlyProfile].sort(
    (left, right) =>
      Number(left.avgBikesAvailable) - Number(right.avgBikesAvailable) ||
      Number(left.avgOccupancy) - Number(right.avgOccupancy)
  );
  const peakHour = sortedHoursByDemand[0] ?? null;
  const quietHour = sortedHoursByDemand[sortedHoursByDemand.length - 1] ?? null;

  if (weekdayWeekendProfile) {
    currentCards.push({
      id: 'weekday-vs-weekend',
      title: 'Laboral vs fin de semana',
      eyebrow: 'Patron de uso',
      summary:
        weekdayWeekendProfile.dominantPeriod === 'weekend'
          ? 'La red rinde mas en fin de semana que entre semana.'
          : 'La red rinde mas entre semana que en fin de semana.',
      metricA: `Laboral: ${formatDecimal(weekdayWeekendProfile.weekday.avgDemand)} pts/dia · ocupacion ${formatPercent(weekdayWeekendProfile.weekday.avgOccupancy)}`,
      metricB: `Fin de semana: ${formatDecimal(weekdayWeekendProfile.weekend.avgDemand)} pts/dia · ocupacion ${formatPercent(weekdayWeekendProfile.weekend.avgOccupancy)}`,
      delta: `Diferencia relativa ${formatDelta(weekdayWeekendProfile.demandGapRatio)}`,
      href: latestMonth ? appRoutes.reportMonth(latestMonth) : appRoutes.dashboardConclusions(),
      note: `${weekdayWeekendProfile.weekday.daysCount} dias laborables comparados con ${weekdayWeekendProfile.weekend.daysCount} dias de fin de semana.`,
    });
  } else {
    currentCards.push(
      buildUnavailableCard(
        'weekday-vs-weekend',
        'Laboral vs fin de semana',
        'Patron de uso',
        appRoutes.dashboardConclusions()
      )
    );
  }

  if (hourlyProfile.length >= 2) {
    const hourGap =
      peakHour && quietHour && Number(quietHour.avgBikesAvailable) > 0
        ? (Number(quietHour.avgBikesAvailable) - Number(peakHour.avgBikesAvailable)) /
          Number(quietHour.avgBikesAvailable)
        : null;

    currentCards.push({
      id: 'hour-vs-hour',
      title: 'Hora vs hora',
      eyebrow: 'Ritmo intradia',
      summary: `La hora ${peakHour?.hour ?? '--'}:00 concentra el mayor movimiento medio del sistema, frente a la franja mas tranquila.`,
      metricA: `${peakHour?.hour ?? '--'}:00 · ${formatDecimal(Number(peakHour?.avgBikesAvailable ?? 0))} bicis disponibles · ocupacion ${formatPercent(Number(peakHour?.avgOccupancy ?? 0))}`,
      metricB: `${quietHour?.hour ?? '--'}:00 · ${formatDecimal(Number(quietHour?.avgBikesAvailable ?? 0))} bicis disponibles · ocupacion ${formatPercent(Number(quietHour?.avgOccupancy ?? 0))}`,
      delta: `Brecha horaria ${formatDelta(hourGap)}`,
      href: appRoutes.dashboardView('research'),
      note: `${formatInteger(Number(peakHour?.sampleCount ?? 0))} muestras agregadas en la hora pico.`,
    });
  } else {
    currentCards.push(
      buildUnavailableCard(
        'hour-vs-hour',
        'Hora vs hora',
        'Ritmo intradia',
        appRoutes.dashboardView('research')
      )
    );
  }

  const latestMonthlyRow = monthlySeries[monthlySeries.length - 1] ?? null;
  const previousMonthlyRow = monthlySeries[monthlySeries.length - 2] ?? null;

  if (latestMonthlyRow && previousMonthlyRow) {
    const monthDelta =
      Number(previousMonthlyRow.demandScore) > 0
        ? (Number(latestMonthlyRow.demandScore) - Number(previousMonthlyRow.demandScore)) /
          Number(previousMonthlyRow.demandScore)
        : null;

    historicalCards.push({
      id: 'month-vs-month',
      title: 'Mes vs mes',
      eyebrow: 'Cambio mensual',
      summary: `${formatMonthLabel(latestMonthlyRow.monthKey)} se compara con ${formatMonthLabel(previousMonthlyRow.monthKey)} en demanda, ocupacion y estaciones activas.`,
      metricA: `${formatMonthLabel(latestMonthlyRow.monthKey)}: ${formatInteger(Number(latestMonthlyRow.demandScore))} pts · ocupacion ${formatPercent(Number(latestMonthlyRow.avgOccupancy))}`,
      metricB: `${formatMonthLabel(previousMonthlyRow.monthKey)}: ${formatInteger(Number(previousMonthlyRow.demandScore))} pts · ocupacion ${formatPercent(Number(previousMonthlyRow.avgOccupancy))}`,
      delta: `Demanda mensual ${formatDelta(monthDelta)}`,
      href: appRoutes.reports(),
      note: `Estaciones activas ${formatInteger(Number(latestMonthlyRow.activeStations))} vs ${formatInteger(Number(previousMonthlyRow.activeStations))}.`,
    });
  } else {
    historicalCards.push(
      buildUnavailableCard(
        'month-vs-month',
        'Mes vs mes',
        'Cambio mensual',
        appRoutes.reports()
      )
    );
  }

  const yearlyMap = new Map<
    string,
    { year: string; demandScore: number; occupancyValues: number[]; activeStations: number[] }
  >();

  for (const row of monthlySeries) {
    const year = row.monthKey.slice(0, 4);
    const current =
      yearlyMap.get(year) ?? { year, demandScore: 0, occupancyValues: [], activeStations: [] };
    current.demandScore += Number(row.demandScore);
    current.occupancyValues.push(Number(row.avgOccupancy));
    current.activeStations.push(Number(row.activeStations));
    yearlyMap.set(year, current);
  }

  const yearlyRows = Array.from(yearlyMap.values()).sort((left, right) => left.year.localeCompare(right.year));
  const latestYear = yearlyRows[yearlyRows.length - 1] ?? null;
  const previousYear = yearlyRows[yearlyRows.length - 2] ?? null;

  if (latestYear && previousYear) {
    const yearDelta =
      previousYear.demandScore > 0
        ? (latestYear.demandScore - previousYear.demandScore) / previousYear.demandScore
        : null;

    historicalCards.push({
      id: 'year-vs-year',
      title: 'Ano vs ano',
      eyebrow: 'Lectura anual',
      summary: `${latestYear.year} agrega ${formatInteger(latestYear.demandScore)} puntos de demanda frente a ${previousYear.year}.`,
      metricA: `${latestYear.year}: ${formatInteger(latestYear.demandScore)} pts · ocupacion media ${formatPercent(average(latestYear.occupancyValues))}`,
      metricB: `${previousYear.year}: ${formatInteger(previousYear.demandScore)} pts · ocupacion media ${formatPercent(average(previousYear.occupancyValues))}`,
      delta: `Variacion anual ${formatDelta(yearDelta)}`,
      href: appRoutes.reports(),
      note: `Red media de ${formatDecimal(average(latestYear.activeStations) ?? 0)} estaciones activas frente a ${formatDecimal(average(previousYear.activeStations) ?? 0)}.`,
    });
  } else {
    historicalCards.push(
      buildUnavailableCard(
        'year-vs-year',
        'Ano vs ano',
        'Lectura anual',
        appRoutes.reports()
      )
    );
  }

  if (recentDemand.length >= 40) {
    const sortedDemand = [...recentDemand].sort((left, right) => toTimestamp(left.day) - toTimestamp(right.day));
    const last7 = sortedDemand.slice(-7);
    const previous30 = sortedDemand.slice(-37, -7);
    const last7Demand = average(last7.map((row) => Number(row.demandScore)));
    const previous30Demand = average(previous30.map((row) => Number(row.demandScore)));
    const periodDelta =
      last7Demand !== null && previous30Demand && previous30Demand > 0
        ? (last7Demand - previous30Demand) / previous30Demand
        : null;

    historicalCards.push({
      id: 'periods',
      title: 'Periodos',
      eyebrow: 'Ventanas comparables',
      summary: 'La ultima semana se compara con la base movil previa de treinta dias para detectar aceleraciones o frenadas.',
      metricA: `Ultimos 7 dias: ${formatDecimal(last7Demand ?? 0)} pts/dia · ocupacion ${formatPercent(average(last7.map((row) => Number(row.avgOccupancy))))}`,
      metricB: `Base previa 30 dias: ${formatDecimal(previous30Demand ?? 0)} pts/dia · ocupacion ${formatPercent(average(previous30.map((row) => Number(row.avgOccupancy))))}`,
      delta: `Cambio de periodo ${formatDelta(periodDelta)}`,
      href: appRoutes.dashboardConclusions(),
      note: `Cobertura reciente: ${dataset.coverage.totalDays} dias historicos en total.`,
    });
  } else {
    historicalCards.push(
      buildUnavailableCard(
        'periods',
        'Periodos',
        'Ventanas comparables',
        appRoutes.dashboardConclusions()
      )
    );
  }

  const expansionCandidates = monthlySeries
    .map((row, index) => {
      if (index === 0) {
        return null;
      }

      return {
        index,
        monthKey: row.monthKey,
        stationDelta:
          Number(row.activeStations) - Number(monthlySeries[index - 1]?.activeStations ?? 0),
      };
    })
    .filter((candidate): candidate is { index: number; monthKey: string; stationDelta: number } => Boolean(candidate))
    .sort((left, right) => right.stationDelta - left.stationDelta);
  const expansionCandidate = expansionCandidates[0] ?? null;

  if (expansionCandidate && expansionCandidate.stationDelta > 0) {
    const beforeSlice = monthlySeries.slice(Math.max(0, expansionCandidate.index - 2), expansionCandidate.index);
    const afterSlice = monthlySeries.slice(
      expansionCandidate.index,
      Math.min(monthlySeries.length, expansionCandidate.index + 2)
    );
    const beforeDemand = average(beforeSlice.map((row) => Number(row.demandScore)));
    const afterDemand = average(afterSlice.map((row) => Number(row.demandScore)));
    const expansionDelta =
      beforeDemand && beforeDemand > 0 && afterDemand !== null
        ? (afterDemand - beforeDemand) / beforeDemand
        : null;

    historicalCards.push({
      id: 'before-after-expansion',
      title: 'Antes vs despues ampliacion',
      eyebrow: 'Hito detectado',
      summary: `Se detecta la mayor ampliacion proxy en ${formatMonthLabel(expansionCandidate.monthKey)} por un salto de ${formatInteger(expansionCandidate.stationDelta)} estaciones activas.`,
      metricA: `Antes: ${formatDecimal(beforeDemand ?? 0)} pts/mes · ${formatDecimal(average(beforeSlice.map((row) => Number(row.activeStations))) ?? 0)} estaciones medias`,
      metricB: `Despues: ${formatDecimal(afterDemand ?? 0)} pts/mes · ${formatDecimal(average(afterSlice.map((row) => Number(row.activeStations))) ?? 0)} estaciones medias`,
      delta: `Cambio tras ampliacion ${formatDelta(expansionDelta)}`,
      href: appRoutes.reports(),
      note: 'La fecha se infiere por el mayor salto en estaciones activas, no por un calendario externo de hitos.',
    });
  } else {
    historicalCards.push(
      buildUnavailableCard(
        'before-after-expansion',
        'Antes vs despues ampliacion',
        'Hito detectado',
        appRoutes.reports(),
        'Hace falta un salto claro en estaciones activas o un calendario de hitos para fijar el corte.'
      )
    );
  }

  if (recentDemand.length >= 10) {
    const peakDay = [...recentDemand].sort(
      (left, right) => Number(right.demandScore) - Number(left.demandScore)
    )[0];
    const normalDays = recentDemand.filter((row) => row.day !== peakDay.day);
    const normalDemand = average(normalDays.map((row) => Number(row.demandScore)));
    const eventDelta =
      normalDemand && normalDemand > 0
        ? (Number(peakDay.demandScore) - normalDemand) / normalDemand
        : null;

    historicalCards.push({
      id: 'events-vs-normal',
      title: 'Eventos vs normal',
      eyebrow: 'Pico anomalo',
      summary: `El dia ${peakDay.day} marca el mayor pico reciente y se compara con un dia normal medio del mismo tramo.`,
      metricA: `Pico anomalo: ${formatInteger(Number(peakDay.demandScore))} pts · ocupacion ${formatPercent(Number(peakDay.avgOccupancy))}`,
      metricB: `Dia normal: ${formatDecimal(normalDemand ?? 0)} pts · ocupacion ${formatPercent(average(normalDays.map((row) => Number(row.avgOccupancy))))}`,
      delta: `Exceso sobre normal ${formatDelta(eventDelta)}`,
      href: appRoutes.dashboardConclusions(),
      note: 'Esta lectura usa un pico estadistico reciente como proxy de evento; no consume un calendario oficial de eventos.',
    });
  } else {
    historicalCards.push(
      buildUnavailableCard(
        'events-vs-normal',
        'Eventos vs normal',
        'Pico anomalo',
        appRoutes.dashboardConclusions()
      )
    );
  }

  if (latestMonthConclusions?.payload && previousMonthConclusions?.payload) {
    const latestTop = latestMonthConclusions.payload.topStationsByDemand;
    const previousTop = previousMonthConclusions.payload.topStationsByDemand;
    const latestLeader = latestTop[0] ?? null;
    const previousLeader = previousTop[0] ?? null;
    const overlap = latestTop.filter((row) =>
      previousTop.some((candidate) => candidate.stationId === row.stationId)
    ).length;

    changeCards.push({
      id: 'ranking-changes',
      title: 'Ranking cambios',
      eyebrow: 'Movimiento de lideres',
      summary:
        latestLeader && previousLeader
          ? latestLeader.stationId === previousLeader.stationId
            ? `${latestLeader.stationName} mantiene el liderato mensual por demanda media.`
            : `El lider cambia de ${previousLeader.stationName} a ${latestLeader.stationName}.`
          : 'No hay suficiente ranking mensual para medir cambios.',
      metricA: latestLeader
        ? `${formatMonthLabel(latestMonthConclusions.payload.selectedMonth ?? latestMonth ?? '')}: ${latestLeader.stationName} · ${formatDecimal(latestLeader.avgDemand)} pts`
        : 'Sin lider mensual reciente',
      metricB: previousLeader
        ? `${formatMonthLabel(previousMonthConclusions.payload.selectedMonth ?? previousMonth ?? '')}: ${previousLeader.stationName} · ${formatDecimal(previousLeader.avgDemand)} pts`
        : 'Sin lider mensual previo',
      delta: `${overlap}/5 estaciones coinciden entre ambos top 5`,
      href:
        latestMonthConclusions.payload.selectedMonth
          ? appRoutes.reportMonth(latestMonthConclusions.payload.selectedMonth)
          : appRoutes.reports(),
      note: 'La comparativa usa el top de estaciones por demanda media entre meses consecutivos.',
    });
  } else {
    changeCards.push(
      buildUnavailableCard(
        'ranking-changes',
        'Ranking cambios',
        'Movimiento de lideres',
        appRoutes.reports()
      )
    );
  }

  if (recentConclusions?.payload) {
    changeCards.push({
      id: 'demand-changes',
      title: 'Demanda cambios',
      eyebrow: 'Pulso reciente',
      summary: 'Cambio de demanda comparando la ultima ventana de siete dias frente a la anterior.',
      metricA: `Ultimos 7 dias: ${formatInteger(recentConclusions.payload.metrics.demandLast7Days)} pts`,
      metricB: `7 dias previos: ${formatInteger(recentConclusions.payload.metrics.demandPrevious7Days)} pts`,
      delta: `Cambio de demanda ${formatDelta(recentConclusions.payload.metrics.demandDeltaRatio)}`,
      href: appRoutes.dashboardConclusions(),
      note: `Ultima cobertura util ${recentConclusions.payload.sourceLastDay ?? 'sin fecha'}.`,
    });
  } else {
    changeCards.push(
      buildUnavailableCard(
        'demand-changes',
        'Demanda cambios',
        'Pulso reciente',
        appRoutes.dashboardConclusions()
      )
    );
  }

  if (historyRows.length >= 14) {
    const last7 = historyRows.slice(-7);
    const previous7 = historyRows.slice(-14, -7);
    const last7Balance = average(last7.map((row) => Number(row.balanceIndex)));
    const previous7Balance = average(previous7.map((row) => Number(row.balanceIndex)));
    const balanceDelta =
      last7Balance !== null && previous7Balance && previous7Balance > 0
        ? (last7Balance - previous7Balance) / previous7Balance
        : null;

    changeCards.push({
      id: 'balance-changes',
      title: 'Balance cambios',
      eyebrow: 'Equilibrio del sistema',
      summary: 'Evolucion del indice de equilibrio comparando la ultima semana con la anterior.',
      metricA: `Ultimos 7 dias: ${formatDecimal(last7Balance ?? 0, 2)} indice medio`,
      metricB: `Semana previa: ${formatDecimal(previous7Balance ?? 0, 2)} indice medio`,
      delta: `Cambio de balance ${formatDelta(balanceDelta)}`,
      href: appRoutes.dashboardView('data'),
      note: `Series con ${formatInteger(last7.reduce((sum, row) => sum + Number(row.sampleCount), 0))} muestras recientes.`,
    });
  } else {
    changeCards.push(
      buildUnavailableCard(
        'balance-changes',
        'Balance cambios',
        'Equilibrio del sistema',
        appRoutes.dashboardView('data')
      )
    );
  }

  const sortedRecentDemand = [...recentDemand].sort(
    (left, right) => toTimestamp(left.day) - toTimestamp(right.day)
  );

  const periodOptions: InteractiveComparisonOption[] = [];
  const appendPeriodOption = (
    id: string,
    label: string,
    rows: typeof sortedRecentDemand,
    notePrefix: string
  ) => {
    if (rows.length === 0) {
      return;
    }

    const demandAverage = average(rows.map((row) => Number(row.demandScore)));
    const occupancyAverage = average(rows.map((row) => Number(row.avgOccupancy)));
    const totalSamples = rows.reduce((sum, row) => sum + Number(row.sampleCount), 0);
    const rangeLabel =
      rows.length > 1 ? `${rows[0]?.day ?? ''} -> ${rows[rows.length - 1]?.day ?? ''}` : rows[0]?.day ?? '';

    periodOptions.push({
      id,
      label,
      href: appRoutes.dashboardConclusions(),
      primaryLabel: 'Demanda media',
      primaryValue: demandAverage,
      primaryDisplay: `${formatDecimal(demandAverage ?? 0)} pts/dia`,
      secondaryLabel: 'Ocupacion media',
      secondaryDisplay: formatPercent(occupancyAverage),
      tertiaryLabel: 'Cobertura',
      tertiaryDisplay: `${formatInteger(totalSamples)} muestras`,
      note: `${notePrefix}: ${rangeLabel}`,
    });
  };

  appendPeriodOption('last-7d', 'Ultimos 7 dias', sortedRecentDemand.slice(-7), 'Ventana reciente');
  appendPeriodOption(
    'previous-7d',
    '7 dias previos',
    sortedRecentDemand.slice(-14, -7),
    'Ventana previa'
  );
  appendPeriodOption('last-30d', 'Ultimos 30 dias', sortedRecentDemand.slice(-30), 'Ventana reciente');
  appendPeriodOption(
    'previous-30d',
    '30 dias previos',
    sortedRecentDemand.slice(-60, -30),
    'Ventana previa'
  );

  const interactiveDimensions = [
    buildInteractiveDimension({
      id: 'stations',
      label: 'Estaciones',
      description:
        'Compara manualmente dos estaciones concretas por giro, disponibilidad actual y horas problema.',
      options: [...stationsResponse.stations]
        .sort((left, right) => left.name.localeCompare(right.name, 'es'))
        .map((station) => ({
          id: station.id,
          label: `${station.name} (${station.id})`,
          href: appRoutes.dashboardStation(station.id),
          primaryLabel: 'Giro',
          primaryValue: turnoverMap.get(station.id) ?? null,
          primaryDisplay: `${formatDecimal(turnoverMap.get(station.id) ?? 0)} pts`,
          secondaryLabel: 'Snapshot',
          secondaryDisplay: `${station.bikesAvailable}/${station.capacity} bicis`,
          tertiaryLabel: 'Horas problema',
          tertiaryDisplay: `${formatDecimal(availabilityMap.get(station.id) ?? 0)} h`,
          note: `Ultima muestra ${station.recordedAt ? station.recordedAt.slice(0, 16).replace('T', ' ') : 'sin fecha'}`,
        })),
      defaultLeftId: topStation?.stationId ?? null,
      defaultRightId: secondStation?.stationId ?? null,
    }),
    buildInteractiveDimension({
      id: 'districts',
      label: 'Barrios',
      description:
        'Enfrenta dos barrios con datos reales de estaciones, disponibilidad y giro medio.',
      options: [...districtRows]
        .sort((left, right) => left.name.localeCompare(right.name, 'es'))
        .map((district) => ({
          id: district.slug,
          label: district.name,
          href: appRoutes.districtDetail(district.slug),
          primaryLabel: 'Giro medio',
          primaryValue: district.avgTurnover,
          primaryDisplay: `${formatDecimal(district.avgTurnover)} pts`,
          secondaryLabel: 'Estaciones',
          secondaryDisplay: `${formatInteger(district.stationCount)} estaciones`,
          tertiaryLabel: 'Bicis disponibles',
          tertiaryDisplay: `${formatInteger(district.bikesAvailable)} bicis`,
          note: `Riesgo medio ${formatDecimal(district.avgAvailabilityRisk)} h problema`,
        })),
      defaultLeftId: topDistrict?.slug ?? null,
      defaultRightId: bottomDistrict?.slug ?? null,
    }),
    buildInteractiveDimension({
      id: 'months',
      label: 'Meses',
      description:
        'Permite elegir dos meses concretos del historico publicado y comparar demanda, ocupacion y red activa.',
      options: [...monthlySeries]
        .sort((left, right) => right.monthKey.localeCompare(left.monthKey, 'es'))
        .map((row) => ({
          id: row.monthKey,
          label: formatMonthLabel(row.monthKey),
          href: appRoutes.reportMonth(row.monthKey),
          primaryLabel: 'Demanda mensual',
          primaryValue: Number(row.demandScore),
          primaryDisplay: `${formatInteger(Number(row.demandScore))} pts`,
          secondaryLabel: 'Ocupacion media',
          secondaryDisplay: formatPercent(Number(row.avgOccupancy)),
          tertiaryLabel: 'Estaciones activas',
          tertiaryDisplay: `${formatInteger(Number(row.activeStations))} estaciones`,
          note: `${formatInteger(Number(row.sampleCount))} muestras agregadas`,
        })),
      defaultLeftId: latestMonthlyRow?.monthKey ?? null,
      defaultRightId: previousMonthlyRow?.monthKey ?? null,
    }),
    buildInteractiveDimension({
      id: 'years',
      label: 'Anos',
      description:
        'Compara dos anos completos agregando los meses disponibles para cada periodo.',
      options: [...yearlyRows]
        .sort((left, right) => right.year.localeCompare(left.year, 'es'))
        .map((row) => ({
          id: row.year,
          label: row.year,
          href: appRoutes.reports(),
          primaryLabel: 'Demanda anual',
          primaryValue: row.demandScore,
          primaryDisplay: `${formatInteger(row.demandScore)} pts`,
          secondaryLabel: 'Ocupacion media',
          secondaryDisplay: formatPercent(average(row.occupancyValues)),
          tertiaryLabel: 'Estaciones activas medias',
          tertiaryDisplay: `${formatDecimal(average(row.activeStations) ?? 0)} estaciones`,
          note: `${row.activeStations.length} meses con datos`,
        })),
      defaultLeftId: latestYear?.year ?? null,
      defaultRightId: previousYear?.year ?? null,
    }),
    buildInteractiveDimension({
      id: 'hours',
      label: 'Horas',
      description:
        'Selecciona dos horas del dia para comparar ritmo medio, ocupacion y muestras acumuladas.',
      options: [...hourlyProfile]
        .sort((left, right) => Number(left.hour) - Number(right.hour))
        .map((row) => ({
          id: String(row.hour),
          label: `${row.hour}:00`,
          href: appRoutes.dashboardView('research'),
          primaryLabel: 'Bicis disponibles',
          primaryValue: Number(row.avgBikesAvailable),
          primaryDisplay: `${formatDecimal(Number(row.avgBikesAvailable))} bicis`,
          secondaryLabel: 'Ocupacion media',
          secondaryDisplay: formatPercent(Number(row.avgOccupancy)),
          tertiaryLabel: 'Muestras',
          tertiaryDisplay: `${formatInteger(Number(row.sampleCount))} muestras`,
        })),
      defaultLeftId: peakHour ? String(peakHour.hour) : null,
      defaultRightId: quietHour ? String(quietHour.hour) : null,
    }),
    buildInteractiveDimension({
      id: 'periods',
      label: 'Periodos',
      description:
        'Compara ventanas temporales recientes sin salir del comparador para detectar aceleracion o frenada.',
      options: periodOptions,
      defaultLeftId: periodOptions.find((option) => option.id === 'last-7d')?.id ?? null,
      defaultRightId: periodOptions.find((option) => option.id === 'previous-30d')?.id ?? null,
    }),
  ].filter((dimension): dimension is InteractiveComparisonDimension => Boolean(dimension));

  return {
    latestMonth,
    generatedAt: nowIso,
    dataState: combineDataStates([
      dataset.dataState,
      stationsResponse.dataState,
      turnoverResponse.dataState,
      availabilityResponse.dataState,
    ]),
    interactive: {
      defaultDimensionId: interactiveDimensions[0]?.id ?? null,
      dimensions: interactiveDimensions,
    },
    sections: [
      {
        id: 'current',
        title: 'Comparativas operativas',
        description:
          'Lecturas directas para comparar estaciones, barrios, franjas horarias y comportamiento laboral frente al fin de semana.',
        cards: currentCards,
      },
      {
        id: 'historical',
        title: 'Comparativas historicas',
        description:
          'Cortes temporales para comparar meses, anos, periodos y grandes cambios en la red o en la demanda.',
        cards: historicalCards,
      },
      {
        id: 'changes',
        title: 'Cambios detectados',
        description:
          'Deltas recientes de rankings, demanda y balance para entender si el sistema mejora, empeora o gira de lideres.',
        cards: changeCards,
      },
    ],
  };
}

/**
 * Muchas lecturas en paralelo (API cacheada, Prisma, conclusiones diarias).
 * Un tope de pocos segundos devolvía siempre el fallback vacío en producción (p. ej. cold start / DB remota).
 */
export async function getComparisonHubDataWithTimeout(
  timeoutMs = 35_000
): Promise<ComparisonHubData> {
  const nowIso = new Date().toISOString();

  return Promise.race([
    getComparisonHubData(),
    new Promise<ComparisonHubData>((resolve) => {
      setTimeout(() => {
        resolve(buildFallbackComparisonHubData(nowIso));
      }, timeoutMs);
    }),
  ]);
}
