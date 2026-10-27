import { movementUnits } from '@/lib/product-copy';
import type { StationSnapshot } from '@/lib/api-types';
import { averageOrNull, formatRatioDelta } from '@/lib/format';
import type { MobilityConclusionsPayload } from '@/lib/mobility-conclusions';
import { formatMonthLabel } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { buildMonthlyTemporalComparison, type TemporalComparison } from '@/lib/temporal-comparison';
import type { DistrictSeoRow } from '@/lib/seo-districts';

const integerFormatter = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });
const decimalFormatters = new Map<number, Intl.NumberFormat>();
const NO_COMPARISON_LABEL = 'Sin referencia comparable';
const percentFormatter = new Intl.NumberFormat('es-ES', {
  style: 'percent',
  maximumFractionDigits: 0,
});

/**
 * Interfaz de la vista del comparador: este modulo la define y la construye; el
 * adapter (`@/lib/comparison-hub`) solo la rellena con las filas crudas.
 */
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
  temporalComparison?: TemporalComparison;
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

/** Franjas del "efecto marea" y semáforo de disponibilidad por entidad. */
export type ComparisonBandId =
  | 'dawn'
  | 'early-morning'
  | 'morning'
  | 'midday'
  | 'afternoon'
  | 'night';
export type ComparisonTrafficLight = 'green' | 'amber' | 'red' | 'unknown';

export type ComparisonBand = {
  id: ComparisonBandId;
  label: string;
  rangeLabel: string;
  avgBikes: number | null;
  avgAnchors: number | null;
  sampleCount: number;
  status: ComparisonTrafficLight;
  /** Hora del día con más tiempo sin servicio dentro de la franja, si la hay. */
  peakHour: number | null;
};

/** Métrica contextualizada para las tarjetas lado a lado. */
export type ComparisonMetricKey =
  | 'bikes'
  | 'anchors'
  | 'availability'
  | 'rotation'
  | 'tension'
  | 'demand'
  | 'occupancy'
  | 'coverage';

export type ComparisonMetric = {
  key: ComparisonMetricKey;
  label: string;
  value: string;
  hint?: string;
};

/** Accesos directos a preguntas ciudadanas frecuentes. */
export type ComparisonPresetId =
  | 'nearest-alternative'
  | 'district-vs-city'
  | 'today-vs-last-week'
  | 'saved-stations';

export type ComparisonPreset = {
  id: ComparisonPresetId;
  emoji: string;
  label: string;
  description: string;
  dimensionId: InteractiveComparisonDimensionId;
  leftId: string | null;
  rightId: string | null;
  requiresGeolocation?: boolean;
  requiresFavorites?: boolean;
};

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
  /** Tarjetas de métricas lado a lado (disponibilidad, huecos, tensión...). */
  metrics?: ComparisonMetric[];
  /** Semáforo por franja horaria para el "efecto marea". */
  bands?: ComparisonBand[];
  /** Fiabilidad 0..1 derivada de franjas sin servicio (para el veredicto). */
  reliabilityScore?: number | null;
  /** Coordenadas para resolver la estación más cercana sin volver al servidor. */
  lat?: number;
  lon?: number;
  /** `city-average` marca la opción sintética "Media de la ciudad". */
  kind?: 'entity' | 'city-average';
};

/** Ámbito del comparador de periodos: toda la red o un barrio concreto. */
export type InteractiveComparisonScope = {
  id: string;
  label: string;
  options: InteractiveComparisonOption[];
  defaultLeftId: string | null;
  defaultRightId: string | null;
};

export type InteractiveComparisonDimension = {
  id: InteractiveComparisonDimensionId;
  label: string;
  description: string;
  options: InteractiveComparisonOption[];
  defaultLeftId: string | null;
  defaultRightId: string | null;
  /** Pestañas destacadas del rediseño (estaciones, barrios, periodos). */
  primary?: boolean;
  /** Solo en periodos: un juego de opciones por ámbito. */
  scopes?: InteractiveComparisonScope[];
};

export type InteractiveComparisonData = {
  defaultDimensionId: InteractiveComparisonDimensionId | null;
  dimensions: InteractiveComparisonDimension[];
  /** Preguntas frecuentes a un clic. */
  presets: ComparisonPreset[];
};

/** Fila cruda del perfil horario por estación (la comparte el adapter). */
export type StationHourlyProfileInput = {
  stationId: string;
  hour: number;
  avgBikes: number;
  avgAnchors: number;
  avgOccupancy: number;
  sampleCount: number;
  emptyShare: number;
  fullShare: number;
};

/** Fila cruda de demanda diaria por estación (la comparte el adapter). */
export type StationDailyDemandInput = {
  stationId: string;
  day: string;
  demandScore: number;
  avgOccupancy: number;
  sampleCount: number;
};

/** Asignación estación → barrio, para agregar por distrito sin volver a la BD. */
export type StationDistrictInput = {
  stationId: string;
  districtSlug: string;
  districtName: string;
};

/** Fila cruda del query de historico reciente (la comparte el adapter). */
export type HistoryCompareRow = {
  day: string;
  demandScore: number;
  avgOccupancy: number;
  balanceIndex: number;
  sampleCount: number;
};

type StationComparisonSnapshot = Omit<
  Pick<
    StationSnapshot,
    'id' | 'name' | 'bikesAvailable' | 'capacity' | 'anchorsFree' | 'recordedAt' | 'lat' | 'lon'
  >,
  'recordedAt'
> & {
  recordedAt: string | Date;
};

type TurnoverRankingInput = {
  stationId: string;
  turnoverScore: number;
};

type AvailabilityRankingInput = {
  stationId: string;
  emptyHours: number;
  fullHours: number;
};

type DailyDemandInput = {
  day: string;
  demandScore: number;
  avgOccupancy: number;
  sampleCount: number;
};

type MonthlyDemandInput = {
  monthKey: string;
  demandScore: number;
  avgOccupancy: number;
  activeStations: number;
  sampleCount: number;
};

type HourlyProfileInput = {
  hour: number;
  avgOccupancy: number;
  avgBikesAvailable: number;
  sampleCount: number;
};

export type ComparisonHubViewModelInput = {
  stations: StationComparisonSnapshot[];
  turnoverRankings: TurnoverRankingInput[];
  availabilityRankings: AvailabilityRankingInput[];
  districtRows: DistrictSeoRow[];
  monthlySeries: MonthlyDemandInput[];
  recentDemand: DailyDemandInput[];
  hourlyProfile: HourlyProfileInput[];
  historyRows: HistoryCompareRow[];
  datasetCoverageDays: number;
  comparisonNow: string;
  latestMonth: string | null;
  previousMonth: string | null;
  recentPayload: MobilityConclusionsPayload | null;
  latestMonthPayload: MobilityConclusionsPayload | null;
  previousMonthPayload: MobilityConclusionsPayload | null;
  stationHourlyProfiles: StationHourlyProfileInput[];
  stationDailyDemand: StationDailyDemandInput[];
  stationDistricts: StationDistrictInput[];
  cityName: string;
};

type DerivedComparisonContext = ComparisonHubViewModelInput & {
  stationMap: Map<string, StationComparisonSnapshot>;
  turnoverMap: Map<string, number>;
  availabilityMap: Map<string, number>;
  topStation: TurnoverRankingInput | null;
  secondStation: TurnoverRankingInput | null;
  topDistrict: DistrictSeoRow | null;
  bottomDistrict: DistrictSeoRow | null;
  latestMonthlyRow: MonthlyDemandInput | null;
  previousMonthlyRow: MonthlyDemandInput | null;
  latestYear: {
    year: string;
    demandScore: number;
    occupancyValues: number[];
    activeStations: number[];
  } | null;
  previousYear: {
    year: string;
    demandScore: number;
    occupancyValues: number[];
    activeStations: number[];
  } | null;
  yearlyRows: Array<{
    year: string;
    demandScore: number;
    occupancyValues: number[];
    activeStations: number[];
  }>;
  sortedRecentDemand: DailyDemandInput[];
  peakHour: HourlyProfileInput | null;
  quietHour: HourlyProfileInput | null;
  weekdayWeekendProfile: MobilityConclusionsPayload['weekdayWeekendProfile'] | null;
  hourlyByStation: Map<string, StationHourlyProfileInput[]>;
  dailyByStation: Map<string, StationDailyDemandInput[]>;
  districtByStation: Map<string, StationDistrictInput>;
  stationsByDistrict: Map<string, StationComparisonSnapshot[]>;
};

export function buildFallbackComparisonSections(): ComparisonSection[] {
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
      title: 'Comparativas históricas',
      description:
        'Cortes temporales para comparar meses, años, periodos y grandes cambios en la red o en la demanda.',
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

function getDecimalFormatter(maximumFractionDigits: number): Intl.NumberFormat {
  const existing = decimalFormatters.get(maximumFractionDigits);

  if (existing) {
    return existing;
  }

  const formatter = new Intl.NumberFormat('es-ES', { maximumFractionDigits });
  decimalFormatters.set(maximumFractionDigits, formatter);
  return formatter;
}

function formatRecordedAtSummary(recordedAt: string | Date | null | undefined): string {
  if (!recordedAt) {
    return 'sin fecha';
  }

  const normalized = recordedAt instanceof Date ? recordedAt.toISOString() : recordedAt;

  if (typeof normalized !== 'string' || normalized.length === 0) {
    return 'sin fecha';
  }

  return normalized.includes('T')
    ? normalized.slice(0, 16).replace('T', ' ')
    : normalized;
}

function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

function formatDecimal(value: number, maximumFractionDigits = 1): string {
  return getDecimalFormatter(maximumFractionDigits).format(value);
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'Sin datos';
  }

  return percentFormatter.format(value);
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
    summary: 'Todavía no hay suficiente dato agregado para esta comparativa.',
    metricA: 'Sin muestra suficiente',
    metricB: 'Sin referencia previa',
    delta: 'Pendiente de cobertura',
    href,
    note,
  };
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
  primary?: boolean;
  scopes?: InteractiveComparisonScope[];
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
    ...(config.primary ? { primary: true } : {}),
    ...(config.scopes && config.scopes.length > 0 ? { scopes: config.scopes } : {}),
  };
}

function deriveComparisonContext(input: ComparisonHubViewModelInput): DerivedComparisonContext {
  const stationMap = new Map(input.stations.map((station) => [station.id, station]));
  const turnoverMap = new Map(
    input.turnoverRankings.map((row) => [row.stationId, Number(row.turnoverScore)])
  );
  const availabilityMap = new Map(
    input.availabilityRankings.map((row) => [
      row.stationId,
      Number(row.emptyHours) + Number(row.fullHours),
    ])
  );
  const hourlyByStation = new Map<string, StationHourlyProfileInput[]>();
  for (const row of input.stationHourlyProfiles) {
    const list = hourlyByStation.get(row.stationId);
    if (list) {
      list.push(row);
    } else {
      hourlyByStation.set(row.stationId, [row]);
    }
  }
  const dailyByStation = new Map<string, StationDailyDemandInput[]>();
  for (const row of input.stationDailyDemand) {
    const list = dailyByStation.get(row.stationId);
    if (list) {
      list.push(row);
    } else {
      dailyByStation.set(row.stationId, [row]);
    }
  }
  const districtByStation = new Map(input.stationDistricts.map((row) => [row.stationId, row]));
  const stationsByDistrict = new Map<string, StationComparisonSnapshot[]>();
  for (const station of input.stations) {
    const assignment = districtByStation.get(station.id);
    if (!assignment) {
      continue;
    }
    const list = stationsByDistrict.get(assignment.districtSlug);
    if (list) {
      list.push(station);
    } else {
      stationsByDistrict.set(assignment.districtSlug, [station]);
    }
  }
  const yearlyMap = new Map<
    string,
    { year: string; demandScore: number; occupancyValues: number[]; activeStations: number[] }
  >();

  for (const row of input.monthlySeries) {
    const year = row.monthKey.slice(0, 4);
    const current =
      yearlyMap.get(year) ?? { year, demandScore: 0, occupancyValues: [], activeStations: [] };
    current.demandScore += Number(row.demandScore);
    current.occupancyValues.push(Number(row.avgOccupancy));
    current.activeStations.push(Number(row.activeStations));
    yearlyMap.set(year, current);
  }

  const yearlyRows = Array.from(yearlyMap.values()).sort((left, right) =>
    left.year.localeCompare(right.year)
  );
  const sortedRecentDemand = [...input.recentDemand].sort(
    (left, right) => toTimestamp(left.day) - toTimestamp(right.day)
  );
  const sortedHoursByDemand = [...input.hourlyProfile].sort(
    (left, right) =>
      Number(left.avgBikesAvailable) - Number(right.avgBikesAvailable) ||
      Number(left.avgOccupancy) - Number(right.avgOccupancy)
  );

  return {
    ...input,
    stationMap,
    turnoverMap,
    availabilityMap,
    topStation: input.turnoverRankings[0] ?? null,
    secondStation: input.turnoverRankings[1] ?? null,
    topDistrict: input.districtRows[0] ?? null,
    bottomDistrict: input.districtRows[input.districtRows.length - 1] ?? null,
    latestMonthlyRow: input.monthlySeries[input.monthlySeries.length - 1] ?? null,
    previousMonthlyRow: input.monthlySeries[input.monthlySeries.length - 2] ?? null,
    latestYear: yearlyRows[yearlyRows.length - 1] ?? null,
    previousYear: yearlyRows[yearlyRows.length - 2] ?? null,
    yearlyRows,
    sortedRecentDemand,
    peakHour: sortedHoursByDemand[0] ?? null,
    quietHour: sortedHoursByDemand[sortedHoursByDemand.length - 1] ?? null,
    weekdayWeekendProfile: input.recentPayload?.weekdayWeekendProfile ?? null,
    hourlyByStation,
    dailyByStation,
    districtByStation,
    stationsByDistrict,
  };
}

function buildCurrentCards(context: DerivedComparisonContext): ComparisonCard[] {
  const cards: ComparisonCard[] = [];

  if (context.topStation && context.secondStation) {
    const topStationMeta = context.stationMap.get(context.topStation.stationId);
    const secondStationMeta = context.stationMap.get(context.secondStation.stationId);
    const demandGap =
      Number(context.secondStation.turnoverScore) > 0
        ? (Number(context.topStation.turnoverScore) - Number(context.secondStation.turnoverScore)) /
          Number(context.secondStation.turnoverScore)
        : null;

    cards.push({
      id: 'station-vs-station',
      title: 'Estación vs estación',
      eyebrow: 'Comparativa operativa',
      summary: `${topStationMeta?.name ?? context.topStation.stationId} lidera el uso relativo frente a ${secondStationMeta?.name ?? context.secondStation.stationId}.`,
      metricA: `${topStationMeta?.name ?? context.topStation.stationId}: giro ${formatDecimal(Number(context.topStation.turnoverScore))} · ${topStationMeta?.bikesAvailable ?? 0}/${topStationMeta?.capacity ?? 0} bicis`,
      metricB: `${secondStationMeta?.name ?? context.secondStation.stationId}: giro ${formatDecimal(Number(context.secondStation.turnoverScore))} · ${secondStationMeta?.bikesAvailable ?? 0}/${secondStationMeta?.capacity ?? 0} bicis`,
      delta: `Brecha de actividad ${formatRatioDelta(demandGap, NO_COMPARISON_LABEL)}`,
      href: appRoutes.dashboardStations(),
      note: `Riesgo de disponibilidad: ${formatDecimal(context.availabilityMap.get(context.topStation.stationId) ?? 0)} vs ${formatDecimal(context.availabilityMap.get(context.secondStation.stationId) ?? 0)} horas problema.`,
    });
  } else {
    cards.push(
      buildUnavailableCard(
        'station-vs-station',
        'Estación vs estación',
        'Comparativa operativa',
        appRoutes.dashboardStations()
      )
    );
  }

  if (
    context.topDistrict &&
    context.bottomDistrict &&
    context.topDistrict.slug !== context.bottomDistrict.slug
  ) {
    const districtGap =
      context.bottomDistrict.avgTurnover > 0
        ? (context.topDistrict.avgTurnover - context.bottomDistrict.avgTurnover) /
          context.bottomDistrict.avgTurnover
        : null;

    cards.push({
      id: 'district-vs-district',
      title: 'Barrio vs barrio',
      eyebrow: 'Lectura territorial',
      summary: `${context.topDistrict.name} concentra más movimiento estimado, mientras ${context.bottomDistrict.name} es el extremo más tranquilo.`,
      metricA: `${context.topDistrict.name}: ${formatDecimal(context.topDistrict.avgTurnover)} ${movementUnits.total} · ${context.topDistrict.stationCount} estaciones`,
      metricB: `${context.bottomDistrict.name}: ${formatDecimal(context.bottomDistrict.avgTurnover)} ${movementUnits.total} · ${context.bottomDistrict.stationCount} estaciones`,
      delta: `Brecha territorial ${formatRatioDelta(districtGap, NO_COMPARISON_LABEL)}`,
      href: appRoutes.districtLanding(),
      note: `${context.topDistrict.bikesAvailable} bicis disponibles ahora mismo frente a ${context.bottomDistrict.bikesAvailable}.`,
    });
  } else {
    cards.push(
      buildUnavailableCard(
        'district-vs-district',
        'Barrio vs barrio',
        'Lectura territorial',
        appRoutes.districtLanding()
      )
    );
  }

  if (context.weekdayWeekendProfile) {
    cards.push({
      id: 'weekday-vs-weekend',
      title: 'Laboral vs fin de semana',
      eyebrow: 'Patrón de uso',
      summary:
        context.weekdayWeekendProfile.dominantPeriod === 'weekend'
          ? 'La red muestra más movimiento estimado el fin de semana que entre semana.'
          : 'La red muestra más movimiento estimado entre semana que el fin de semana.',
      metricA: `Laboral: ${formatDecimal(context.weekdayWeekendProfile.weekday.avgDemand)} ${movementUnits.perDay} · ocupación ${formatPercent(context.weekdayWeekendProfile.weekday.avgOccupancy)}`,
      metricB: `Fin de semana: ${formatDecimal(context.weekdayWeekendProfile.weekend.avgDemand)} ${movementUnits.perDay} · ocupación ${formatPercent(context.weekdayWeekendProfile.weekend.avgOccupancy)}`,
      delta: `Diferencia relativa ${formatRatioDelta(context.weekdayWeekendProfile.demandGapRatio, NO_COMPARISON_LABEL)}`,
      href: context.latestMonth
        ? appRoutes.reportMonth(context.latestMonth)
        : appRoutes.dashboardConclusions(),
      note: `${context.weekdayWeekendProfile.weekday.daysCount} días laborables comparados con ${context.weekdayWeekendProfile.weekend.daysCount} días de fin de semana.`,
    });
  } else {
    cards.push(
      buildUnavailableCard(
        'weekday-vs-weekend',
        'Laboral vs fin de semana',
        'Patrón de uso',
        appRoutes.dashboardConclusions()
      )
    );
  }

  if (context.hourlyProfile.length >= 2) {
    const hourGap =
      context.peakHour &&
      context.quietHour &&
      Number(context.quietHour.avgBikesAvailable) > 0
        ? (Number(context.quietHour.avgBikesAvailable) -
            Number(context.peakHour.avgBikesAvailable)) /
          Number(context.quietHour.avgBikesAvailable)
        : null;

    cards.push({
      id: 'hour-vs-hour',
      title: 'Hora vs hora',
      eyebrow: 'Ritmo intradia',
      summary: `La hora ${context.peakHour?.hour ?? '--'}:00 concentra más movimiento estimado que la franja más tranquila.`,
      metricA: `${context.peakHour?.hour ?? '--'}:00 · ${formatDecimal(Number(context.peakHour?.avgBikesAvailable ?? 0))} bicis disponibles · ocupación ${formatPercent(Number(context.peakHour?.avgOccupancy ?? 0))}`,
      metricB: `${context.quietHour?.hour ?? '--'}:00 · ${formatDecimal(Number(context.quietHour?.avgBikesAvailable ?? 0))} bicis disponibles · ocupación ${formatPercent(Number(context.quietHour?.avgOccupancy ?? 0))}`,
      delta: `Brecha horaria ${formatRatioDelta(hourGap, NO_COMPARISON_LABEL)}`,
      href: appRoutes.dashboardView('research'),
      note: `${formatInteger(Number(context.peakHour?.sampleCount ?? 0))} muestras agregadas en la hora pico.`,
    });
  } else {
    cards.push(
      buildUnavailableCard(
        'hour-vs-hour',
        'Hora vs hora',
        'Ritmo intradia',
        appRoutes.dashboardView('research')
      )
    );
  }

  return cards;
}

function buildHistoricalCards(context: DerivedComparisonContext): ComparisonCard[] {
  const cards: ComparisonCard[] = [];

  if (context.latestMonthlyRow && context.previousMonthlyRow) {
    const temporalComparison = buildMonthlyTemporalComparison({
      monthKey: context.latestMonthlyRow.monthKey,
      referenceMonthKey: context.previousMonthlyRow.monthKey,
      rows: context.recentDemand,
      nowIso: context.comparisonNow,
    });
    const coverageLabel = `${temporalComparison.left.coveredDays} de ${temporalComparison.left.expectedDays} días disponibles`;

    cards.push({
      id: 'month-vs-month',
      title: 'Mes vs mes',
      eyebrow: 'Cambio mensual',
      summary: temporalComparison.isComparable
        ? `${formatMonthLabel(context.latestMonthlyRow.monthKey)} se compara con ${formatMonthLabel(context.previousMonthlyRow.monthKey)} usando ${temporalComparison.periodLabel}.`
        : `${formatMonthLabel(context.latestMonthlyRow.monthKey)} no tiene todavía una comparación mensual equivalente.`,
      metricA: `${formatMonthLabel(context.latestMonthlyRow.monthKey)}: ${formatInteger(Number(context.latestMonthlyRow.demandScore))} ${movementUnits.total} · ocupación ${formatPercent(Number(context.latestMonthlyRow.avgOccupancy))}`,
      metricB: `${formatMonthLabel(context.previousMonthlyRow.monthKey)}: ${formatInteger(Number(context.previousMonthlyRow.demandScore))} ${movementUnits.total} · ocupación ${formatPercent(Number(context.previousMonthlyRow.avgOccupancy))}`,
      delta: temporalComparison.isComparable
        ? `Movimiento estimado comparable ${formatRatioDelta(temporalComparison.normalizedDemandRatio, NO_COMPARISON_LABEL)}`
        : 'Comparación no disponible todavía',
      href: appRoutes.reports(),
      note: `${temporalComparison.left.label} · ${temporalComparison.periodLabel} · ${coverageLabel}. ${temporalComparison.reason}`,
      temporalComparison,
    });
  } else {
    cards.push(
      buildUnavailableCard(
        'month-vs-month',
        'Mes vs mes',
        'Cambio mensual',
        appRoutes.reports()
      )
    );
  }

  if (context.latestYear && context.previousYear) {
    const currentYear = context.comparisonNow.slice(0, 4);
    const latestYearMonths = context.monthlySeries.filter((row) => row.monthKey.startsWith(`${context.latestYear?.year}-`));
    const previousYearMonths = context.monthlySeries.filter((row) => row.monthKey.startsWith(`${context.previousYear?.year}-`));
    const yearsAreComparable =
      context.latestYear.year < currentYear &&
      context.previousYear.year < currentYear &&
      latestYearMonths.length === 12 &&
      previousYearMonths.length === 12;
    const yearDelta =
      yearsAreComparable && context.previousYear.demandScore > 0
        ? (context.latestYear.demandScore - context.previousYear.demandScore) /
          context.previousYear.demandScore
        : null;

    cards.push({
      id: 'year-vs-year',
      title: 'Año vs año',
      eyebrow: 'Lectura anual',
      summary: yearsAreComparable
        ? `${context.latestYear.year} agrega ${formatInteger(context.latestYear.demandScore)} puntos de demanda frente a ${context.previousYear.year}.`
        : `No hay dos años cerrados con doce meses disponibles para comparar ${context.latestYear.year} y ${context.previousYear.year}.`,
      metricA: `${context.latestYear.year}: ${formatInteger(context.latestYear.demandScore)} ${movementUnits.total} · ocupación media ${formatPercent(averageOrNull(context.latestYear.occupancyValues))}`,
      metricB: `${context.previousYear.year}: ${formatInteger(context.previousYear.demandScore)} ${movementUnits.total} · ocupación media ${formatPercent(averageOrNull(context.previousYear.occupancyValues))}`,
      delta: yearsAreComparable
        ? `Variación anual ${formatRatioDelta(yearDelta, NO_COMPARISON_LABEL)}`
        : 'Comparación no disponible todavía',
      href: appRoutes.reports(),
      note: yearsAreComparable
        ? `Red media de ${formatDecimal(averageOrNull(context.latestYear.activeStations) ?? 0)} estaciones activas frente a ${formatDecimal(averageOrNull(context.previousYear.activeStations) ?? 0)}.`
        : `${latestYearMonths.length} de 12 meses disponibles en ${context.latestYear.year}; ${previousYearMonths.length} de 12 en ${context.previousYear.year}.`,
    });
  } else {
    cards.push(
      buildUnavailableCard(
        'year-vs-year',
        'Año vs año',
        'Lectura anual',
        appRoutes.reports()
      )
    );
  }

  if (context.recentDemand.length >= 40) {
    const last7 = context.sortedRecentDemand.slice(-7);
    const previous30 = context.sortedRecentDemand.slice(-37, -7);
    const last7Demand = averageOrNull(last7.map((row) => Number(row.demandScore)));
    const previous30Demand = averageOrNull(previous30.map((row) => Number(row.demandScore)));
    const periodDelta =
      last7Demand !== null && previous30Demand && previous30Demand > 0
        ? (last7Demand - previous30Demand) / previous30Demand
        : null;

    cards.push({
      id: 'periods',
      title: 'Periodos',
      eyebrow: 'Ventanas comparables',
      summary:
        'La última semana se compara con la base movil previa de treinta días para detectar aceleraciones o frenadas.',
      metricA: `Últimos 7 días: ${formatDecimal(last7Demand ?? 0)} ${movementUnits.perDay} · ocupación ${formatPercent(averageOrNull(last7.map((row) => Number(row.avgOccupancy))))}`,
      metricB: `Base previa 30 días: ${formatDecimal(previous30Demand ?? 0)} ${movementUnits.perDay} · ocupación ${formatPercent(averageOrNull(previous30.map((row) => Number(row.avgOccupancy))))}`,
      delta: `Cambio de periodo ${formatRatioDelta(periodDelta, NO_COMPARISON_LABEL)}`,
      href: appRoutes.dashboardConclusions(),
      note: `Cobertura reciente: ${context.datasetCoverageDays} días históricos en total.`,
    });
  } else {
    cards.push(
      buildUnavailableCard(
        'periods',
        'Periodos',
        'Ventanas comparables',
        appRoutes.dashboardConclusions()
      )
    );
  }

  const expansionCandidates = context.monthlySeries
    .map((row, index) => {
      if (index === 0) {
        return null;
      }

      return {
        index,
        monthKey: row.monthKey,
        stationDelta:
          Number(row.activeStations) -
          Number(context.monthlySeries[index - 1]?.activeStations ?? 0),
      };
    })
    .filter(
      (candidate): candidate is { index: number; monthKey: string; stationDelta: number } =>
        Boolean(candidate)
    )
    .sort((left, right) => right.stationDelta - left.stationDelta);
  const expansionCandidate = expansionCandidates[0] ?? null;

  if (expansionCandidate && expansionCandidate.stationDelta > 0) {
    const beforeSlice = context.monthlySeries.slice(
      Math.max(0, expansionCandidate.index - 2),
      expansionCandidate.index
    );
    const afterSlice = context.monthlySeries.slice(
      expansionCandidate.index,
      Math.min(context.monthlySeries.length, expansionCandidate.index + 2)
    );
    const beforeDemand = averageOrNull(beforeSlice.map((row) => Number(row.demandScore)));
    const afterDemand = averageOrNull(afterSlice.map((row) => Number(row.demandScore)));
    const expansionDelta =
      beforeDemand && beforeDemand > 0 && afterDemand !== null
        ? (afterDemand - beforeDemand) / beforeDemand
        : null;

    cards.push({
      id: 'before-after-expansion',
      title: 'Antes vs después ampliación',
      eyebrow: 'Hito detectado',
      summary: `Se detecta la mayor ampliación proxy en ${formatMonthLabel(expansionCandidate.monthKey)} por un salto de ${formatInteger(expansionCandidate.stationDelta)} estaciones activas.`,
      metricA: `Antes: ${formatDecimal(beforeDemand ?? 0)} ${movementUnits.perMonth} · ${formatDecimal(averageOrNull(beforeSlice.map((row) => Number(row.activeStations))) ?? 0)} estaciones medias`,
      metricB: `Después: ${formatDecimal(afterDemand ?? 0)} ${movementUnits.perMonth} · ${formatDecimal(averageOrNull(afterSlice.map((row) => Number(row.activeStations))) ?? 0)} estaciones medias`,
      delta: `Cambio tras ampliación ${formatRatioDelta(expansionDelta, NO_COMPARISON_LABEL)}`,
      href: appRoutes.reports(),
      note: 'La fecha se infiere por el mayor salto en estaciones activas, no por un calendario externo de hitos.',
    });
  } else {
    cards.push(
      buildUnavailableCard(
        'before-after-expansion',
        'Antes vs después ampliación',
        'Hito detectado',
        appRoutes.reports(),
        'Hace falta un salto claro en estaciones activas o un calendario de hitos para fijar el corte.'
      )
    );
  }

  if (context.recentDemand.length >= 10) {
    const peakDay = [...context.recentDemand].sort(
      (left, right) => Number(right.demandScore) - Number(left.demandScore)
    )[0];
    const normalDays = context.recentDemand.filter((row) => row.day !== peakDay?.day);
    const normalDemand = averageOrNull(normalDays.map((row) => Number(row.demandScore)));
    const eventDelta =
      normalDemand && normalDemand > 0 && peakDay
        ? (Number(peakDay.demandScore) - normalDemand) / normalDemand
        : null;

    cards.push({
      id: 'events-vs-normal',
      title: 'Eventos vs normal',
      eyebrow: 'Pico anomalo',
      summary: `El día ${peakDay?.day ?? 'sin fecha'} marca el mayor pico reciente y se compara con un día normal medio del mismo tramo.`,
      metricA: `Pico anomalo: ${formatInteger(Number(peakDay?.demandScore ?? 0))} ${movementUnits.total} · ocupación ${formatPercent(Number(peakDay?.avgOccupancy ?? 0))}`,
      metricB: `Día normal: ${formatDecimal(normalDemand ?? 0)} ${movementUnits.total} · ocupación ${formatPercent(averageOrNull(normalDays.map((row) => Number(row.avgOccupancy))))}`,
      delta: `Exceso sobre normal ${formatRatioDelta(eventDelta, NO_COMPARISON_LABEL)}`,
      href: appRoutes.dashboardConclusions(),
      note: 'Esta lectura usa un pico estadistico reciente como proxy de evento; no consume un calendario oficial de eventos.',
    });
  } else {
    cards.push(
      buildUnavailableCard(
        'events-vs-normal',
        'Eventos vs normal',
        'Pico anomalo',
        appRoutes.dashboardConclusions()
      )
    );
  }

  return cards;
}

function buildChangeCards(context: DerivedComparisonContext): ComparisonCard[] {
  const cards: ComparisonCard[] = [];

  if (context.latestMonthPayload && context.previousMonthPayload) {
    const latestTop = context.latestMonthPayload.topStationsByDemand;
    const previousTop = context.previousMonthPayload.topStationsByDemand;
    const latestLeader = latestTop[0] ?? null;
    const previousLeader = previousTop[0] ?? null;
    const overlap = latestTop.filter((row) =>
      previousTop.some((candidate) => candidate.stationId === row.stationId)
    ).length;

    cards.push({
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
        ? `${formatMonthLabel(context.latestMonthPayload.selectedMonth ?? context.latestMonth ?? '')}: ${latestLeader.stationName} · ${formatDecimal(latestLeader.avgDemand)} ${movementUnits.total}`
        : 'Sin lider mensual reciente',
      metricB: previousLeader
        ? `${formatMonthLabel(context.previousMonthPayload.selectedMonth ?? context.previousMonth ?? '')}: ${previousLeader.stationName} · ${formatDecimal(previousLeader.avgDemand)} ${movementUnits.total}`
        : 'Sin lider mensual previo',
      delta: `${overlap}/5 estaciones coinciden entre ambos top 5`,
      href: context.latestMonthPayload.selectedMonth
        ? appRoutes.reportMonth(context.latestMonthPayload.selectedMonth)
        : appRoutes.reports(),
      note: 'La comparativa usa el top de estaciones por demanda media entre meses consecutivos.',
    });
  } else {
    cards.push(
      buildUnavailableCard(
        'ranking-changes',
        'Ranking cambios',
        'Movimiento de lideres',
        appRoutes.reports()
      )
    );
  }

  if (context.recentPayload) {
    cards.push({
      id: 'demand-changes',
      title: 'Demanda cambios',
      eyebrow: 'Pulso reciente',
      summary:
        'Cambio de demanda comparando la última ventana de siete días frente a la anterior.',
      metricA: `Últimos 7 días: ${formatInteger(context.recentPayload.metrics.demandLast7Days)} ${movementUnits.total}`,
      metricB: `7 días previos: ${formatInteger(context.recentPayload.metrics.demandPrevious7Days)} ${movementUnits.total}`,
      delta: `Cambio de demanda ${formatRatioDelta(context.recentPayload.metrics.demandDeltaRatio, NO_COMPARISON_LABEL)}`,
      href: appRoutes.dashboardConclusions(),
      note: `Última cobertura útil ${context.recentPayload.sourceLastDay ?? 'sin fecha'}.`,
    });
  } else {
    cards.push(
      buildUnavailableCard(
        'demand-changes',
        'Demanda cambios',
        'Pulso reciente',
        appRoutes.dashboardConclusions()
      )
    );
  }

  if (context.historyRows.length >= 14) {
    const last7 = context.historyRows.slice(-7);
    const previous7 = context.historyRows.slice(-14, -7);
    const last7Balance = averageOrNull(last7.map((row) => Number(row.balanceIndex)));
    const previous7Balance = averageOrNull(previous7.map((row) => Number(row.balanceIndex)));
    const balanceDelta =
      last7Balance !== null && previous7Balance && previous7Balance > 0
        ? (last7Balance - previous7Balance) / previous7Balance
        : null;

    cards.push({
      id: 'balance-changes',
      title: 'Balance cambios',
      eyebrow: 'Equilibrio del sistema',
      summary: 'Evolución del índice de equilibrio comparando la última semana con la anterior.',
      metricA: `Últimos 7 días: ${formatDecimal(last7Balance ?? 0, 2)} índice medio`,
      metricB: `Semana previa: ${formatDecimal(previous7Balance ?? 0, 2)} índice medio`,
      delta: `Cambio de balance ${formatRatioDelta(balanceDelta, NO_COMPARISON_LABEL)}`,
      href: appRoutes.dashboardView('data'),
      note: `Series con ${formatInteger(last7.reduce((sum, row) => sum + Number(row.sampleCount), 0))} muestras recientes.`,
    });
  } else {
    cards.push(
      buildUnavailableCard(
        'balance-changes',
        'Balance cambios',
        'Equilibrio del sistema',
        appRoutes.dashboardView('data')
      )
    );
  }

  return cards;
}

const CITY_AVERAGE_ID = 'city-average';

const BAND_DEFINITIONS: Array<{
  id: ComparisonBandId;
  label: string;
  rangeLabel: string;
  hours: readonly number[];
}> = [
  { id: 'dawn', label: 'Madrugada', rangeLabel: '00–03 h', hours: [0, 1, 2, 3] },
  { id: 'early-morning', label: 'Primera mañana', rangeLabel: '04–07 h', hours: [4, 5, 6, 7] },
  { id: 'morning', label: 'Mañana', rangeLabel: '08–11 h', hours: [8, 9, 10, 11] },
  { id: 'midday', label: 'Mediodía', rangeLabel: '12–15 h', hours: [12, 13, 14, 15] },
  { id: 'afternoon', label: 'Tarde', rangeLabel: '16–19 h', hours: [16, 17, 18, 19] },
  { id: 'night', label: 'Noche', rangeLabel: '20–23 h', hours: [20, 21, 22, 23] },
];

type BandAggregate = {
  avgBikes: number;
  avgAnchors: number;
  occupancy: number;
  emptyShare: number;
  fullShare: number;
  sampleCount: number;
};

function aggregateHours(
  rows: StationHourlyProfileInput[],
  hours: readonly number[]
): BandAggregate | null {
  const inBand = rows.filter((row) => hours.includes(Number(row.hour)));
  const totalSamples = inBand.reduce((sum, row) => sum + (Number(row.sampleCount) || 0), 0);

  if (inBand.length === 0 || totalSamples <= 0) {
    return null;
  }

  const weighted = (pick: (row: StationHourlyProfileInput) => number) =>
    inBand.reduce((sum, row) => sum + pick(row) * (Number(row.sampleCount) || 0), 0) / totalSamples;

  return {
    avgBikes: weighted((row) => Number(row.avgBikes) || 0),
    avgAnchors: weighted((row) => Number(row.avgAnchors) || 0),
    occupancy: weighted((row) => Number(row.avgOccupancy) || 0),
    emptyShare: weighted((row) => Number(row.emptyShare) || 0),
    fullShare: weighted((row) => Number(row.fullShare) || 0),
    sampleCount: totalSamples,
  };
}

function resolveBandStatus(input: {
  avgBikes: number;
  avgAnchors: number;
  emptyShare: number;
  fullShare: number;
  totalCapacity: number;
  sampleCount: number;
}): ComparisonTrafficLight {
  if (input.sampleCount <= 0) {
    return 'unknown';
  }

  const bikesShare = input.totalCapacity > 0 ? input.avgBikes / input.totalCapacity : null;
  const anchorsShare = input.totalCapacity > 0 ? input.avgAnchors / input.totalCapacity : null;

  if (
    input.emptyShare >= 0.5 ||
    input.fullShare >= 0.5 ||
    (bikesShare !== null && bikesShare < 0.1) ||
    (anchorsShare !== null && anchorsShare < 0.1)
  ) {
    return 'red';
  }

  if (
    input.emptyShare >= 0.2 ||
    input.fullShare >= 0.2 ||
    (bikesShare !== null && bikesShare < 0.3) ||
    (anchorsShare !== null && anchorsShare < 0.3)
  ) {
    return 'amber';
  }

  return 'green';
}

/**
 * Agrega el perfil horario de una o varias estaciones en franjas con semáforo.
 * `stationRowSets` es una lista por estación: las métricas de bicis/huecos se
 * suman entre estaciones, mientras ocupación y proporción sin servicio se
 * ponderan por muestras. Así el semáforo funciona igual para una estación, un
 * barrio o la red entera.
 */
function buildBands(
  stationRowSets: StationHourlyProfileInput[][],
  totalCapacity: number
): ComparisonBand[] {
  return BAND_DEFINITIONS.map((definition) => {
    let avgBikes = 0;
    let avgAnchors = 0;
    let occupancyWeighted = 0;
    let emptyWeighted = 0;
    let fullWeighted = 0;
    let sampleCount = 0;

    for (const rows of stationRowSets) {
      const aggregate = aggregateHours(rows, definition.hours);
      if (!aggregate) {
        continue;
      }
      avgBikes += aggregate.avgBikes;
      avgAnchors += aggregate.avgAnchors;
      occupancyWeighted += aggregate.occupancy * aggregate.sampleCount;
      emptyWeighted += aggregate.emptyShare * aggregate.sampleCount;
      fullWeighted += aggregate.fullShare * aggregate.sampleCount;
      sampleCount += aggregate.sampleCount;
    }

    if (sampleCount <= 0) {
      return {
        id: definition.id,
        label: definition.label,
        rangeLabel: definition.rangeLabel,
        avgBikes: null,
        avgAnchors: null,
        sampleCount: 0,
        status: 'unknown' as const,
        peakHour: null,
      };
    }

    const emptyShare = emptyWeighted / sampleCount;
    const fullShare = fullWeighted / sampleCount;

    return {
      id: definition.id,
      label: definition.label,
      rangeLabel: definition.rangeLabel,
      avgBikes,
      avgAnchors,
      sampleCount,
      status: resolveBandStatus({
        avgBikes,
        avgAnchors,
        emptyShare,
        fullShare,
        totalCapacity,
        sampleCount,
      }),
      peakHour: resolvePeakHour(stationRowSets, definition.hours),
    };
  });
}

/**
 * Hora dentro de la franja con más tiempo medio sin servicio (vacía o llena).
 * Permite pasar de "por la mañana" a "sobre las 08:00" en el veredicto. Devuelve
 * `null` cuando no hay incidencias agregadas en la franja.
 */
function resolvePeakHour(
  stationRowSets: StationHourlyProfileInput[][],
  hours: readonly number[]
): number | null {
  const byHour = new Map<number, { unavailableWeighted: number; sampleCount: number }>();

  for (const rows of stationRowSets) {
    for (const row of rows) {
      const hour = Number(row.hour);
      if (!hours.includes(hour)) {
        continue;
      }
      const samples = Number(row.sampleCount) || 0;
      if (samples <= 0) {
        continue;
      }
      const unavailable = Math.min(
        1,
        Math.max(0, (Number(row.emptyShare) || 0) + (Number(row.fullShare) || 0))
      );
      const current = byHour.get(hour) ?? { unavailableWeighted: 0, sampleCount: 0 };
      current.unavailableWeighted += unavailable * samples;
      current.sampleCount += samples;
      byHour.set(hour, current);
    }
  }

  let peakHour: number | null = null;
  let peakRatio = 0;

  for (const [hour, value] of byHour) {
    const ratio = value.sampleCount > 0 ? value.unavailableWeighted / value.sampleCount : 0;
    if (ratio > peakRatio) {
      peakRatio = ratio;
      peakHour = hour;
    }
  }

  return peakRatio > 0 ? peakHour : null;
}

/** Fiabilidad 0..1: proporción de horas agregadas con servicio (ni vacía ni llena). */
function computeReliability(stationRowSets: StationHourlyProfileInput[][]): number | null {
  let serviceWeighted = 0;
  let sampleCount = 0;

  for (const rows of stationRowSets) {
    for (const row of rows) {
      const samples = Number(row.sampleCount) || 0;
      if (samples <= 0) {
        continue;
      }
      const unavailable = Math.min(
        1,
        Math.max(0, (Number(row.emptyShare) || 0) + (Number(row.fullShare) || 0))
      );
      serviceWeighted += (1 - unavailable) * samples;
      sampleCount += samples;
    }
  }

  return sampleCount > 0 ? serviceWeighted / sampleCount : null;
}

function averageBandValue(
  bands: ComparisonBand[] | undefined,
  pick: (band: ComparisonBand) => number | null
): number | null {
  if (!bands) {
    return null;
  }

  const values = bands
    .map(pick)
    .filter((value): value is number => value !== null && Number.isFinite(value));

  return averageOrNull(values);
}

function buildStationMetrics({
  station,
  turnoverScore,
  availabilityHours,
  bands,
}: {
  station: StationComparisonSnapshot;
  turnoverScore: number | null;
  availabilityHours: number | null;
  bands: ComparisonBand[];
}): ComparisonMetric[] {
  const capacity = Math.max(0, Number(station.capacity) || 0);
  const avgBikes = averageBandValue(bands, (band) => band.avgBikes);
  const avgAnchors = averageBandValue(bands, (band) => band.avgAnchors);
  const rotation = turnoverScore;
  const tension = rotation !== null && capacity > 0 ? rotation / capacity : null;

  return [
    {
      key: 'bikes',
      label: 'Bicis disponibles (media)',
      value: avgBikes !== null ? `${formatDecimal(avgBikes)} bicis` : 'Sin datos',
      hint: capacity > 0 ? `Capacidad ${formatInteger(capacity)} anclajes` : undefined,
    },
    {
      key: 'anchors',
      label: 'Huecos libres (media)',
      value: avgAnchors !== null ? `${formatDecimal(avgAnchors)} huecos` : 'Sin datos',
    },
    {
      key: 'availability',
      label: 'Horas sin servicio',
      value: availabilityHours !== null ? `${formatDecimal(availabilityHours)} h` : 'Sin datos',
      hint: 'Vacía o llena en el periodo',
    },
    {
      key: 'tension',
      label: 'Tensión por anclaje',
      value: tension !== null ? `${formatDecimal(tension, 2)} ${movementUnits.total}/anclaje` : 'Sin datos',
      hint: rotation !== null ? `${formatDecimal(rotation)} ${movementUnits.total}` : undefined,
    },
  ];
}

function buildDistrictMetrics(district: DistrictSeoRow): ComparisonMetric[] {
  return [
    {
      key: 'bikes',
      label: 'Bicis disponibles ahora',
      value: `${formatInteger(district.bikesAvailable)} bicis`,
      hint: `${formatInteger(district.stationCount)} estaciones`,
    },
    {
      key: 'anchors',
      label: 'Huecos libres ahora',
      value: `${formatInteger(district.anchorsFree)} huecos`,
    },
    {
      key: 'availability',
      label: 'Riesgo medio de disponibilidad',
      value: `${formatDecimal(district.avgAvailabilityRisk)} h`,
      hint: 'Media de horas sin servicio por estación',
    },
    {
      key: 'tension',
      label: 'Giro medio por estación',
      value: `${formatDecimal(district.avgTurnover)} ${movementUnits.total}`,
    },
  ];
}

function buildCityAverageOption(context: DerivedComparisonContext): InteractiveComparisonOption {
  const stationRowSets = context.stations.map(
    (station) => context.hourlyByStation.get(station.id) ?? []
  );
  const totalCapacity = context.stations.reduce(
    (sum, station) => sum + (Number(station.capacity) || 0),
    0
  );
  const totalBikes = context.stations.reduce(
    (sum, station) => sum + (Number(station.bikesAvailable) || 0),
    0
  );
  const totalAnchors = context.stations.reduce(
    (sum, station) => sum + (Number(station.anchorsFree) || 0),
    0
  );
  const bands = buildBands(stationRowSets, totalCapacity);
  const avgTurnover = averageOrNull(context.districtRows.map((district) => district.avgTurnover));
  const avgRisk = averageOrNull(
    context.districtRows.map((district) => district.avgAvailabilityRisk)
  );

  return {
    id: CITY_AVERAGE_ID,
    kind: 'city-average',
    label: `Media de ${context.cityName}`,
    href: appRoutes.districtLanding(),
    primaryLabel: 'Giro medio',
    primaryValue: avgTurnover,
    primaryDisplay: `${formatDecimal(avgTurnover ?? 0)} ${movementUnits.total}`,
    secondaryLabel: 'Estaciones',
    secondaryDisplay: `${formatInteger(context.stations.length)} estaciones`,
    tertiaryLabel: 'Bicis disponibles',
    tertiaryDisplay: `${formatInteger(totalBikes)} bicis`,
    note: `Referencia agregada de toda la red de ${context.cityName}`,
    metrics: [
      {
        key: 'bikes',
        label: 'Bicis disponibles ahora',
        value: `${formatInteger(totalBikes)} bicis`,
        hint: `${formatInteger(context.stations.length)} estaciones`,
      },
      {
        key: 'anchors',
        label: 'Huecos libres ahora',
        value: `${formatInteger(totalAnchors)} huecos`,
      },
      {
        key: 'availability',
        label: 'Riesgo medio de disponibilidad',
        value: avgRisk !== null ? `${formatDecimal(avgRisk)} h` : 'Sin datos',
      },
      {
        key: 'tension',
        label: 'Giro medio por estación',
        value: `${formatDecimal(avgTurnover ?? 0)} ${movementUnits.total}`,
      },
    ],
    bands,
    reliabilityScore: computeReliability(stationRowSets),
  };
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineMeters(
  left: { lat: number; lon: number },
  right: { lat: number; lon: number }
): number {
  const earthRadius = 6_371_000;
  const dLat = toRadians(right.lat - left.lat);
  const dLon = toRadians(right.lon - left.lon);
  const lat1 = toRadians(left.lat);
  const lat2 = toRadians(right.lat);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.min(1, Math.sqrt(a)));
}

function findNearestStationId(
  context: DerivedComparisonContext,
  fromStationId: string
): string | null {
  const from = context.stationMap.get(fromStationId);
  if (!from) {
    return null;
  }

  let nearestId: string | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const station of context.stations) {
    if (station.id === fromStationId) {
      continue;
    }
    const distance = haversineMeters(from, station);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestId = station.id;
    }
  }

  return nearestId;
}

type ScopeDailyAggregate = {
  day: string;
  demandScore: number;
  occupancy: number;
  sampleCount: number;
};

function aggregateScopeDaily(
  context: DerivedComparisonContext,
  stationIds: Set<string> | null
): ScopeDailyAggregate[] {
  const byDay = new Map<string, { demand: number; occupancyWeighted: number; sampleCount: number }>();

  for (const station of context.stations) {
    if (stationIds && !stationIds.has(station.id)) {
      continue;
    }
    for (const row of context.dailyByStation.get(station.id) ?? []) {
      const samples = Number(row.sampleCount) || 0;
      const current = byDay.get(row.day) ?? { demand: 0, occupancyWeighted: 0, sampleCount: 0 };
      current.demand += Number(row.demandScore) || 0;
      current.occupancyWeighted += (Number(row.avgOccupancy) || 0) * samples;
      current.sampleCount += samples;
      byDay.set(row.day, current);
    }
  }

  return Array.from(byDay.entries())
    .map(([day, value]) => ({
      day,
      demandScore: value.demand,
      occupancy: value.sampleCount > 0 ? value.occupancyWeighted / value.sampleCount : 0,
      sampleCount: value.sampleCount,
    }))
    .sort((left, right) => left.day.localeCompare(right.day));
}

function shiftDay(day: string, deltaDays: number): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().slice(0, 10);
}

function buildPeriodOption(
  id: string,
  label: string,
  rows: ScopeDailyAggregate[],
  notePrefix: string,
  href: string
): InteractiveComparisonOption | null {
  if (rows.length === 0) {
    return null;
  }

  const withSamples = rows.filter((row) => row.sampleCount > 0);
  const demandAverage = averageOrNull(withSamples.map((row) => row.demandScore));
  const occupancyAverage = averageOrNull(withSamples.map((row) => row.occupancy));
  const totalSamples = rows.reduce((sum, row) => sum + row.sampleCount, 0);
  const rangeLabel =
    rows.length > 1
      ? `${rows[0]?.day ?? ''} → ${rows[rows.length - 1]?.day ?? ''}`
      : rows[0]?.day ?? '';

  return {
    id,
    label,
    href,
    primaryLabel: 'Demanda media',
    primaryValue: demandAverage,
    primaryDisplay: `${formatDecimal(demandAverage ?? 0)} ${movementUnits.perDay}`,
    secondaryLabel: 'Ocupación media',
    secondaryDisplay: formatPercent(occupancyAverage),
    tertiaryLabel: 'Cobertura',
    tertiaryDisplay: `${formatInteger(totalSamples)} muestras`,
    note: `${notePrefix}: ${rangeLabel}`,
  };
}

/**
 * Un juego de periodos comparables por ámbito (toda la red o un barrio). Así el
 * preset "Hoy vs mismo día de la semana anterior" responde por zona, no solo a
 * nivel de red.
 */
function buildPeriodScopes(context: DerivedComparisonContext): InteractiveComparisonScope[] {
  const scopes: InteractiveComparisonScope[] = [];

  const addScope = (id: string, label: string, stationIds: Set<string> | null) => {
    const daily = aggregateScopeDaily(context, stationIds);
    const latest = daily[daily.length - 1]?.day;
    if (!latest) {
      return;
    }

    const byDay = new Map(daily.map((row) => [row.day, row]));
    const range = (start: string, end: string) =>
      daily.filter((row) => row.day >= start && row.day <= end);
    const single = (day: string) => {
      const row = byDay.get(day);
      return row ? [row] : [];
    };

    const href = id === 'city' ? appRoutes.dashboardConclusions() : appRoutes.districtDetail(id);
    const options = [
      buildPeriodOption('today', 'Hoy', single(latest), 'Día más reciente con datos', href),
      buildPeriodOption(
        'same-weekday-last-week',
        'Mismo día de la semana anterior',
        single(shiftDay(latest, -7)),
        'Misma jornada, hace una semana',
        href
      ),
      buildPeriodOption('yesterday', 'Ayer', single(shiftDay(latest, -1)), 'Jornada anterior', href),
      buildPeriodOption('last-7d', 'Últimos 7 días', range(shiftDay(latest, -6), latest), 'Ventana reciente', href),
      buildPeriodOption(
        'previous-7d',
        '7 días previos',
        range(shiftDay(latest, -13), shiftDay(latest, -7)),
        'Ventana previa',
        href
      ),
      buildPeriodOption('last-30d', 'Últimos 30 días', range(shiftDay(latest, -29), latest), 'Ventana reciente', href),
      buildPeriodOption(
        'previous-30d',
        '30 días previos',
        range(shiftDay(latest, -59), shiftDay(latest, -30)),
        'Ventana previa',
        href
      ),
    ].filter((option): option is InteractiveComparisonOption => Boolean(option));

    if (options.length < 2) {
      return;
    }

    scopes.push({
      id,
      label,
      options,
      defaultLeftId: options.find((option) => option.id === 'today')?.id ?? options[0]?.id ?? null,
      defaultRightId:
        options.find((option) => option.id === 'same-weekday-last-week')?.id ??
        options[1]?.id ??
        null,
    });
  };

  addScope('city', 'Toda la red', null);

  for (const district of context.districtRows) {
    const stations = context.stationsByDistrict.get(district.slug) ?? [];
    if (stations.length === 0) {
      continue;
    }
    addScope(district.slug, district.name, new Set(stations.map((station) => station.id)));
  }

  return scopes;
}

function buildComparisonPresets(
  context: DerivedComparisonContext,
  dimensions: InteractiveComparisonDimension[]
): ComparisonPreset[] {
  const presets: ComparisonPreset[] = [];
  const stationsDimension = dimensions.find((dimension) => dimension.id === 'stations');
  const districtsDimension = dimensions.find((dimension) => dimension.id === 'districts');
  const periodsDimension = dimensions.find((dimension) => dimension.id === 'periods');

  const topStationId =
    context.topStation?.stationId ?? stationsDimension?.options[0]?.id ?? null;
  if (topStationId) {
    const nearestId = findNearestStationId(context, topStationId);
    if (nearestId) {
      presets.push({
        id: 'nearest-alternative',
        emoji: '🔄',
        label: 'Estación A vs. su alternativa más cercana',
        description: 'Disponibilidad y fiabilidad frente a la estación más próxima.',
        dimensionId: 'stations',
        leftId: topStationId,
        rightId: nearestId,
        requiresGeolocation: true,
      });
    }
  }

  if (districtsDimension?.options.some((option) => option.kind === 'city-average')) {
    presets.push({
      id: 'district-vs-city',
      emoji: '🏙️',
      label: `Un barrio vs. media de ${context.cityName}`,
      description: 'Contextualiza un distrito frente al conjunto de la red.',
      dimensionId: 'districts',
      leftId: context.topDistrict?.slug ?? null,
      rightId: CITY_AVERAGE_ID,
    });
  }

  if (periodsDimension?.scopes && periodsDimension.scopes.length > 0) {
    const scope = periodsDimension.scopes[0];
    presets.push({
      id: 'today-vs-last-week',
      emoji: '📅',
      label: 'Hoy vs. mismo día de la semana anterior',
      description: 'Comprueba si la saturación de hoy es un hecho aislado o un patrón semanal.',
      dimensionId: 'periods',
      leftId: scope?.defaultLeftId ?? 'today',
      rightId: scope?.defaultRightId ?? 'same-weekday-last-week',
    });
  }

  if (stationsDimension) {
    presets.push({
      id: 'saved-stations',
      emoji: '⭐',
      label: 'Estaciones guardadas en este dispositivo',
      description: 'Vuelve a tus comparaciones frecuentes guardadas con la estrella.',
      dimensionId: 'stations',
      leftId: null,
      rightId: null,
      requiresFavorites: true,
    });
  }

  return presets;
}

function buildPeriodOptions(
  sortedRecentDemand: DailyDemandInput[]
): InteractiveComparisonOption[] {
  const options: InteractiveComparisonOption[] = [];

  const appendPeriodOption = (
    id: string,
    label: string,
    rows: DailyDemandInput[],
    notePrefix: string
  ) => {
    if (rows.length === 0) {
      return;
    }

    const demandAverage = averageOrNull(rows.map((row) => Number(row.demandScore)));
    const occupancyAverage = averageOrNull(rows.map((row) => Number(row.avgOccupancy)));
    const totalSamples = rows.reduce((sum, row) => sum + Number(row.sampleCount), 0);
    const rangeLabel =
      rows.length > 1
        ? `${rows[0]?.day ?? ''} -> ${rows[rows.length - 1]?.day ?? ''}`
        : rows[0]?.day ?? '';

    options.push({
      id,
      label,
      href: appRoutes.dashboardConclusions(),
      primaryLabel: 'Demanda media',
      primaryValue: demandAverage,
      primaryDisplay: `${formatDecimal(demandAverage ?? 0)} ${movementUnits.perDay}`,
      secondaryLabel: 'Ocupación media',
      secondaryDisplay: formatPercent(occupancyAverage),
      tertiaryLabel: 'Cobertura',
      tertiaryDisplay: `${formatInteger(totalSamples)} muestras`,
      note: `${notePrefix}: ${rangeLabel}`,
    });
  };

  appendPeriodOption('last-7d', 'Últimos 7 días', sortedRecentDemand.slice(-7), 'Ventana reciente');
  appendPeriodOption(
    'previous-7d',
    '7 días previos',
    sortedRecentDemand.slice(-14, -7),
    'Ventana previa'
  );
  appendPeriodOption(
    'last-30d',
    'Últimos 30 días',
    sortedRecentDemand.slice(-30),
    'Ventana reciente'
  );
  appendPeriodOption(
    'previous-30d',
    '30 días previos',
    sortedRecentDemand.slice(-60, -30),
    'Ventana previa'
  );

  return options;
}

function buildInteractiveComparisonData(
  context: DerivedComparisonContext
): InteractiveComparisonData {
  const periodOptions = buildPeriodOptions(context.sortedRecentDemand);
  const periodScopes = buildPeriodScopes(context);

  const dimensions = [
    buildInteractiveDimension({
      id: 'stations',
      label: 'Estaciones',
      description:
        'Compara dos estaciones concretas por giro, fiabilidad y disponibilidad franja a franja.',
      primary: true,
      options: [...context.stations]
        .sort((left, right) => left.name.localeCompare(right.name, 'es'))
        .map((station) => {
          const turnoverScore = context.turnoverMap.get(station.id) ?? null;
          const availabilityHours = context.availabilityMap.get(station.id) ?? null;
          const hourly = context.hourlyByStation.get(station.id) ?? [];
          const bands = buildBands([hourly], Number(station.capacity) || 0);

          return {
            id: station.id,
            label: `${station.name} (${station.id})`,
            href: appRoutes.dashboardStation(station.id),
            primaryLabel: 'Giro',
            primaryValue: turnoverScore,
            primaryDisplay: `${formatDecimal(turnoverScore ?? 0)} ${movementUnits.total}`,
            secondaryLabel: 'Snapshot',
            secondaryDisplay: `${station.bikesAvailable}/${station.capacity} bicis`,
            tertiaryLabel: 'Horas sin servicio',
            tertiaryDisplay: `${formatDecimal(availabilityHours ?? 0)} h`,
            note: `Última muestra ${formatRecordedAtSummary(station.recordedAt)}`,
            metrics: buildStationMetrics({ station, turnoverScore, availabilityHours, bands }),
            bands,
            reliabilityScore: computeReliability([hourly]),
            lat: station.lat,
            lon: station.lon,
            kind: 'entity' as const,
          };
        }),
      defaultLeftId: context.topStation?.stationId ?? null,
      defaultRightId: context.secondStation?.stationId ?? null,
    }),
    buildInteractiveDimension({
      id: 'districts',
      label: 'Barrios',
      description:
        'Enfrenta dos barrios (o un barrio con la media de la ciudad) con estaciones, disponibilidad y giro medio.',
      primary: true,
      options: [
        ...(context.districtRows.length > 1 ? [buildCityAverageOption(context)] : []),
        ...[...context.districtRows]
          .sort((left, right) => left.name.localeCompare(right.name, 'es'))
          .map((district) => {
            const stationRowSets = (context.stationsByDistrict.get(district.slug) ?? []).map(
              (station) => context.hourlyByStation.get(station.id) ?? []
            );
            const bands = buildBands(stationRowSets, Number(district.capacity) || 0);

            return {
              id: district.slug,
              label: district.name,
              href: appRoutes.districtDetail(district.slug),
              primaryLabel: 'Giro medio',
              primaryValue: district.avgTurnover,
              primaryDisplay: `${formatDecimal(district.avgTurnover)} ${movementUnits.total}`,
              secondaryLabel: 'Estaciones',
              secondaryDisplay: `${formatInteger(district.stationCount)} estaciones`,
              tertiaryLabel: 'Bicis disponibles',
              tertiaryDisplay: `${formatInteger(district.bikesAvailable)} bicis`,
              note: `Riesgo medio ${formatDecimal(district.avgAvailabilityRisk)} h sin servicio`,
              metrics: buildDistrictMetrics(district),
              bands,
              reliabilityScore: computeReliability(stationRowSets),
              kind: 'entity' as const,
            };
          }),
      ],
      defaultLeftId: context.topDistrict?.slug ?? null,
      defaultRightId: context.bottomDistrict?.slug ?? null,
    }),
    buildInteractiveDimension({
      id: 'months',
      label: 'Meses',
      description:
        'Permite elegir dos meses concretos del histórico publicado y comparar demanda, ocupación y red activa.',
      options: [...context.monthlySeries]
        .sort((left, right) => right.monthKey.localeCompare(left.monthKey, 'es'))
        .map((row) => ({
          id: row.monthKey,
          label: formatMonthLabel(row.monthKey),
          href: appRoutes.reportMonth(row.monthKey),
          primaryLabel: 'Demanda mensual',
          primaryValue: Number(row.demandScore),
          primaryDisplay: `${formatInteger(Number(row.demandScore))} ${movementUnits.total}`,
          secondaryLabel: 'Ocupación media',
          secondaryDisplay: formatPercent(Number(row.avgOccupancy)),
          tertiaryLabel: 'Estaciones activas',
          tertiaryDisplay: `${formatInteger(Number(row.activeStations))} estaciones`,
          note: `${formatInteger(Number(row.sampleCount))} muestras agregadas`,
        })),
      defaultLeftId: context.latestMonthlyRow?.monthKey ?? null,
      defaultRightId: context.previousMonthlyRow?.monthKey ?? null,
    }),
    buildInteractiveDimension({
      id: 'years',
      label: 'Años',
      description:
        'Compara dos años completos agregando los meses disponibles para cada periodo.',
      options: [...context.yearlyRows]
        .sort((left, right) => right.year.localeCompare(left.year, 'es'))
        .map((row) => ({
          id: row.year,
          label: row.year,
          href: appRoutes.reports(),
          primaryLabel: 'Demanda anual',
          primaryValue: row.demandScore,
          primaryDisplay: `${formatInteger(row.demandScore)} ${movementUnits.total}`,
          secondaryLabel: 'Ocupación media',
          secondaryDisplay: formatPercent(averageOrNull(row.occupancyValues)),
          tertiaryLabel: 'Estaciones activas medias',
          tertiaryDisplay: `${formatDecimal(averageOrNull(row.activeStations) ?? 0)} estaciones`,
          note: `${row.activeStations.length} meses con datos`,
        })),
      defaultLeftId: context.latestYear?.year ?? null,
      defaultRightId: context.previousYear?.year ?? null,
    }),
    buildInteractiveDimension({
      id: 'hours',
      label: 'Horas',
      description:
        'Selecciona dos horas del día para comparar ritmo medio, ocupación y muestras acumuladas.',
      options: [...context.hourlyProfile]
        .sort((left, right) => Number(left.hour) - Number(right.hour))
        .map((row) => ({
          id: String(row.hour),
          label: `${row.hour}:00`,
          href: appRoutes.dashboardView('research'),
          primaryLabel: 'Bicis disponibles',
          primaryValue: Number(row.avgBikesAvailable),
          primaryDisplay: `${formatDecimal(Number(row.avgBikesAvailable))} bicis`,
          secondaryLabel: 'Ocupación media',
          secondaryDisplay: formatPercent(Number(row.avgOccupancy)),
          tertiaryLabel: 'Muestras',
          tertiaryDisplay: `${formatInteger(Number(row.sampleCount))} muestras`,
        })),
      defaultLeftId: context.peakHour ? String(context.peakHour.hour) : null,
      defaultRightId: context.quietHour ? String(context.quietHour.hour) : null,
    }),
    buildInteractiveDimension({
      id: 'periods',
      label: 'Periodos',
      description:
        'Compara dos periodos del mismo ámbito: hoy, el mismo día de la semana anterior o ventanas móviles.',
      primary: true,
      options: periodScopes[0]?.options ?? periodOptions,
      defaultLeftId:
        periodScopes[0]?.defaultLeftId ??
        periodOptions.find((option) => option.id === 'last-7d')?.id ??
        null,
      defaultRightId:
        periodScopes[0]?.defaultRightId ??
        periodOptions.find((option) => option.id === 'previous-30d')?.id ??
        null,
      scopes: periodScopes,
    }),
  ].filter((dimension): dimension is InteractiveComparisonDimension => Boolean(dimension));

  return {
    defaultDimensionId: dimensions[0]?.id ?? null,
    dimensions,
    presets: buildComparisonPresets(context, dimensions),
  };
}

export function buildComparisonHubViewModel(
  input: ComparisonHubViewModelInput
): {
  interactive: InteractiveComparisonData;
  sections: ComparisonSection[];
} {
  const context = deriveComparisonContext(input);

  return {
    interactive: buildInteractiveComparisonData(context),
    sections: [
      {
        id: 'current',
        title: 'Comparativas operativas',
        description:
          'Lecturas directas para comparar estaciones, barrios, franjas horarias y comportamiento laboral frente al fin de semana.',
        cards: buildCurrentCards(context),
      },
      {
        id: 'historical',
        title: 'Comparativas históricas',
        description:
          'Cortes temporales para comparar meses, años, periodos y grandes cambios en la red o en la demanda.',
        cards: buildHistoricalCards(context),
      },
      {
        id: 'changes',
        title: 'Cambios detectados',
        description:
          'Deltas recientes de rankings, demanda y balance para entender si el sistema mejora, empeora o gira de lideres.',
        cards: buildChangeCards(context),
      },
    ],
  };
}
