import { deleteCachedJson, withCache } from '@/lib/cache/cache';
import { buildStationDistrictMap, type DistrictCollection } from '@/lib/districts';
import { formatDateLabel, formatPercent, formatRatioMagnitude, roundTo } from '@/lib/format';
import {
  createLiveMonthlyReportSources,
  type MonthlyReportSources,
} from '@/lib/monthly-report-sources';
import { formatMonthName, isValidMonthKey, monthDayCount, previousMonthKey } from '@/lib/months';
import { logger } from '@/lib/logger';
import {
  buildMonthlyTemporalComparison,
  buildPeriodCoverage,
} from '@/lib/temporal-comparison';
import { buildReportBalance } from '@/lib/report-balance';
import { captureWarningWithContext } from '@/lib/sentry-reporting';
import { getServiceCauseLabel } from '@/lib/service-calendar';
import { detectServiceAnomalies, type ServiceAnomaly } from '@/lib/service-anomalies';
import { buildFallbackMonthlyReport } from '@/lib/shared-data-fallbacks';
import { median } from '@/lib/stats';
import {
  EMPTY_SEASONALITY,
  EMPTY_WEEKDAY_WEEKEND,
  type DistrictMonthSummary,
  type MonthlyCriticalEpisodeRow,
  type MonthlyNetworkHeatmapRow,
  type MonthlyRedistribution,
  type MonthlyReport,
  type MonthlyReportComparison,
  type MonthlyReportHeadline,
  type MonthlyReportTrends,
  type MonthlySeasonality,
  type MonthlyStationMetricRow,
  type StationEpisodeSpot,
  type StationFrictionSpot,
  type StationMorningSpot,
  type StationRedistributionSpot,
} from '@/lib/monthly-report-types';

export type {
  DistrictMonthSummary,
  MonthlyRedistribution,
  MonthlyReport,
  MonthlyReportHeadline,
  MonthlyReportTrends,
  MonthlySeasonality,
  StationRedistributionSpot,
} from '@/lib/monthly-report-types';

const REPORT_CACHE_TTL_LIVE_SECONDS = 600;
/**
 * Bump when the assembled payload changes shape or a data backfill must
 * invalidate every persisted month report at once.
 */
const REPORT_CACHE_VERSION = 'v1';
const TREND_THRESHOLD = 0.03;
const MAX_RANKING = 6;

const WEEKDAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function computeTrend(ratio: number | null): MonthlyReportComparison['trend'] {
  if (ratio === null || !Number.isFinite(ratio)) {
    return 'sin-datos';
  }

  if (ratio > TREND_THRESHOLD) {
    return 'mejora';
  }

  if (ratio < -TREND_THRESHOLD) {
    return 'empeora';
  }

  return 'estable';
}

function buildDefaultSummary(headline: MonthlyReportHeadline, monthKey: string): string {
  return `En ${formatMonthName(monthKey)} estimamos ${Math.round(headline.demandScore)} puntos de movimiento, con una ocupación media del ${Math.round(
    headline.avgOccupancy * 100
  )}% y ${Math.round(headline.activeStations)} estaciones activas.`;
}

function joinWithY(items: string[]): string {
  if (items.length <= 1) {
    return items[0] ?? '';
  }

  if (items.length === 2) {
    return `${items[0]} y ${items[1]}`;
  }

  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

/**
 * Lee estacionalidad comparando el mes con el mismo mes calendario de años
 * anteriores de la serie; si no hay, cae a la media de toda la serie.
 */
function computeSeasonality(
  monthly: MonthlyReportTrends['monthly'],
  monthKey: string
): MonthlySeasonality {
  const monthSuffix = monthKey.slice(5, 7);
  const current = monthly.find((row) => row.monthKey === monthKey);
  const previousYears = monthly.filter(
    (row) => row.monthKey < monthKey && row.monthKey.slice(5, 7) === monthSuffix
  );
  const seriesAvg =
    monthly.length > 0
      ? monthly.reduce((sum, row) => sum + row.demandScore, 0) / monthly.length
      : 0;
  const previousYearsAvg =
    previousYears.length > 0
      ? previousYears.reduce((sum, row) => sum + row.demandScore, 0) / previousYears.length
      : null;

  const base = previousYearsAvg ?? (seriesAvg > 0 ? seriesAvg : null);
  const ratio = current && base && base > 0 ? (current.demandScore - base) / base : null;
  const ratioVsSeries = current && seriesAvg > 0 ? (current.demandScore - seriesAvg) / seriesAvg : null;

  if (ratio === null) {
    return {
      ...EMPTY_SEASONALITY,
      sameMonthYears: previousYears.length,
      seriesAvgDemand: Math.round(seriesAvg),
      ratioVsSeries: ratioVsSeries === null ? null : roundTo(ratioVsSeries, 4),
    };
  }

  const direction = ratio >= 0 ? 'por encima' : 'por debajo';
  const label =
    previousYearsAvg !== null
      ? `En ${formatMonthName(monthKey)} de años anteriores el movimiento medio fue ${Math.round(
          previousYearsAvg
        )} puntos; este mes está un ${formatRatioMagnitude(ratio)} ${direction}.`
      : `Este mes está un ${formatRatioMagnitude(ratio)} ${direction} de la media de la serie.`;

  return {
    sameMonthYears: previousYears.length,
    previousYearsAvgDemand: previousYearsAvg === null ? null : Math.round(previousYearsAvg),
    ratioVsPreviousYears: previousYearsAvg === null ? null : roundTo(ratio, 4),
    seriesAvgDemand: Math.round(seriesAvg),
    ratioVsSeries: ratioVsSeries === null ? null : roundTo(ratioVsSeries, 4),
    label,
  };
}

/**
 * Conclusiones concretas del mes: la franja dia-hora de mayor tension, el barrio
 * mas castigado y el dia mas atipico. Datos ya calculados, en lenguaje natural.
 */
function buildPracticalConclusions(input: {
  heatmap: MonthlyNetworkHeatmapRow[];
  undersupplied: DistrictMonthSummary[];
  anomalies: ServiceAnomaly[];
}): string[] {
  const conclusions: string[] = [];
  const validCells = input.heatmap.filter(
    (cell) => Number.isFinite(cell.occupancyAvg) && cell.sampleCount > 0
  );

  if (validCells.length > 0) {
    const peak = validCells.reduce((best, cell) =>
      cell.occupancyAvg > best.occupancyAvg ? cell : best
    );
    const threshold = peak.occupancyAvg * 0.9;
    const busyDays = Array.from(
      new Set(
        validCells
          .filter((cell) => cell.hour === peak.hour && cell.occupancyAvg >= threshold)
          .map((cell) => WEEKDAY_NAMES[cell.dayOfWeek] ?? '')
          .filter(Boolean)
      )
    );
    const nextHour = (peak.hour + 1) % 24;
    const range = `${String(peak.hour).padStart(2, '0')}:00–${String(nextHour).padStart(2, '0')}:00`;

    if (busyDays.length > 0 && busyDays.length <= 3) {
      conclusions.push(
        `Los ${joinWithY(busyDays)} entre las ${range} es cuando la red está más llena (${formatPercent(
          peak.occupancyAvg
        )} de ocupación media).`
      );
    } else {
      conclusions.push(
        `La franja de ${range} es la de mayor ocupación media de la red (${formatPercent(
          peak.occupancyAvg
        )}).`
      );
    }
  }

  const hardestDistrict = input.undersupplied[0];

  if (hardestDistrict) {
    conclusions.push(
      `El barrio con más tensión es ${hardestDistrict.district}: ${formatPercent(
        hardestDistrict.frictionRate
      )} de las horas observadas tuvo estaciones vacías o sin huecos.`
    );
  }

  const biggestAnomaly = input.anomalies[0];

  if (biggestAnomaly) {
    const cause = biggestAnomaly.cause
      ? `${getServiceCauseLabel(biggestAnomaly.cause.kind)} (${biggestAnomaly.cause.label})`
      : 'sin causa identificada';
    conclusions.push(
      `El día más atípico fue el ${formatDateLabel(biggestAnomaly.day)}, con ${
        biggestAnomaly.direction === 'up' ? 'más' : 'menos'
      } uso del habitual · ${cause}.`
    );
  }

  return conclusions;
}

/**
 * Proxy mensual de eficacia de la redistribucion. No hay registro de movimientos
 * de operarios, asi que medimos el efecto: estaciones con rotacion alta (por
 * encima de la mediana) que siguen acumulando horas sin bicis o sin anclajes.
 */
function buildRedistribution(
  stationMetrics: MonthlyStationMetricRow[],
  stationNameById: Map<string, string>,
  stationDistrictMap: Map<string, string>
): MonthlyRedistribution {
  const withHours = stationMetrics.filter((metric) => metric.totalHours > 0);
  const emptyHours = withHours.reduce((sum, metric) => sum + metric.emptyHours, 0);
  const fullHours = withHours.reduce((sum, metric) => sum + metric.fullHours, 0);
  const totalHours = withHours.reduce((sum, metric) => sum + metric.totalHours, 0);
  const rotation = withHours.reduce((sum, metric) => sum + metric.demandScore, 0);
  const rotationMedian = median(withHours.map((metric) => metric.demandScore));

  const ineffectiveStations: StationRedistributionSpot[] = withHours
    .filter(
      (metric) =>
        metric.demandScore >= rotationMedian && metric.emptyHours + metric.fullHours > 0
    )
    .map((metric) => ({
      stationId: metric.stationId,
      stationName: stationNameById.get(metric.stationId) ?? metric.stationId,
      district: stationDistrictMap.get(metric.stationId) ?? null,
      rotation: Math.round(metric.demandScore),
      frictionHours: metric.emptyHours + metric.fullHours,
      frictionRate: roundTo((metric.emptyHours + metric.fullHours) / metric.totalHours, 4),
    }))
    .sort(
      (a, b) => b.frictionHours - a.frictionHours || b.frictionRate - a.frictionRate
    )
    .slice(0, MAX_RANKING);

  return {
    networkFrictionRate: totalHours > 0 ? roundTo((emptyHours + fullHours) / totalHours, 4) : 0,
    emptyHours,
    fullHours,
    rotation: Math.round(rotation),
    ineffectiveStations,
    note: 'La base de datos no registra los movimientos de los operarios; medimos la redistribución por su efecto: cuánto movimiento hay en estaciones que siguen acumulando horas sin servicio.',
  };
}

function buildDistrictSummaries(
  stationMetrics: MonthlyStationMetricRow[],
  stations: Array<{ id: string; lat: number; lon: number }>,
  districts: DistrictCollection | null
): DistrictMonthSummary[] {
  if (!districts || stationMetrics.length === 0) {
    return [];
  }

  const stationDistrictMap = buildStationDistrictMap(stations, districts);
  const accumulator = new Map<
    string,
    {
      demandScore: number;
      occupancyWeighted: number;
      totalHours: number;
      emptyHours: number;
      fullHours: number;
      stations: Set<string>;
    }
  >();

  for (const metric of stationMetrics) {
    const district = stationDistrictMap.get(metric.stationId);

    if (!district) {
      continue;
    }

    const entry = accumulator.get(district) ?? {
      demandScore: 0,
      occupancyWeighted: 0,
      totalHours: 0,
      emptyHours: 0,
      fullHours: 0,
      stations: new Set<string>(),
    };

    entry.demandScore += metric.demandScore;
    entry.occupancyWeighted += metric.avgOccupancy * metric.totalHours;
    entry.totalHours += metric.totalHours;
    entry.emptyHours += metric.emptyHours;
    entry.fullHours += metric.fullHours;
    entry.stations.add(metric.stationId);
    accumulator.set(district, entry);
  }

  return Array.from(accumulator.entries()).map(([district, entry]) => ({
    district,
    demandScore: Math.round(entry.demandScore),
    avgOccupancy: entry.totalHours > 0 ? roundTo(entry.occupancyWeighted / entry.totalHours, 4) : 0,
    stations: entry.stations.size,
    emptyHours: entry.emptyHours,
    fullHours: entry.fullHours,
    totalHours: entry.totalHours,
    frictionRate:
      entry.totalHours > 0
        ? roundTo((entry.emptyHours + entry.fullHours) / entry.totalHours, 4)
        : 0,
  }));
}

async function assembleMonthlyReport(
  monthKey: string,
  nowIso: string,
  sources: MonthlyReportSources
): Promise<MonthlyReport> {
  const referenceMonthKey = previousMonthKey(monthKey);
  const daysInMonth = monthDayCount(monthKey);

  // Si la serie mensual falla no podemos saber si el mes tiene informe: lo
  // tratamos como error (no como "sin datos") para no cachear un noindex falso.
  let monthlySeriesFailed = false;
  const monthlySeriesPromise = sources.loadMonthlySeries().catch((error) => {
    monthlySeriesFailed = true;
    captureWarningWithContext('Monthly demand series unavailable.', {
      area: 'reports.month',
      operation: 'fetchCachedMonthlyDemandCurve',
      dedupeKey: `reports.month.series.${monthKey}`,
      extra: { reason: String(error) },
    });
    return [];
  });

  const [
    monthlySeries,
    dailyCurrent,
    dailyReference,
    hourlyProfile,
    conclusions,
    stationMetrics,
    episodes,
    heatmap,
    stations,
    districts,
  ] = await Promise.all([
    monthlySeriesPromise,
    sources.loadDailyCurve(daysInMonth, monthKey).catch(() => []),
    referenceMonthKey
      ? sources.loadDailyCurve(monthDayCount(referenceMonthKey), referenceMonthKey).catch(() => [])
      : Promise.resolve([]),
    sources.loadHourlyProfile(daysInMonth, monthKey).catch(() => []),
    sources.loadConclusions(monthKey).catch((error) => {
      captureWarningWithContext('Monthly report conclusions unavailable.', {
        area: 'reports.month',
        operation: 'getDailyMobilityConclusions',
        dedupeKey: `reports.month.conclusions.${monthKey}`,
        extra: { reason: String(error) },
      });
      return null;
    }),
    sources.loadStationMetrics(monthKey).catch(() => []),
    sources.loadEpisodes(monthKey).catch(() => ({})),
    sources.loadHeatmap(monthKey).catch(() => []),
    sources.loadStations().catch(() => []),
    sources.loadDistricts().catch(() => null),
  ]);

  if (monthlySeriesFailed) {
    throw new Error('La serie mensual no está disponible.');
  }

  const monthRow = monthlySeries.find((row) => row.monthKey === monthKey) ?? null;
  const referenceRow = referenceMonthKey
    ? monthlySeries.find((row) => row.monthKey === referenceMonthKey) ?? null
    : null;

  const toTemporalRow = (row: { day: string; demandScore: number; sampleCount: number }) => ({
    day: row.day,
    demandScore: Number(row.demandScore),
    sampleCount: Number(row.sampleCount),
  });

  const coverage = buildPeriodCoverage(monthKey, dailyCurrent.map(toTemporalRow), nowIso);
  const compared = buildMonthlyTemporalComparison({
    monthKey,
    referenceMonthKey,
    rows: [...dailyReference, ...dailyCurrent].map(toTemporalRow),
    nowIso,
  });

  const demandDeltaRatio = compared.normalizedDemandRatio;
  const occupancyDeltaRatio =
    monthRow && referenceRow && referenceRow.avgOccupancy > 0
      ? (monthRow.avgOccupancy - referenceRow.avgOccupancy) / referenceRow.avgOccupancy
      : null;

  const comparison: MonthlyReportComparison = {
    isComparable: compared.isComparable,
    periodLabel: compared.periodLabel,
    reason: compared.reason,
    normalizedDemandRatio: demandDeltaRatio === null ? null : roundTo(demandDeltaRatio, 4),
    trend: computeTrend(demandDeltaRatio),
    previousMonthKey: referenceMonthKey,
  };

  const topStations = conclusions?.payload.topStationsByDemand ?? [];

  const headline: MonthlyReportHeadline = {
    demandScore: monthRow?.demandScore ?? 0,
    avgOccupancy: monthRow?.avgOccupancy ?? 0,
    activeStations:
      monthRow?.activeStations ?? new Set(stationMetrics.map((row) => row.stationId)).size,
    sampleCount: monthRow?.sampleCount ?? 0,
    demandDeltaRatio: demandDeltaRatio === null ? null : roundTo(demandDeltaRatio, 4),
    occupancyDeltaRatio: occupancyDeltaRatio === null ? null : roundTo(occupancyDeltaRatio, 4),
    peakHour: conclusions?.payload.peakDemandHours[0]?.hour ?? null,
    coveredDays: coverage.coveredDays,
    expectedDays: coverage.expectedDays,
  };

  const stationCoords = stations.map((station) => ({ id: station.id, lat: station.lat, lon: station.lon }));
  const stationNameById = new Map(stations.map((station) => [station.id, station.name]));
  const stationDistrictMap = districts
    ? buildStationDistrictMap(stationCoords, districts)
    : new Map<string, string>();

  const districtSummaries = buildDistrictSummaries(stationMetrics, stationCoords, districts);
  const mostActive = [...districtSummaries].sort((a, b) => b.demandScore - a.demandScore).slice(0, MAX_RANKING);
  const leastActive = [...districtSummaries]
    .filter((district) => district.stations > 0)
    .sort((a, b) => a.demandScore - b.demandScore || a.district.localeCompare(b.district, 'es'))
    .slice(0, MAX_RANKING);
  const undersupplied = [...districtSummaries]
    .filter((district) => district.frictionRate > 0)
    .sort(
      (a, b) =>
        b.frictionRate - a.frictionRate ||
        b.emptyHours + b.fullHours - (a.emptyHours + a.fullHours)
    )
    .slice(0, MAX_RANKING);

  const worstFriction: StationFrictionSpot[] = stationMetrics
    .filter((metric) => metric.totalHours > 0)
    .map((metric) => ({
      stationId: metric.stationId,
      stationName: stationNameById.get(metric.stationId) ?? metric.stationId,
      district: stationDistrictMap.get(metric.stationId) ?? null,
      emptyHours: metric.emptyHours,
      fullHours: metric.fullHours,
      totalHours: metric.totalHours,
      frictionHours: metric.emptyHours + metric.fullHours,
      frictionRate: roundTo((metric.emptyHours + metric.fullHours) / metric.totalHours, 4),
    }))
    .sort((a, b) => b.frictionHours - a.frictionHours || b.frictionRate - a.frictionRate)
    .slice(0, MAX_RANKING);

  const worstMorning: StationMorningSpot[] = stationMetrics
    .filter(
      (metric) =>
        metric.morningHours > 0 && metric.morningEmptyHours + metric.morningFullHours > 0
    )
    .map((metric) => {
      const morningFrictionHours = metric.morningEmptyHours + metric.morningFullHours;

      return {
        stationId: metric.stationId,
        stationName: stationNameById.get(metric.stationId) ?? metric.stationId,
        district: stationDistrictMap.get(metric.stationId) ?? null,
        morningEmptyHours: metric.morningEmptyHours,
        morningFullHours: metric.morningFullHours,
        morningHours: metric.morningHours,
        morningEmptyRate: roundTo(metric.morningEmptyHours / metric.morningHours, 4),
        morningFullRate: roundTo(metric.morningFullHours / metric.morningHours, 4),
        morningFrictionRate: roundTo(morningFrictionHours / metric.morningHours, 4),
      };
    })
    .sort(
      (a, b) =>
        b.morningFrictionRate - a.morningFrictionRate ||
        b.morningEmptyHours + b.morningFullHours - (a.morningEmptyHours + a.morningFullHours)
    )
    .slice(0, MAX_RANKING);

  const longestEpisodes: StationEpisodeSpot[] = Object.values(episodes)
    .filter((entry: MonthlyCriticalEpisodeRow) => entry.episodeCount > 0)
    .map((entry: MonthlyCriticalEpisodeRow) => ({
      stationId: entry.stationId,
      stationName: stationNameById.get(entry.stationId) ?? entry.stationId,
      district: stationDistrictMap.get(entry.stationId) ?? null,
      avgEmptyEpisodeMinutes: Math.round(entry.avgEmptyEpisodeMinutes),
      avgFullEpisodeMinutes: Math.round(entry.avgFullEpisodeMinutes),
      maxEmptyEpisodeMinutes: Math.round(entry.maxEmptyEpisodeMinutes),
      maxFullEpisodeMinutes: Math.round(entry.maxFullEpisodeMinutes),
      episodeCount: entry.episodeCount,
    }))
    .sort(
      (a, b) =>
        b.maxEmptyEpisodeMinutes +
          b.maxFullEpisodeMinutes -
          (a.maxEmptyEpisodeMinutes + a.maxFullEpisodeMinutes) || b.episodeCount - a.episodeCount
    )
    .slice(0, MAX_RANKING);

  const anomalies = detectServiceAnomalies(
    dailyCurrent.map((row) => ({
      day: row.day,
      demandScore: Number(row.demandScore),
      sampleCount: Number(row.sampleCount),
    }))
  );

  const summary = conclusions?.payload.summary ?? buildDefaultSummary(headline, monthKey);

  const monthlyTrends: MonthlyReportTrends['monthly'] = monthlySeries.map((row) => ({
    monthKey: row.monthKey,
    demandScore: row.demandScore,
    avgOccupancy: row.avgOccupancy,
    activeStations: row.activeStations,
    sampleCount: row.sampleCount,
  }));

  return {
    monthKey,
    generatedAt: nowIso,
    hasReport: Boolean(monthRow),
    coverage,
    comparison,
    balance: buildReportBalance({ comparison, previousMonthKey: referenceMonthKey }),
    headline,
    summary,
    highlights: conclusions?.payload.highlights ?? [],
    recommendations: conclusions?.payload.recommendations ?? [],
    monthlyConclusions: buildPracticalConclusions({ heatmap, undersupplied, anomalies }),
    peakDemandHours: conclusions?.payload.peakDemandHours ?? [],
    weekdayWeekendProfile: conclusions?.payload.weekdayWeekendProfile ?? EMPTY_WEEKDAY_WEEKEND,
    trends: {
      monthly: monthlyTrends,
      daily: dailyCurrent.map((row) => ({
        day: row.day,
        demandScore: Number(row.demandScore),
        avgOccupancy: Number(row.avgOccupancy),
        sampleCount: Number(row.sampleCount),
      })),
      hourly: hourlyProfile.map((row) => ({
        hour: row.hour,
        avgOccupancy: row.avgOccupancy,
        avgBikesAvailable: row.avgBikesAvailable,
        sampleCount: row.sampleCount,
      })),
    },
    seasonality: computeSeasonality(monthlyTrends, monthKey),
    districts: { mostActive, leastActive, undersupplied },
    heatmap,
    problemSpots: { worstFriction, worstMorning, longestEpisodes },
    redistribution: buildRedistribution(stationMetrics, stationNameById, stationDistrictMap),
    topStations,
    leastUsedStations: conclusions?.payload.leastUsedStations ?? [],
    anomalies,
  };
}

function reportCacheKey(monthKey: string): string {
  return `reports:monthly:${REPORT_CACHE_VERSION}:${monthKey}`;
}

/**
 * Un mes cerrado es inmutable a efectos del informe: se compone una vez y se
 * persiste sin caducidad. El mes en curso sigue con TTL corto para reflejar la
 * cobertura parcial.
 */
export function isClosedReportMonth(monthKey: string, nowIso: string): boolean {
  return monthKey < nowIso.slice(0, 7);
}

/**
 * Fuerza el recalculo de un mes persistido (p. ej. tras un backfill o un cambio
 * de retencion). El siguiente informe se vuelve a sellar en la proxima lectura
 * y su PDF publico se regenera en la siguiente descarga.
 */
export async function invalidateMonthlyReport(monthKey: string): Promise<void> {
  await deleteCachedJson(reportCacheKey(monthKey));

  try {
    const { deleteStoredMonthlyReportPdf } = await import('@/lib/monthly-report-pdf-store');
    await deleteStoredMonthlyReportPdf(monthKey);
  } catch (error) {
    captureWarningWithContext('Failed to delete the stored monthly report PDF', {
      area: 'reports.pdf',
      operation: 'invalidate',
      extra: { month: monthKey },
      tags: { handled: true },
    });
    logger.warn('reports.pdf_delete_failed', { month: monthKey, error });
  }
}

export async function buildMonthlyReport(
  monthKey: string,
  nowIso: string,
  sources: MonthlyReportSources = createLiveMonthlyReportSources()
): Promise<MonthlyReport> {
  if (!isValidMonthKey(monthKey)) {
    return buildFallbackMonthlyReport(monthKey, nowIso);
  }

  const ttl = isClosedReportMonth(monthKey, nowIso) ? null : REPORT_CACHE_TTL_LIVE_SECONDS;

  return withCache(reportCacheKey(monthKey), ttl, () =>
    assembleMonthlyReport(monthKey, nowIso, sources)
  );
}
