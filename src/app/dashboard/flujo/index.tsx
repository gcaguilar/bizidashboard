import { createFileRoute } from '@tanstack/react-router';
import { appRoutes } from '@/lib/routes'
import { buildSeoHead } from '@/lib/seo-head'
import { Suspense } from 'react';
import { z } from 'zod';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { DashboardPageViewTracker } from '@/app/dashboard/_components/DashboardPageViewTracker';
import { GitHubRepoButton } from '@/app/dashboard/_components/GitHubRepoButton';
import { MonthFilter } from '@/app/dashboard/_components/MonthFilter';
import { MobilityInsights } from '@/app/dashboard/_components/MobilityInsights';
import { PageHeaderCard } from '@/components/layout/page-header-card';
import { PageShell } from '@/components/layout/page-shell';
import { getDashboardFlowPageData } from '@/server-functions/dashboard-flujo';
import { PERIODS } from '@/app/dashboard/_components/mobility-insights-model';

// Dashboard sections contract: dashboard, stations, flow, conclusions, redistribucion, help.

export const Route = createFileRoute('/dashboard/flujo/')({
  validateSearch: z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    period: z.enum(PERIODS.map((period) => period.key) as [string, ...string[]]).optional(),
  }),
  head: () =>
    buildSeoHead({
      title: 'Analisis de flujo - Dashboard Bizi',
      description: 'Analiza patrones de movimiento de Bizi Zaragoza, demanda por horas y diferencias entre zonas.',
      path: appRoutes.dashboardFlow(),
      robots: 'noindex, nofollow',
    }),
  loaderDeps: ({ search }) => ({
    month: search.month,
  }),
  loader: async ({ deps }) =>
    getDashboardFlowPageData({ data: { month: deps.month } }),
  component: DashboardFlowPage,
});

export default function DashboardFlowPage() {
  const { stations, availableMonths, activeMonth, selectedStationId, breadcrumbs, structuredData } = Route.useLoaderData();

  return (
    <PageShell>
      <DashboardPageViewTracker routeKey="dashboard_flow" pageType="dashboard" template="flow_analysis" />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PageHeaderCard>
        <SiteBreadcrumbs items={breadcrumbs} className="mb-3" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">Dashboard</p>
            <h1 className="text-lg font-bold text-[var(--foreground)]">Flujo</h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <GitHubRepoButton />
          </div>
        </div>
      </PageHeaderCard>

      <Suspense>
        <MonthFilter
          months={availableMonths.months}
          activeMonth={activeMonth}
          routeKey="dashboard_flow"
          source="dashboard_flow"
        />
      </Suspense>

      <Suspense>
        <MobilityInsights
          stations={stations.stations}
          selectedStationId={selectedStationId}
          mobilityDays={14}
          demandDays={30}
        />
      </Suspense>
    </PageShell>
  );
}
