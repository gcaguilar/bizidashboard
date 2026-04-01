import type { StationSnapshot } from '@/lib/api';
import type { MobilityConclusionsPayload } from '@/lib/mobility-conclusions';
import { formatMonthLabel } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import type { DistrictSeoRow } from '@/lib/seo-districts';
import type {
  ComparisonCard,
  ComparisonSection,
  InteractiveComparisonData,
  InteractiveComparisonDimension,
  InteractiveComparisonDimensionId,
  InteractiveComparisonOption,
} from '@/lib/comparison-hub';

const integerFormatter = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });
const decimalFormatters = new Map<number, Intl.NumberFormat>();
const percentFormatter = new Intl.NumberFormat('es-ES', {
  style: 'percent',
  maximumFractionDigits: 0,
});

type HistoryCompareRow = {
  day: string;
  demandScore: number;
  avgOccupancy: number;
  balanceIndex: number;
  sampleCount: number;
};

type StationComparisonSnapshot = Omit<
  Pick<StationSnapshot, 'id' | 'name' | 'bikesAvailable' | 'capacity' | 'recordedAt'>,
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
  latestMonth: string | null;
  previousMonth: string | null;
  recentPayload: MobilityConclusionsPayload | null;
  latestMonthPayload: MobilityConclusionsPayload | null;
  previousMonthPayload: MobilityConclusionsPayload | null;
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
      title: 'Estacion vs estacion',
      eyebrow: 'Comparativa operativa',
      summary: `${topStationMeta?.name ?? context.topStation.stationId} lidera el uso relativo frente a ${secondStationMeta?.name ?? context.secondStation.stationId}.`,
      metricA: `${topStationMeta?.name ?? context.topStation.stationId}: giro ${formatDecimal(Number(context.topStation.turnoverScore))} · ${topStationMeta?.bikesAvailable ?? 0}/${topStationMeta?.capacity ?? 0} bicis`,
      metricB: `${secondStationMeta?.name ?? context.secondStation.stationId}: giro ${formatDecimal(Number(context.secondStation.turnoverScore))} · ${secondStationMeta?.bikesAvailable ?? 0}/${secondStationMeta?.capacity ?? 0} bicis`,
      delta: `Brecha de actividad ${formatDelta(demandGap)}`,
      href: appRoutes.dashboardStations(),
      note: `Riesgo de disponibilidad: ${formatDecimal(context.availabilityMap.get(context.topStation.stationId) ?? 0)} vs ${formatDecimal(context.availabilityMap.get(context.secondStation.stationId) ?? 0)} horas problema.`,
    });
  } else {
    cards.push(
      buildUnavailableCard(
        'station-vs-station',
        'Estacion vs estacion',
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
      summary: `${context.topDistrict.name} concentra la mayor actividad relativa mientras ${context.bottomDistrict.name} se comporta como el extremo mas calmado.`,
      metricA: `${context.topDistrict.name}: ${formatDecimal(context.topDistrict.avgTurnover)} pts · ${context.topDistrict.stationCount} estaciones`,
      metricB: `${context.bottomDistrict.name}: ${formatDecimal(context.bottomDistrict.avgTurnover)} pts · ${context.bottomDistrict.stationCount} estaciones`,
      delta: `Brecha territorial ${formatDelta(districtGap)}`,
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
      eyebrow: 'Patron de uso',
      summary:
        context.weekdayWeekendProfile.dominantPeriod === 'weekend'
          ? 'La red rinde mas en fin de semana que entre semana.'
          : 'La red rinde mas entre semana que en fin de semana.',
      metricA: `Laboral: ${formatDecimal(context.weekdayWeekendProfile.weekday.avgDemand)} pts/dia · ocupacion ${formatPercent(context.weekdayWeekendProfile.weekday.avgOccupancy)}`,
      metricB: `Fin de semana: ${formatDecimal(context.weekdayWeekendProfile.weekend.avgDemand)} pts/dia · ocupacion ${formatPercent(context.weekdayWeekendProfile.weekend.avgOccupancy)}`,
      delta: `Diferencia relativa ${formatDelta(context.weekdayWeekendProfile.demandGapRatio)}`,
      href: context.latestMonth
        ? appRoutes.reportMonth(context.latestMonth)
        : appRoutes.dashboardConclusions(),
      note: `${context.weekdayWeekendProfile.weekday.daysCount} dias laborables comparados con ${context.weekdayWeekendProfile.weekend.daysCount} dias de fin de semana.`,
    });
  } else {
    cards.push(
      buildUnavailableCard(
        'weekday-vs-weekend',
        'Laboral vs fin de semana',
        'Patron de uso',
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
      summary: `La hora ${context.peakHour?.hour ?? '--'}:00 concentra el mayor movimiento medio del sistema, frente a la franja mas tranquila.`,
      metricA: `${context.peakHour?.hour ?? '--'}:00 · ${formatDecimal(Number(context.peakHour?.avgBikesAvailable ?? 0))} bicis disponibles · ocupacion ${formatPercent(Number(context.peakHour?.avgOccupancy ?? 0))}`,
      metricB: `${context.quietHour?.hour ?? '--'}:00 · ${formatDecimal(Number(context.quietHour?.avgBikesAvailable ?? 0))} bicis disponibles · ocupacion ${formatPercent(Number(context.quietHour?.avgOccupancy ?? 0))}`,
      delta: `Brecha horaria ${formatDelta(hourGap)}`,
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
    const monthDelta =
      Number(context.previousMonthlyRow.demandScore) > 0
        ? (Number(context.latestMonthlyRow.demandScore) -
            Number(context.previousMonthlyRow.demandScore)) /
          Number(context.previousMonthlyRow.demandScore)
        : null;

    cards.push({
      id: 'month-vs-month',
      title: 'Mes vs mes',
      eyebrow: 'Cambio mensual',
      summary: `${formatMonthLabel(context.latestMonthlyRow.monthKey)} se compara con ${formatMonthLabel(context.previousMonthlyRow.monthKey)} en demanda, ocupacion y estaciones activas.`,
      metricA: `${formatMonthLabel(context.latestMonthlyRow.monthKey)}: ${formatInteger(Number(context.latestMonthlyRow.demandScore))} pts · ocupacion ${formatPercent(Number(context.latestMonthlyRow.avgOccupancy))}`,
      metricB: `${formatMonthLabel(context.previousMonthlyRow.monthKey)}: ${formatInteger(Number(context.previousMonthlyRow.demandScore))} pts · ocupacion ${formatPercent(Number(context.previousMonthlyRow.avgOccupancy))}`,
      delta: `Demanda mensual ${formatDelta(monthDelta)}`,
      href: appRoutes.reports(),
      note: `Estaciones activas ${formatInteger(Number(context.latestMonthlyRow.activeStations))} vs ${formatInteger(Number(context.previousMonthlyRow.activeStations))}.`,
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
    const yearDelta =
      context.previousYear.demandScore > 0
        ? (context.latestYear.demandScore - context.previousYear.demandScore) /
          context.previousYear.demandScore
        : null;

    cards.push({
      id: 'year-vs-year',
      title: 'Ano vs ano',
      eyebrow: 'Lectura anual',
      summary: `${context.latestYear.year} agrega ${formatInteger(context.latestYear.demandScore)} puntos de demanda frente a ${context.previousYear.year}.`,
      metricA: `${context.latestYear.year}: ${formatInteger(context.latestYear.demandScore)} pts · ocupacion media ${formatPercent(average(context.latestYear.occupancyValues))}`,
      metricB: `${context.previousYear.year}: ${formatInteger(context.previousYear.demandScore)} pts · ocupacion media ${formatPercent(average(context.previousYear.occupancyValues))}`,
      delta: `Variacion anual ${formatDelta(yearDelta)}`,
      href: appRoutes.reports(),
      note: `Red media de ${formatDecimal(average(context.latestYear.activeStations) ?? 0)} estaciones activas frente a ${formatDecimal(average(context.previousYear.activeStations) ?? 0)}.`,
    });
  } else {
    cards.push(
      buildUnavailableCard(
        'year-vs-year',
        'Ano vs ano',
        'Lectura anual',
        appRoutes.reports()
      )
    );
  }

  if (context.recentDemand.length >= 40) {
    const last7 = context.sortedRecentDemand.slice(-7);
    const previous30 = context.sortedRecentDemand.slice(-37, -7);
    const last7Demand = average(last7.map((row) => Number(row.demandScore)));
    const previous30Demand = average(previous30.map((row) => Number(row.demandScore)));
    const periodDelta =
      last7Demand !== null && previous30Demand && previous30Demand > 0
        ? (last7Demand - previous30Demand) / previous30Demand
        : null;

    cards.push({
      id: 'periods',
      title: 'Periodos',
      eyebrow: 'Ventanas comparables',
      summary:
        'La ultima semana se compara con la base movil previa de treinta dias para detectar aceleraciones o frenadas.',
      metricA: `Ultimos 7 dias: ${formatDecimal(last7Demand ?? 0)} pts/dia · ocupacion ${formatPercent(average(last7.map((row) => Number(row.avgOccupancy))))}`,
      metricB: `Base previa 30 dias: ${formatDecimal(previous30Demand ?? 0)} pts/dia · ocupacion ${formatPercent(average(previous30.map((row) => Number(row.avgOccupancy))))}`,
      delta: `Cambio de periodo ${formatDelta(periodDelta)}`,
      href: appRoutes.dashboardConclusions(),
      note: `Cobertura reciente: ${context.datasetCoverageDays} dias historicos en total.`,
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
    const beforeDemand = average(beforeSlice.map((row) => Number(row.demandScore)));
    const afterDemand = average(afterSlice.map((row) => Number(row.demandScore)));
    const expansionDelta =
      beforeDemand && beforeDemand > 0 && afterDemand !== null
        ? (afterDemand - beforeDemand) / beforeDemand
        : null;

    cards.push({
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
    cards.push(
      buildUnavailableCard(
        'before-after-expansion',
        'Antes vs despues ampliacion',
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
    const normalDemand = average(normalDays.map((row) => Number(row.demandScore)));
    const eventDelta =
      normalDemand && normalDemand > 0 && peakDay
        ? (Number(peakDay.demandScore) - normalDemand) / normalDemand
        : null;

    cards.push({
      id: 'events-vs-normal',
      title: 'Eventos vs normal',
      eyebrow: 'Pico anomalo',
      summary: `El dia ${peakDay?.day ?? 'sin fecha'} marca el mayor pico reciente y se compara con un dia normal medio del mismo tramo.`,
      metricA: `Pico anomalo: ${formatInteger(Number(peakDay?.demandScore ?? 0))} pts · ocupacion ${formatPercent(Number(peakDay?.avgOccupancy ?? 0))}`,
      metricB: `Dia normal: ${formatDecimal(normalDemand ?? 0)} pts · ocupacion ${formatPercent(average(normalDays.map((row) => Number(row.avgOccupancy))))}`,
      delta: `Exceso sobre normal ${formatDelta(eventDelta)}`,
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
        ? `${formatMonthLabel(context.latestMonthPayload.selectedMonth ?? context.latestMonth ?? '')}: ${latestLeader.stationName} · ${formatDecimal(latestLeader.avgDemand)} pts`
        : 'Sin lider mensual reciente',
      metricB: previousLeader
        ? `${formatMonthLabel(context.previousMonthPayload.selectedMonth ?? context.previousMonth ?? '')}: ${previousLeader.stationName} · ${formatDecimal(previousLeader.avgDemand)} pts`
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
        'Cambio de demanda comparando la ultima ventana de siete dias frente a la anterior.',
      metricA: `Ultimos 7 dias: ${formatInteger(context.recentPayload.metrics.demandLast7Days)} pts`,
      metricB: `7 dias previos: ${formatInteger(context.recentPayload.metrics.demandPrevious7Days)} pts`,
      delta: `Cambio de demanda ${formatDelta(context.recentPayload.metrics.demandDeltaRatio)}`,
      href: appRoutes.dashboardConclusions(),
      note: `Ultima cobertura util ${context.recentPayload.sourceLastDay ?? 'sin fecha'}.`,
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
    const last7Balance = average(last7.map((row) => Number(row.balanceIndex)));
    const previous7Balance = average(previous7.map((row) => Number(row.balanceIndex)));
    const balanceDelta =
      last7Balance !== null && previous7Balance && previous7Balance > 0
        ? (last7Balance - previous7Balance) / previous7Balance
        : null;

    cards.push({
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

    const demandAverage = average(rows.map((row) => Number(row.demandScore)));
    const occupancyAverage = average(rows.map((row) => Number(row.avgOccupancy)));
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
  appendPeriodOption(
    'last-30d',
    'Ultimos 30 dias',
    sortedRecentDemand.slice(-30),
    'Ventana reciente'
  );
  appendPeriodOption(
    'previous-30d',
    '30 dias previos',
    sortedRecentDemand.slice(-60, -30),
    'Ventana previa'
  );

  return options;
}

function buildInteractiveComparisonData(
  context: DerivedComparisonContext
): InteractiveComparisonData {
  const periodOptions = buildPeriodOptions(context.sortedRecentDemand);

  const dimensions = [
    buildInteractiveDimension({
      id: 'stations',
      label: 'Estaciones',
      description:
        'Compara manualmente dos estaciones concretas por giro, disponibilidad actual y horas problema.',
      options: [...context.stations]
        .sort((left, right) => left.name.localeCompare(right.name, 'es'))
        .map((station) => ({
          id: station.id,
          label: `${station.name} (${station.id})`,
          href: appRoutes.dashboardStation(station.id),
          primaryLabel: 'Giro',
          primaryValue: context.turnoverMap.get(station.id) ?? null,
          primaryDisplay: `${formatDecimal(context.turnoverMap.get(station.id) ?? 0)} pts`,
          secondaryLabel: 'Snapshot',
          secondaryDisplay: `${station.bikesAvailable}/${station.capacity} bicis`,
          tertiaryLabel: 'Horas problema',
          tertiaryDisplay: `${formatDecimal(context.availabilityMap.get(station.id) ?? 0)} h`,
          note: `Ultima muestra ${formatRecordedAtSummary(station.recordedAt)}`,
        })),
      defaultLeftId: context.topStation?.stationId ?? null,
      defaultRightId: context.secondStation?.stationId ?? null,
    }),
    buildInteractiveDimension({
      id: 'districts',
      label: 'Barrios',
      description:
        'Enfrenta dos barrios con datos reales de estaciones, disponibilidad y giro medio.',
      options: [...context.districtRows]
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
      defaultLeftId: context.topDistrict?.slug ?? null,
      defaultRightId: context.bottomDistrict?.slug ?? null,
    }),
    buildInteractiveDimension({
      id: 'months',
      label: 'Meses',
      description:
        'Permite elegir dos meses concretos del historico publicado y comparar demanda, ocupacion y red activa.',
      options: [...context.monthlySeries]
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
      defaultLeftId: context.latestMonthlyRow?.monthKey ?? null,
      defaultRightId: context.previousMonthlyRow?.monthKey ?? null,
    }),
    buildInteractiveDimension({
      id: 'years',
      label: 'Anos',
      description:
        'Compara dos anos completos agregando los meses disponibles para cada periodo.',
      options: [...context.yearlyRows]
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
      defaultLeftId: context.latestYear?.year ?? null,
      defaultRightId: context.previousYear?.year ?? null,
    }),
    buildInteractiveDimension({
      id: 'hours',
      label: 'Horas',
      description:
        'Selecciona dos horas del dia para comparar ritmo medio, ocupacion y muestras acumuladas.',
      options: [...context.hourlyProfile]
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
      defaultLeftId: context.peakHour ? String(context.peakHour.hour) : null,
      defaultRightId: context.quietHour ? String(context.quietHour.hour) : null,
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
    defaultDimensionId: dimensions[0]?.id ?? null,
    dimensions,
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
        title: 'Comparativas historicas',
        description:
          'Cortes temporales para comparar meses, anos, periodos y grandes cambios en la red o en la demanda.',
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
