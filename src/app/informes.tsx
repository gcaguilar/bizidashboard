import { Link, createFileRoute } from '@tanstack/react-router';
import { DataStateNotice } from '@/app/_components/DataStateNotice';
import { PublicPageLoading } from '@/app/_components/PublicPageLoading';
import { PublicPageViewTracker } from '@/app/_components/PublicPageViewTracker';
import { PublicSectionNav } from '@/app/_components/PublicSectionNav';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { shouldShowDataStateNotice } from '@/lib/data-state';
import { getSiteUrl } from '@/lib/site';
import { formatMonthLabel } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { formatInteger, formatPercent } from '@/lib/format';
import { PageShell } from '@/components/layout/page-shell';
import { Card } from '@/components/ui/card';
import { getReportsIndexPageData } from '@/server-functions/informes';

export const Route = createFileRoute('/informes')({
  head: () => {
    const siteUrl = getSiteUrl()
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Archivo de informes mensuales de Bizi Zaragoza con enlaces estables, comparativas y acceso directo a cada mes publicado.',
        },
        { property: 'og:title', content: 'Informes mensuales de Bizi Zaragoza | Archivo historico' },
        { property: 'og:description', content: 'Archivo de informes mensuales de Bizi Zaragoza con enlaces estables, comparativas y acceso directo a cada mes publicado.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/informes` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Informes mensuales de Bizi Zaragoza | Archivo historico' },
        { name: 'twitter:description', content: 'Archivo de informes mensuales de Bizi Zaragoza con enlaces estables, comparativas y acceso directo a cada mes publicado.' },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}/informes` }],
      title: 'Informes mensuales de Bizi Zaragoza | Archivo historico',
    }
  },
  loader: () => getReportsIndexPageData(),
  pendingComponent: PublicPageLoading,
  component: ReportsIndexPage,
});

export default function ReportsIndexPage() {
  const { months, monthMap, latestMonth, reportsDataState, breadcrumbs, structuredData } = Route.useLoaderData();
  const monthlyRows = new Map(Object.entries(monthMap));

  return (
    <PageShell>
      <PublicPageViewTracker pageType="report_archive" template="reports_index" pageSlug="informes" />

      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <div className="mx-auto mb-4 w-full max-w-[1280px]">
        <SiteBreadcrumbs items={breadcrumbs} />
      </div>

      <header className="ui-page-hero">
        <PublicSectionNav activeItemId="reports" className="mt-1" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Archivo mensual</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              Informes Bizi Zaragoza por mes
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Informes mensuales con contexto, comparativas de demanda estimada y acceso directo al dashboard filtrado por mes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="ui-chip">{months.length} meses publicados</span>
            {latestMonth ? <span className="ui-chip">Ultimo informe {formatMonthLabel(latestMonth)}</span> : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {latestMonth ? (
            <TrackedLink
              href={appRoutes.reportMonth(latestMonth)}
              ctaEvent={{
                source: 'reports_hero',
                ctaId: 'report_open',
                destination: 'monthly_report',
                entityType: 'report',
                monthPresent: true,
                sourceRole: 'hub',
                destinationRole: 'hub',
                transitionKind: 'within_public',
              }}
              className="ui-primary-button"
            >
              Abrir ultimo informe
            </TrackedLink>
          ) : null}
          <TrackedLink
            href={appRoutes.dashboardConclusions()}
            navigationEvent={{
              source: 'reports_hero',
              destination: 'dashboard_conclusions',
              sourceRole: 'hub',
              destinationRole: 'dashboard',
              transitionKind: 'to_dashboard',
            }}
            className="ui-inline-action"
          >
            Abrir conclusiones del dashboard
          </TrackedLink>
        </div>
      </header>

      {shouldShowDataStateNotice(reportsDataState) ? (
        <DataStateNotice
          state={reportsDataState}
          subject="el archivo mensual"
          description="Los informes mensuales usan los mismos datos que la API y el dashboard. Si falta cobertura o los datos son parciales, puede haber meses sin informe o series incompletas."
          href={appRoutes.status()}
          actionLabel="Ver estado"
        />
      ) : null}

      <section className="ui-section-card">
        <div className="max-w-5xl space-y-3 text-sm leading-7 text-[var(--muted)] md:text-base">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Que aporta este archivo
            </p>
            <h2 className="text-xl font-black leading-tight text-[var(--foreground)]">
              Un lugar estable para buscar meses, comparar y enlazar
            </h2>
          </div>
          <p>
            El archivo mensual reune enlaces permanentes para consultar el historico de Bizi Zaragoza.
            Cada informe resume un periodo concreto, conserva su propio contexto y permite navegar a
            barrios, estaciones y rankings sin depender de filtros temporales.
          </p>
          <p>
            Si llegas desde un buscador, empieza aqui para localizar el ultimo mes publicado o revisar
            la serie historica. Si necesitas el estado actual, puedes saltar al dashboard de conclusiones.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="ui-section-card">
          <p className="stat-label">Ultimo mes con informe</p>
          <p className="stat-value">{latestMonth ? formatMonthLabel(latestMonth) : 'Sin datos'}</p>
          <p className="text-xs text-[var(--muted)]">Enlace estable para consultar y compartir.</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Meses publicados</p>
          <p className="stat-value">{months.length}</p>
          <p className="text-xs text-[var(--muted)]">Archivo historico disponible para consulta y enlace.</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Cobertura de serie</p>
          <p className="stat-value">{months.length > 0 ? [...new Set(months.map(m => m))].length : 0}</p>
          <p className="text-xs text-[var(--muted)]">Meses con datos agregados disponibles.</p>
        </article>
      </section>

      <section className="ui-section-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[var(--foreground)]">Archivo de informes mensuales</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Cada informe tiene su propio enlace y abre el dashboard con el mes ya seleccionado.</p>
          </div>
          <Link to={appRoutes.reports()} className="text-sm font-bold text-[var(--primary)] transition hover:opacity-80">
            Ver archivo completo
          </Link>
        </div>

        <div className="mt-2 space-y-3">
          {months.map((month) => {
            const row = monthlyRows.get(month);

            return (
              <TrackedLink
                key={month}
                href={appRoutes.reportMonth(month)}
                ctaEvent={{
                  source: 'reports_archive',
                  ctaId: 'report_open',
                  destination: 'monthly_report',
                  entityType: 'report',
                  monthPresent: true,
                  sourceRole: 'hub',
                  destinationRole: 'hub',
                  transitionKind: 'within_public',
                }}
                className="group block transition hover:-translate-y-0.5"
              >
                <Card
                  variant="stat"
                  className="flex-row items-center justify-between gap-3 px-4 py-3 transition-colors group-hover:border-[var(--primary)]/40"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">Informe {formatMonthLabel(month)}</p>
                    <p className="text-[11px] text-[var(--muted)]">
                      {row
                        ? `${formatInteger(row.demandScore)} pts de demanda estimada · ocupacion ${formatPercent(row.avgOccupancy)} · ${row.activeStations} estaciones`
                        : 'Informe disponible con acceso al dashboard filtrado por ese mes.'}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[var(--primary)]">Abrir informe</span>
                </Card>
              </TrackedLink>
            );
          })}
        </div>
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Mas rutas para seguir explorando</h2>
        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <TrackedLink
            href={appRoutes.seoPage('viajes-por-mes-zaragoza')}
            navigationEvent={{
              source: 'reports_related',
              destination: 'monthly_series',
              sourceRole: 'hub',
              destinationRole: 'entry_seo',
              transitionKind: 'within_public',
            }}
            className="group block transition hover:-translate-y-0.5"
          >
            <Card variant="stat" className="px-4 py-4 transition-colors group-hover:border-[var(--primary)]/40">
              <p className="text-sm font-semibold text-[var(--foreground)]">Serie mensual</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                Evolucion agregada para complementar el archivo mensual.
              </p>
            </Card>
          </TrackedLink>
          <TrackedLink
            href={appRoutes.districtLanding()}
            navigationEvent={{
              source: 'reports_related',
              destination: 'district_hub',
              sourceRole: 'hub',
              destinationRole: 'hub',
              transitionKind: 'within_public',
            }}
            className="group block transition hover:-translate-y-0.5"
          >
            <Card variant="stat" className="px-4 py-4 transition-colors group-hover:border-[var(--primary)]/40">
              <p className="text-sm font-semibold text-[var(--foreground)]">Barrios de Zaragoza</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                Descubre que zonas destacan en uso y que estaciones concentran mas actividad.
              </p>
            </Card>
          </TrackedLink>
          <TrackedLink
            href={appRoutes.seoPage('ranking-estaciones-bizi')}
            navigationEvent={{
              source: 'reports_related',
              destination: 'station_ranking',
              sourceRole: 'hub',
              destinationRole: 'entry_seo',
              transitionKind: 'within_public',
            }}
            className="group block transition hover:-translate-y-0.5"
          >
            <Card variant="stat" className="px-4 py-4 transition-colors group-hover:border-[var(--primary)]/40">
              <p className="text-sm font-semibold text-[var(--foreground)]">Ranking de estaciones</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                Da el salto del contexto mensual al ranking actual de estaciones.
              </p>
            </Card>
          </TrackedLink>
          <TrackedLink
            href={appRoutes.developers()}
            ctaEvent={{
              source: 'reports_related',
              ctaId: 'api_open',
              destination: 'developers',
              entityType: 'api',
              sourceRole: 'hub',
              destinationRole: 'utility',
              transitionKind: 'within_public',
            }}
            className="group block transition hover:-translate-y-0.5"
          >
            <Card variant="stat" className="px-4 py-4 transition-colors group-hover:border-[var(--primary)]/40">
              <p className="text-sm font-semibold text-[var(--foreground)]">API y datos abiertos</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                Accede a OpenAPI, CSV y origen de los mismos datos que alimentan los informes.
              </p>
            </Card>
          </TrackedLink>
          <TrackedLink
            href={appRoutes.methodology()}
            navigationEvent={{
              source: 'reports_related',
              destination: 'methodology',
              sourceRole: 'hub',
              destinationRole: 'utility',
              transitionKind: 'within_public',
            }}
            className="group block transition hover:-translate-y-0.5"
          >
            <Card variant="stat" className="px-4 py-4 transition-colors group-hover:border-[var(--primary)]/40">
              <p className="text-sm font-semibold text-[var(--foreground)]">Metodologia y calidad</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                Revisa como leer demanda, cobertura y limites antes de interpretar la serie mensual.
              </p>
            </Card>
          </TrackedLink>
        </div>
      </section>
    </PageShell>
  );
}
