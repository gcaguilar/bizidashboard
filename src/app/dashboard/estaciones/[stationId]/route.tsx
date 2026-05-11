import { createFileRoute, redirect } from '@tanstack/react-router'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs'
import { normalizeMonthSearchParam, resolveActiveMonth } from '@/lib/months'
import { appRoutes } from '@/lib/routes'
import { buildPageMetadata } from '@/lib/seo'
import { buildFallbackStations } from '@/lib/shared-data-fallbacks'
import { DashboardRouteLinks } from '@/app/dashboard/_components/DashboardRouteLinks'
import { DashboardPageViewTracker } from '@/app/dashboard/_components/DashboardPageViewTracker'
import { GitHubRepoButton } from '@/app/dashboard/_components/GitHubRepoButton'
import { Heatmap } from '@/app/dashboard/_components/Heatmap'
import { HourlyCharts } from '@/app/dashboard/_components/HourlyCharts'
import { MethodologyPanel } from '@/app/dashboard/_components/MethodologyPanel'
import { MonthFilter } from '@/app/dashboard/_components/MonthFilter'
import { NeighborhoodMiniMap } from '@/app/dashboard/_components/NeighborhoodMiniMap'
import { StationDetailPanel } from '@/app/dashboard/_components/StationDetailPanel'
import { ThemeToggleButton } from '@/app/dashboard/_components/ThemeToggleButton'
import { PageHeaderCard } from '@/components/layout/page-header-card'
import { PageShell } from '@/components/layout/page-shell'

export const Route = createFileRoute('/dashboard/estaciones/stationId')({
  loader: async ({ params }) => {
    const { stationId } = params
    if (!stationId) {
      throw redirect({ to: appRoutes.dashboardStations() })
    }
    return { stationId }
  },
  head: (opts) => {
    const { stationId } = opts.params
    return {
      meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }, { title: `Estacion ${stationId} - DatosBizi` }],
    }
  },
  component: StationDetailRoute,
})

function StationDetailRoute() {
  const { stationId } = Route.useParams()
  const breadcrumbs = createRootBreadcrumbs({ label: 'Estaciones', href: appRoutes.dashboardStations() })

  return (
    <PageShell>
      <div className="mx-auto mb-4 w-full max-w-[1280px]">
        <SiteBreadcrumbs items={breadcrumbs} />
      </div>
      <StationDetailPanel stationId={stationId} />
    </PageShell>
  )
}
