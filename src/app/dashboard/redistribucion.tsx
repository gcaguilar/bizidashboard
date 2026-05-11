import { Link, createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { fetchAvailableDataMonths, fetchStations } from '@/lib/api';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { normalizeMonthSearchParam, resolveActiveMonth } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { getSiteUrl, SITE_NAME } from '@/lib/site';
import { DashboardRouteLinks } from '@/app/dashboard/_components/DashboardRouteLinks';
import { DashboardPageViewTracker } from '@/app/dashboard/_components/DashboardPageViewTracker';
import { GitHubRepoButton } from '@/app/dashboard/_components/GitHubRepoButton';
import { MonthFilter } from '@/app/dashboard/_components/MonthFilter';
import { MobilityInsights } from '@/app/dashboard/_components/MobilityInsights';
import { ThemeToggleButton } from '@/app/dashboard/_components/ThemeToggleButton';
import { PageHeaderCard } from '@/components/layout/page-header-card';
import { PageShell } from '@/components/layout/page-shell';

export const Route = createFileRoute('/dashboard/redistribucion')({
  head: () => ({
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
    title: 'Redistribución | Dashboard Bizi',
  }),
  loader: async ({ searchParams }) => {
    const params = searchParams ? await searchParams : {};
    const getFirst = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v;
    const sort = getFirst(params.sort);
    const filter = getFirst(params.filter);
    const search = getFirst(params.search);
    const page = getFirst(params.page);
    const pageSize = getFirst(params.pageSize);
    const tableParams = {
      sort: sort?.includes(':') ? sort : undefined,
      filter: filter?.includes(':') ? filter : undefined,
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    };

    const { buildRebalancingReport } = await import('@/lib/rebalancing-report');
    const { fetchDistrictCollection } = await import('@/lib/districts');
    const [report, districtCollection] = await Promise.all([
      buildRebalancingReport({ days: 15 }),
      fetchDistrictCollection().catch(() => null),
    ]);

    const districtNames = districtCollection
      ? [...new Set(districtCollection.features
          .map((f) => f.properties?.distrito)
          .filter((d): d is string => typeof d === 'string')
        )].sort((a, b) => a.localeCompare(b, 'es'))
      : [];

    return {
      report,
      districtNames,
      tableParams,
    };
  },
  component: RedistribucionPage,
});

export default function RedistribucionPage() {
  const { report, districtNames, tableParams } = Route.useLoaderData();
  const { RedistribucionClient } = require('@/app/dashboard/redistribucion/_components/RedistribucionClient');
  return (
    <RedistribucionClient
      initialReport={report}
      districtNames={districtNames}
      tableParams={tableParams}
    />
  );
}
