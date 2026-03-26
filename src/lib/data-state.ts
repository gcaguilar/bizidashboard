import type {
  CoverageSummary,
  PipelineStatusSummary,
} from '@/services/shared-data';

export type DataState =
  | 'loading'
  | 'empty'
  | 'no_coverage'
  | 'partial'
  | 'stale'
  | 'error'
  | 'ok';

type CoverageLike = Pick<
  CoverageSummary,
  'generatedAt' | 'lastRecordedAt' | 'totalDays' | 'totalSamples'
>;

type StatusLike = Pick<PipelineStatusSummary, 'pipeline' | 'quality'>;

type ResolveDataStateInput = {
  isLoading?: boolean;
  error?: unknown;
  hasCoverage?: boolean;
  hasData?: boolean;
  isPartial?: boolean;
  isStale?: boolean;
};

type DataStateMeta = {
  state: DataState;
  label: string;
  title: string;
  description: string;
  toneClasses: string;
  badgeClasses: string;
};

type DataStateCopyOptions = {
  subject?: string;
  loadingDescription?: string;
  emptyDescription?: string;
  noCoverageDescription?: string;
  partialDescription?: string;
  staleDescription?: string;
  errorDescription?: string;
  okDescription?: string;
};

type CollectionStateInput = {
  count: number;
  coverage?: CoverageLike | null;
  status?: StatusLike | null;
  isPartial?: boolean;
};

function normalizeCount(value: number | null | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

export function hasCoverageData(coverage?: CoverageLike | null): boolean {
  if (!coverage) {
    return false;
  }

  return normalizeCount(coverage.totalDays) > 0 || normalizeCount(coverage.totalSamples) > 0;
}

export function isDataStateStale(status?: StatusLike | null): boolean {
  if (!status) {
    return false;
  }

  return !status.quality.freshness.isFresh;
}

export function resolveDataState({
  isLoading = false,
  error = null,
  hasCoverage = true,
  hasData = true,
  isPartial = false,
  isStale = false,
}: ResolveDataStateInput): DataState {
  if (isLoading) {
    return 'loading';
  }

  if (error) {
    return 'error';
  }

  if (!hasCoverage) {
    return 'no_coverage';
  }

  if (!hasData) {
    return 'empty';
  }

  if (isStale) {
    return 'stale';
  }

  if (isPartial) {
    return 'partial';
  }

  return 'ok';
}

export function combineDataStates(
  states: Array<DataState | null | undefined>
): DataState {
  const normalized = states.filter(Boolean) as DataState[];

  if (normalized.length === 0) {
    return 'empty';
  }

  if (normalized.includes('error')) {
    return 'error';
  }

  if (normalized.includes('loading')) {
    return 'loading';
  }

  if (normalized.every((state) => state === 'no_coverage')) {
    return 'no_coverage';
  }

  if (normalized.every((state) => state === 'empty' || state === 'no_coverage')) {
    return normalized.includes('empty') ? 'empty' : 'no_coverage';
  }

  if (normalized.includes('stale')) {
    return 'stale';
  }

  if (normalized.includes('partial')) {
    return 'partial';
  }

  if (normalized.includes('empty') || normalized.includes('no_coverage')) {
    return 'partial';
  }

  return 'ok';
}

export function resolveStatusDataState(status: StatusLike): DataState {
  const recentStations = normalizeCount(status.quality.volume.recentStationCount);
  const totalRows = normalizeCount(status.pipeline.totalRowsCollected);

  return resolveDataState({
    hasCoverage:
      recentStations > 0 || totalRows > 0 || Boolean(status.quality.freshness.lastUpdated),
    hasData:
      recentStations > 0 || totalRows > 0 || Boolean(status.quality.freshness.lastUpdated),
    isPartial:
      recentStations > 0 &&
      recentStations < normalizeCount(status.quality.volume.expectedRange.min),
    isStale: isDataStateStale(status),
  });
}

export function resolveDatasetDataState(input: {
  coverage?: CoverageLike | null;
  status?: StatusLike | null;
}): DataState {
  const coverage = input.coverage ?? null;

  return resolveDataState({
    hasCoverage: hasCoverageData(coverage),
    hasData:
      hasCoverageData(coverage) || Boolean(input.status?.quality.freshness.lastUpdated),
    isPartial:
      hasCoverageData(coverage) && normalizeCount(coverage?.totalDays) > 0 &&
      normalizeCount(coverage?.totalDays) < 30,
    isStale: isDataStateStale(input.status),
  });
}

export function resolveStationsDataState({
  count,
  coverage,
  status,
}: CollectionStateInput): DataState {
  const normalizedCount = normalizeCount(count);

  return resolveDataState({
    hasCoverage: normalizedCount > 0 || hasCoverageData(coverage),
    hasData: normalizedCount > 0,
    isPartial:
      normalizedCount > 0 &&
      Boolean(status) &&
      normalizedCount < normalizeCount(status?.quality.volume.expectedRange.min),
    isStale: normalizedCount > 0 && isDataStateStale(status),
  });
}

export function resolveRankingsDataState({
  count,
  coverage,
  status,
  requestedLimit,
}: CollectionStateInput & { requestedLimit?: number }): DataState {
  const normalizedCount = normalizeCount(count);
  const normalizedLimit = normalizeCount(requestedLimit);

  return resolveDataState({
    hasCoverage: normalizedCount > 0 || hasCoverageData(coverage),
    hasData: normalizedCount > 0,
    isPartial:
      normalizedCount > 0 &&
      normalizedLimit > 0 &&
      normalizedCount < normalizedLimit &&
      normalizeCount(coverage?.totalDays) > 0,
    isStale: normalizedCount > 0 && isDataStateStale(status),
  });
}

export function resolveHistoryDataState({
  count,
  coverage,
  status,
  expectedDays,
}: CollectionStateInput & { expectedDays?: number }): DataState {
  const normalizedCount = normalizeCount(count);
  const normalizedExpectedDays = normalizeCount(expectedDays);

  return resolveDataState({
    hasCoverage: hasCoverageData(coverage),
    hasData: normalizedCount > 0,
    isPartial:
      normalizedCount > 0 &&
      ((normalizedExpectedDays > 0 && normalizedCount < normalizedExpectedDays) ||
        normalizeCount(coverage?.totalDays) > normalizedCount),
    isStale: normalizedCount > 0 && isDataStateStale(status),
  });
}

export function resolveMobilityDataState({
  dailyDemandCount,
  hourlySignalCount,
  requestedDemandDays,
  coverage,
  status,
}: {
  dailyDemandCount: number;
  hourlySignalCount: number;
  requestedDemandDays?: number;
  coverage?: CoverageLike | null;
  status?: StatusLike | null;
}): DataState {
  const normalizedDemandCount = normalizeCount(dailyDemandCount);
  const normalizedHourlyCount = normalizeCount(hourlySignalCount);
  const hasData = normalizedDemandCount > 0 || normalizedHourlyCount > 0;

  return resolveDataState({
    hasCoverage: hasData || hasCoverageData(coverage),
    hasData,
    isPartial:
      normalizedDemandCount > 0 &&
      normalizeCount(requestedDemandDays) > 0 &&
      normalizedDemandCount < normalizeCount(requestedDemandDays),
    isStale: hasData && isDataStateStale(status),
  });
}

export function shouldShowDataStateNotice(state: DataState): boolean {
  return state !== 'ok';
}

export function getDataStateMeta(
  state: DataState,
  options: DataStateCopyOptions = {}
): DataStateMeta {
  const subject = options.subject ?? 'los datos';

  switch (state) {
    case 'loading':
      return {
        state,
        label: 'Cargando',
        title: 'Cargando datos',
        description:
          options.loadingDescription ?? `Estamos cargando ${subject}.`,
        toneClasses:
          'border-sky-500/30 bg-sky-500/10 text-sky-100',
        badgeClasses:
          'border-sky-500/30 bg-sky-500/15 text-sky-100',
      };
    case 'empty':
      return {
        state,
        label: 'Sin datos',
        title: 'Sin resultados',
        description:
          options.emptyDescription ??
          `No hay resultados disponibles para ${subject}.`,
        toneClasses:
          'border-slate-400/25 bg-slate-400/10 text-slate-100',
        badgeClasses:
          'border-slate-400/25 bg-slate-400/15 text-slate-100',
      };
    case 'no_coverage':
      return {
        state,
        label: 'Sin cobertura',
        title: 'Cobertura no disponible',
        description:
          options.noCoverageDescription ??
          `Todavia no existe cobertura suficiente para ${subject}.`,
        toneClasses:
          'border-slate-400/25 bg-slate-400/10 text-slate-100',
        badgeClasses:
          'border-slate-400/25 bg-slate-400/15 text-slate-100',
      };
    case 'partial':
      return {
        state,
        label: 'Dataset parcial',
        title: 'Cobertura parcial',
        description:
          options.partialDescription ??
          `Hay datos para ${subject}, pero la ventana disponible es parcial.`,
        toneClasses:
          'border-amber-400/30 bg-amber-400/10 text-amber-100',
        badgeClasses:
          'border-amber-400/30 bg-amber-400/15 text-amber-100',
      };
    case 'stale':
      return {
        state,
        label: 'Dataset antiguo',
        title: 'Datos desactualizados',
        description:
          options.staleDescription ??
          `Los datos disponibles para ${subject} no estan frescos y pueden haber quedado antiguos.`,
        toneClasses:
          'border-orange-400/30 bg-orange-400/10 text-orange-100',
        badgeClasses:
          'border-orange-400/30 bg-orange-400/15 text-orange-100',
      };
    case 'error':
      return {
        state,
        label: 'Error',
        title: 'Error cargando datos',
        description:
          options.errorDescription ??
          `No se pudieron cargar ${subject} ahora mismo.`,
        toneClasses:
          'border-rose-500/30 bg-rose-500/10 text-rose-100',
        badgeClasses:
          'border-rose-500/30 bg-rose-500/15 text-rose-100',
      };
    case 'ok':
    default:
      return {
        state: 'ok',
        label: 'OK',
        title: 'Datos listos',
        description:
          options.okDescription ?? `${subject} estan listos y consistentes.`,
        toneClasses:
          'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
        badgeClasses:
          'border-emerald-500/30 bg-emerald-500/15 text-emerald-100',
      };
  }
}
