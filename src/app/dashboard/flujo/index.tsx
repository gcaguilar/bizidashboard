import { createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { DashboardRouteLinks } from '@/app/dashboard/_components/DashboardRouteLinks';
import { DashboardPageViewTracker } from '@/app/dashboard/_components/DashboardPageViewTracker';
import { GitHubRepoButton } from '@/app/dashboard/_components/GitHubRepoButton';
import { MonthFilter } from '@/app/dashboard/_components/MonthFilter';
import { MobilityInsights } from '@/app/dashboard/_components/MobilityInsights';
import { ThemeToggleButton } from '@/app/dashboard/_components/ThemeToggleButton';
import { PageHeaderCard } from '@/components/layout/page-header-card';
import { PageShell } from '@/components/layout/page-shell';
import { getDashboardFlowPageData } from '@/server-functions/dashboard-flujo';
import { getSiteUrl } from '@/lib/site';

export const Route = createFileRoute('/dashboard/flujo/')({
  head: () => {
    const siteUrl = getSiteUrl()
    const title = 'Analisis de flujo - Dashboard Bizi'
    const description = 'Analiza patrones de movimiento de Bizi Zaragoza, demanda por horas y diferencias entre zonas.'
    return {
      meta: [
        { title },
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/dashboard/flujo` },
        { name: 'robots', content: 'noindex, nofollow' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}/dashboard/flujo` }],
      title,
    }
  },
  loader: async ({ location }) => getDashboardFlowPageData({ data: Object.fromEntries(new URLSearchParams(location.searchStr)) }),
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
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-[var(--primary)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-black text-white">
                B
              </div>
              <h1 className="text-lg font-bold text-[var(--foreground)]">Bizi Zaragoza</h1>
            </div>
            <DashboardRouteLinks
              activeRoute="flow"
              routes={['dashboard', 'stations', 'flow', 'conclusions', 'redistribucion', 'help']}
              variant="inline"
              className="hidden items-center gap-5 md:flex"
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <DashboardRouteLinks
              activeRoute="flow"
              routes={['dashboard', 'stations', 'flow', 'conclusions', 'redistribucion', 'help']}
              variant="chips"
              className="flex flex-wrap items-center gap-2 md:hidden"
            />
            <ThemeToggleButton />
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
