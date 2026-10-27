import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales';
import { translate } from '@/lib/i18n/messages';
import type {
  CoverageSummary,
  PipelineStatusSummary,
} from '@/services/shared-data/types';

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
  locale?: Locale;
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
  compareCoverageDays = true,
}: CollectionStateInput & { expectedDays?: number; compareCoverageDays?: boolean }): DataState {
  const normalizedCount = normalizeCount(count);
  const normalizedExpectedDays = normalizeCount(expectedDays);

  return resolveDataState({
    hasCoverage: hasCoverageData(coverage),
    hasData: normalizedCount > 0,
    isPartial:
      normalizedCount > 0 &&
      ((normalizedExpectedDays > 0 && normalizedCount < normalizedExpectedDays) ||
        (compareCoverageDays && normalizeCount(coverage?.totalDays) > normalizedCount)),
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
  const locale = options.locale ?? DEFAULT_LOCALE;
  const subject = options.subject ?? translate(locale, 'dataState.defaultSubject');

  switch (state) {
    case 'loading':
      return {
        state,
        label: translate(locale, 'dataState.loading.label'),
        title: translate(locale, 'dataState.loading.title'),
        description:
          options.loadingDescription ?? translate(locale, 'dataState.loading.description', { subject }),
        toneClasses:
          'border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--foreground)]',
        badgeClasses:
          'border-[var(--primary)]/30 bg-[var(--primary)]/15 text-[var(--primary)]',
      };
    case 'empty':
      return {
        state,
        label: translate(locale, 'dataState.empty.label'),
        title: translate(locale, 'dataState.empty.title'),
        description:
          options.emptyDescription ??
          translate(locale, 'dataState.empty.description', { subject }),
        toneClasses:
          'border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]',
        badgeClasses:
          'border-[var(--border)] bg-[var(--muted)]/15 text-[var(--muted)]',
      };
    case 'no_coverage':
      return {
        state,
        label: translate(locale, 'dataState.no_coverage.label'),
        title: translate(locale, 'dataState.no_coverage.title'),
        description:
          options.noCoverageDescription ??
          translate(locale, 'dataState.no_coverage.description', { subject }),
        toneClasses:
          'border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]',
        badgeClasses:
          'border-[var(--border)] bg-[var(--muted)]/15 text-[var(--muted)]',
      };
    case 'partial':
      return {
        state,
        label: translate(locale, 'dataState.partial.label'),
        title: translate(locale, 'dataState.partial.title'),
        description:
          options.partialDescription ??
          translate(locale, 'dataState.partial.description', { subject }),
        toneClasses:
          'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--foreground)]',
        badgeClasses:
          'border-[var(--warning)]/30 bg-[var(--warning)]/15 text-[var(--warning)]',
      };
    case 'stale':
      return {
        state,
        label: translate(locale, 'dataState.stale.label'),
        title: translate(locale, 'dataState.stale.title'),
        description:
          options.staleDescription ??
          translate(locale, 'dataState.stale.description', { subject }),
        toneClasses:
          'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--foreground)]',
        badgeClasses:
          'border-[var(--warning)]/30 bg-[var(--warning)]/15 text-[var(--warning)]',
      };
    case 'error':
      return {
        state,
        label: translate(locale, 'dataState.error.label'),
        title: translate(locale, 'dataState.error.title'),
        description:
          options.errorDescription ??
          translate(locale, 'dataState.error.description', { subject }),
        toneClasses:
          'border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--foreground)]',
        badgeClasses:
          'border-[var(--danger)]/30 bg-[var(--danger)]/15 text-[var(--danger)]',
      };
    case 'ok':
    default:
      return {
        state: 'ok',
        label: translate(locale, 'dataState.ok.label'),
        title: translate(locale, 'dataState.ok.title'),
        description:
          options.okDescription ?? translate(locale, 'dataState.ok.description', { subject }),
        toneClasses:
          'border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--foreground)]',
        badgeClasses:
          'border-[var(--success)]/30 bg-[var(--success)]/15 text-[var(--success)]',
      };
  }
}
