import type { Metadata } from 'next';
import { PublicPageViewTracker } from '@/app/_components/PublicPageViewTracker';
import { PublicSectionNav } from '@/app/_components/PublicSectionNav';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { getInsightsLandingData } from '@/lib/acquisition-landings';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { formatMonthLabel } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { buildPageMetadata } from '@/lib/seo';
import { buildSocialImagePath } from '@/lib/social-images';
import { getSiteUrl } from '@/lib/site';

function formatDecimal(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return 'Sin datos';
  }

  return new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 1,
  }).format(value);
}

export async function generateMetadata(): Promise<Metadata> {
  const landingData = await getInsightsLandingData();

  return buildPageMetadata({
    title: 'Estadisticas y ranking de Bizi Zaragoza',
    description:
      'Descubre rankings, barrios activos, informes mensuales y patrones de uso de Bizi Zaragoza desde una landing preparada para trafico frio y SEO.',
    path: appRoutes.insightsLanding(),
    keywords: [
      'estadisticas bizi zaragoza',
      'ranking bizi zaragoza',
      'informes bizi zaragoza',
      'barrios bizi zaragoza',
    ],
    socialImagePath: buildSocialImagePath({
      kind: 'landing',
      title: 'Estadisticas y ranking de Bizi Zaragoza',
      subtitle: `Rankings, barrios e informes con ${landingData.publishedMonths.length} meses publicados`,
      eyebrow: 'Landing de descubrimiento',
      badges: [
        landingData.latestMonth ? formatMonthLabel(landingData.latestMonth) : 'Sin datos',
        'Ranking',
        'Informes',
      ],
    }),
    indexability: landingData.indexabilityInput,
  });
}

export default async function InsightsLandingPage() {
  const landingData = await getInsightsLandingData();
  const topDistrict = landingData.districtRows[0] ?? null;
  const siteUrl = getSiteUrl();
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Estadisticas Bizi Zaragoza',
    href: appRoutes.insightsLanding(),
  });
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'CollectionPage',
        name: 'Estadisticas y ranking de Bizi Zaragoza',
        description:
          'Landing de descubrimiento con rankings, barrios, informes y rutas relacionadas de Bizi Zaragoza.',
        url: `${siteUrl}${appRoutes.insightsLanding()}`,
        inLanguage: 'es',
      },
    ],
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
      <PublicPageViewTracker
        pageType="acquisition"
        template="insights_landing"
        pageSlug="estadisticas-bizi-zaragoza"
      />

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="hero-card">
        <SiteBreadcrumbs items={breadcrumbs} />
        <PublicSectionNav activeHref={appRoutes.reports()} className="mt-1" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Landing de descubrimiento
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              Estadisticas y ranking de Bizi Zaragoza
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Esta landing agrupa las rutas con más potencial para quien llega con curiosidad o con
              intención de entender mejor el sistema: rankings, barrios, informes mensuales y fichas
              públicas de estación. Es una puerta de entrada pensada para tráfico frío, enlazado
              interno y consultas de descubrimiento.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="kpi-chip">{landingData.stationRows.length} estaciones indexables</span>
            <span className="kpi-chip">{landingData.districtRows.length} barrios con cobertura</span>
            <span className="kpi-chip">{landingData.publishedMonths.length} meses publicados</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {landingData.latestMonth ? (
            <TrackedLink
              href={appRoutes.reportMonth(landingData.latestMonth)}
              eventName="ad_landing_primary_click"
              eventData={{ landing: 'insights', destination: 'latest_report', month: landingData.latestMonth }}
              className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
            >
              Abrir ultimo informe mensual
            </TrackedLink>
          ) : null}
          <TrackedLink
            href={appRoutes.seoPage('ranking-estaciones-bizi')}
            eventName="ad_landing_secondary_click"
            eventData={{ landing: 'insights', destination: 'station_ranking' }}
            className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
          >
            Ver ranking de estaciones
          </TrackedLink>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="dashboard-card">
          <p className="stat-label">Ultimo mes publicado</p>
          <p className="stat-value">
            {landingData.latestMonth ? formatMonthLabel(landingData.latestMonth) : 'Sin datos'}
          </p>
          <p className="text-xs text-[var(--muted)]">
            Punto de entrada editorial para seguir la serie histórica.
          </p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Barrio destacado</p>
          <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">
            {topDistrict?.name ?? 'Sin datos'}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {topDistrict
              ? `${formatDecimal(topDistrict.avgTurnover)} pts medios en ${topDistrict.stationCount} estaciones.`
              : 'Esperando cobertura territorial suficiente.'}
          </p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Bicis visibles</p>
          <p className="stat-value">{landingData.bikesAvailable}</p>
          <p className="text-xs text-[var(--muted)]">
            Suma actual del conjunto de estaciones indexables y enlazables.
          </p>
        </article>
      </section>

      <section className="dashboard-card">
        <div className="max-w-5xl space-y-3 text-sm leading-7 text-[var(--muted)] md:text-base">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Que puedes descubrir aqui
            </p>
            <h2 className="text-xl font-black leading-tight text-[var(--foreground)]">
              Una ruta de entrada para entender el sistema sin perderte
            </h2>
          </div>
          <p>
            Si buscas una lectura rápida de cómo se mueve Bizi Zaragoza, aquí tienes el hilo lógico:
            empezar por el último informe o el ranking de estaciones, bajar después a los barrios con
            más actividad y terminar en las fichas públicas de estación para validar disponibilidad y
            patrones concretos.
          </p>
          <p>
            Esta estructura evita crear páginas débiles y concentra autoridad en pocos hubs útiles.
            Además deja un recorrido claro para campañas de bajo presupuesto: tráfico frío a esta
            landing, CTA al informe o al ranking y navegación interna hacia barrios y estaciones.
          </p>
        </div>
      </section>

      <section className="dashboard-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Empieza por aqui</h2>
        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {landingData.latestMonth ? (
            <TrackedLink
              href={appRoutes.reportMonth(landingData.latestMonth)}
              eventName="report_open_click"
              eventData={{ source: 'insights_landing_modules', month: landingData.latestMonth }}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
            >
              <p className="text-sm font-semibold text-[var(--foreground)]">Ultimo informe</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                Resumen ejecutivo de {formatMonthLabel(landingData.latestMonth)} con insights y enlaces.
              </p>
            </TrackedLink>
          ) : null}
          <TrackedLink
            href={appRoutes.districtLanding()}
            eventName="related_module_click"
            eventData={{ source: 'insights_landing_modules', destination: 'district_hub' }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Barrios</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Explora hubs territoriales con estaciones destacadas y comparativa local.
            </p>
          </TrackedLink>
          <TrackedLink
            href={appRoutes.seoPage('uso-bizi-por-hora')}
            eventName="related_module_click"
            eventData={{ source: 'insights_landing_modules', destination: 'hourly_usage' }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Horas punta</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Comprende las franjas con mayor actividad y contexto operativo.
            </p>
          </TrackedLink>
          <TrackedLink
            href={appRoutes.developers()}
            eventName="api_cta_click"
            eventData={{ source: 'insights_landing_modules' }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">API y datos abiertos</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Accede al dataset y a los endpoints que alimentan estas lecturas públicas.
            </p>
          </TrackedLink>
        </div>
      </section>

      <section className="dashboard-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Estaciones para seguir</h2>
        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {landingData.featuredStations.map((station) => (
            <TrackedLink
              key={station.station.id}
              href={appRoutes.stationDetail(station.station.id)}
              eventName="station_card_click"
              eventData={{ source: 'insights_landing_featured_stations', station_id: station.station.id }}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
            >
              <p className="text-sm font-semibold text-[var(--foreground)]">{station.station.name}</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                {station.districtName ?? 'Zaragoza'} · rotacion {formatDecimal(station.turnover?.turnoverScore ?? null)}
              </p>
            </TrackedLink>
          ))}
        </div>
      </section>

      <section className="dashboard-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Siguiente paso segun tu objetivo</h2>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <TrackedLink
            href={appRoutes.utilityLanding()}
            eventName="ad_landing_secondary_click"
            eventData={{ landing: 'insights', destination: 'utility' }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Quiero resolver algo practico</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Pasa a la landing de utilidad inmediata para ver mapa, disponibilidad y accesos rápidos.
            </p>
          </TrackedLink>
          <TrackedLink
            href={appRoutes.dashboardConclusions()}
            eventName="related_module_click"
            eventData={{ source: 'insights_landing_next_step', destination: 'dashboard_conclusions' }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Quiero ir al detalle operativo</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Abre conclusiones del dashboard si ya necesitas métricas y lectura más táctica.
            </p>
          </TrackedLink>
        </div>
      </section>
    </main>
  );
}
