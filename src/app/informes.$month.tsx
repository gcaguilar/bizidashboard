import { createFileRoute } from '@tanstack/react-router'
import { DataStateNotice } from '@/app/_components/DataStateNotice'
import { PublicSectionNav } from '@/app/_components/PublicSectionNav'
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs'
import { createRootBreadcrumbs } from '@/lib/breadcrumbs'
import { shouldShowDataStateNotice } from '@/lib/data-state'
import { formatMonthLabel } from '@/lib/months'
import { appRoutes } from '@/lib/routes'
import { PageShell } from '@/components/layout/page-shell'
import { EmptyStateCard } from '@/components/ui/empty-state-card'
import { getReportMonthPageData } from '@/server-functions/informes-month'
import { getSiteUrl } from '@/lib/site'

export const Route = createFileRoute('/informes/$month')({
  loader: async ({ params }) => getReportMonthPageData({ data: params.month }),
  head: (opts) => {
    const month = opts.params.month ?? ''
    const title = `Informe ${formatMonthLabel(month)} - DatosBizi`
    const description = `Informe mensual de Bizi Zaragoza para ${formatMonthLabel(month)}: demanda estimada, estaciones y patrones de uso.`
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${getSiteUrl()}/informes/${month}` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      links: [{ rel: 'canonical', href: `${getSiteUrl()}/informes/${month}` }],
      title,
    }
  },
  component: InformesMonthPage,
})

function InformesMonthPage() {
  const { month, dataState } = Route.useLoaderData()
  const breadcrumbs = createRootBreadcrumbs(
    { label: 'Informes', href: appRoutes.reports() },
    { label: formatMonthLabel(month), href: appRoutes.reportMonth(month) }
  )

  return (
    <PageShell>
      <div className="mx-auto mb-4 w-full max-w-[1280px]">
        <SiteBreadcrumbs items={breadcrumbs} />
      </div>
      <PublicSectionNav activeItemId="reports" className="mt-1" />
      <header className="ui-page-hero">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Informe mensual</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              Informe {formatMonthLabel(month)}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">Resumen mensual con demanda estimada, estaciones y patrones del periodo seleccionado.</p>
          </div>
        </div>
      </header>
      {shouldShowDataStateNotice(dataState) ? (
        <DataStateNotice state={dataState} subject="el informe mensual" description="Este informe depende de los datos historicos disponibles. Revisa el estado si ves huecos o cobertura parcial." href={appRoutes.status()} actionLabel="Revisar estado" />
      ) : null}
      <EmptyStateCard
        title="Informe en preparación"
        description="Este mes todavía no tiene informe publicado. Los informes se generan automáticamente cuando hay cobertura suficiente."
      />
    </PageShell>
  )
}
