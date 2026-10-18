import { createServerFn } from '@tanstack/react-start';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { combineDataStates, resolveDataState } from '@/lib/data-state';
import { formatMonthLabel, isValidMonthKey, previousMonthKey, REPORT_MONTHS_WINDOW } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { buildFallbackDatasetSnapshot } from '@/services/shared-data';
import { getSiteUrl, SEO_SITE_NAME } from '@/lib/site';
import { buildItemListStructuredData } from '@/lib/structured-data';
import { buildMonthlyTemporalComparison, buildPeriodCoverage } from '@/lib/temporal-comparison';

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

function filterMonthsWithSeries(months: string[], monthlySeries: Array<{ monthKey: string }>): string[] {
  const seriesMonthSet = new Set(monthlySeries.map((row) => row.monthKey));
  const filtered = months.filter((month) => seriesMonthSet.has(month));
  return filtered.length > 0 ? filtered : months;
}

export const getReportsIndexPageData = createServerFn({ method: 'GET' }).handler(async () => {
  const [{ fetchCachedDailyDemandCurve, fetchCachedMonthlyDemandCurve }, { fetchAvailableDataMonths, fetchHistoryMetadata, fetchSharedDatasetSnapshot, fetchStatus }] = await Promise.all([
    import('@/lib/analytics-series'),
    import('@/lib/api'),
  ]);
  const siteUrl = getSiteUrl();
  const nowIso = new Date().toISOString();
  const [monthsResponse, monthlySeries, recentDemand, dataset, historyMeta, status] = await Promise.all([
    fetchAvailableDataMonths().catch((error) => {
      captureExceptionWithContext(error, {
        area: 'reports.index',
        operation: 'fetchAvailableDataMonths',
        dedupeKey: 'reports.index.fetchAvailableDataMonths.failed',
      });
      return { months: [], generatedAt: new Date().toISOString() };
    }),
    fetchCachedMonthlyDemandCurve(REPORT_MONTHS_WINDOW).catch(() => []),
    fetchCachedDailyDemandCurve(90).catch(() => []),
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
  const fallbackMonths = mergeMonthCandidates([
    ...historyFallbackMonths,
    ...resolveSnapshotMonthFallback(dataset.lastUpdated.lastSampleAt),
  ]);
  const monthsSource = discoveredMonths.length > 0 ? discoveredMonths : fallbackMonths;
  const months = filterMonthsWithSeries(monthsSource, monthlySeries);
  const monthMap = Object.fromEntries(monthlySeries.map((row) => [row.monthKey, row]));
  const latestMonth = months[0] ?? null;
  const recentDemandRows = recentDemand.map((row) => ({
    day: row.day,
    demandScore: Number(row.demandScore),
    sampleCount: Number(row.sampleCount),
  }));
  const latestPeriodCoverage = latestMonth
    ? buildPeriodCoverage(latestMonth, recentDemandRows, nowIso)
    : null;
  // Comparativa del ultimo mes normalizada por cobertura: comparte la misma
  // logica que el informe mensual, de modo que el chip del indice y la ficha del
  // mes no pueden discrepar.
  const latestComparison = latestMonth
    ? buildMonthlyTemporalComparison({
        monthKey: latestMonth,
        referenceMonthKey: previousMonthKey(latestMonth),
        rows: recentDemandRows,
        nowIso,
      })
    : null;
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
        name: SEO_SITE_NAME,
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
    latestPeriodCoverage,
    latestTrend: latestComparison?.normalizedDemandRatio ?? null,
    latestComparisonLabel: latestComparison?.periodLabel ?? null,
    currentMonth: nowIso.slice(0, 7),
    reportsDataState,
    breadcrumbs,
    structuredData,
  };
});
