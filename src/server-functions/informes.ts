import { createServerFn } from '@tanstack/react-start';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { combineDataStates, resolveDataState } from '@/lib/data-state';
import { formatMonthLabel, isValidMonthKey } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { buildFallbackDatasetSnapshot } from '@/lib/shared-data-fallbacks';
import { getSiteUrl, SITE_NAME } from '@/lib/site';
import { buildItemListStructuredData } from '@/lib/structured-data';

function resolvePublishedMonths(availableMonths: string[], monthlySeriesKeys: string[]): string[] {
  const monthSet = new Set<string>();

  for (const month of [...availableMonths, ...monthlySeriesKeys]) {
    if (isValidMonthKey(month)) {
      monthSet.add(month);
    }
  }

  return Array.from(monthSet).sort((left, right) => right.localeCompare(left));
}

function resolveSnapshotMonthFallback(lastSampleAt: string | null): string[] {
  if (!lastSampleAt) {
    return [];
  }

  const parsed = new Date(lastSampleAt);
  if (Number.isNaN(parsed.getTime())) {
    return [];
  }

  const monthKey = `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}`;
  return isValidMonthKey(monthKey) ? [monthKey] : [];
}

function mergeMonthCandidates(months: string[]): string[] {
  const set = new Set<string>();
  for (const month of months) {
    if (isValidMonthKey(month)) {
      set.add(month);
    }
  }
  return Array.from(set).sort((left, right) => right.localeCompare(left));
}

export const getReportsIndexPageData = createServerFn({ method: 'GET' }).handler(async () => {
  const [{ fetchCachedMonthlyDemandCurve }, { fetchAvailableDataMonths, fetchHistoryMetadata, fetchSharedDatasetSnapshot, fetchStatus }] = await Promise.all([
    import('@/lib/analytics-series'),
    import('@/lib/api'),
  ]);
  const siteUrl = getSiteUrl();
  const nowIso = new Date().toISOString();
  const [monthsResponse, monthlySeries, dataset, historyMeta, status] = await Promise.all([
    fetchAvailableDataMonths().catch((error) => {
      captureExceptionWithContext(error, {
        area: 'reports.index',
        operation: 'fetchAvailableDataMonths',
        dedupeKey: 'reports.index.fetchAvailableDataMonths.failed',
      });
      return { months: [], generatedAt: new Date().toISOString() };
    }),
    fetchCachedMonthlyDemandCurve(24).catch(() => []),
    fetchSharedDatasetSnapshot().catch((error) => {
      captureExceptionWithContext(error, {
        area: 'reports.index',
        operation: 'fetchSharedDatasetSnapshot',
        dedupeKey: 'reports.index.fetchSharedDatasetSnapshot.failed',
      });
      return buildFallbackDatasetSnapshot(nowIso);
    }),
    fetchHistoryMetadata().catch(() => null),
    fetchStatus().catch(() => null),
  ]);

  const discoveredMonths = mergeMonthCandidates(resolvePublishedMonths(
    monthsResponse.months,
    monthlySeries.map((row) => row.monthKey)
  ));
  const historyFallbackMonths = mergeMonthCandidates(
    [historyMeta?.coverage.lastRecordedAt, status?.pipeline.lastSuccessfulPoll]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.slice(0, 7))
  );
  const months =
    discoveredMonths.length > 0
      ? discoveredMonths
      : mergeMonthCandidates([
          ...historyFallbackMonths,
          ...resolveSnapshotMonthFallback(dataset.lastUpdated.lastSampleAt),
        ]);
  const monthMap = Object.fromEntries(monthlySeries.map((row) => [row.monthKey, row]));
  const latestMonth = months[0] ?? null;
  const reportsDataState = combineDataStates([
    dataset.dataState,
    resolveDataState({
      hasCoverage: dataset.coverage.totalDays > 0 || months.length > 0,
      hasData: months.length > 0,
      isPartial: months.length > 0 && monthlySeries.length < months.length,
    }),
  ]);
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Informes',
    href: appRoutes.reports(),
  });
  const reportListEntries = months.map((month) => ({
    name: `Informe ${formatMonthLabel(month)}`,
    url: `${siteUrl}${appRoutes.reportMonth(month)}`,
  }));

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Informes Bizi Zaragoza por mes',
        description:
          'Archivo historico de informes mensuales de Bizi Zaragoza con enlaces persistentes por mes y acceso al dashboard filtrado.',
        url: `${siteUrl}${appRoutes.reports()}`,
        inLanguage: 'es',
      },
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'Organization',
        name: SITE_NAME,
        url: siteUrl,
      },
      ...(reportListEntries.length > 0
        ? [buildItemListStructuredData('Archivo de informes mensuales', reportListEntries)]
        : []),
    ],
  };

  return {
    months,
    monthMap,
    latestMonth,
    reportsDataState,
    breadcrumbs,
    structuredData,
  };
});
