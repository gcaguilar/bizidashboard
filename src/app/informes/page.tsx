import type { Metadata } from 'next';
import Link from 'next/link';
import { DataStateNotice } from '@/app/_components/DataStateNotice';
import { PublicPageViewTracker } from '@/app/_components/PublicPageViewTracker';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { fetchCachedMonthlyDemandCurve } from '@/lib/analytics-series';
import { fetchAvailableDataMonths, fetchSharedDatasetSnapshot } from '@/lib/api';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { combineDataStates, resolveDataState, shouldShowDataStateNotice } from '@/lib/data-state';
import { formatMonthLabel, isValidMonthKey } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { buildPageMetadata } from '@/lib/seo';
import { buildSocialImagePath } from '@/lib/social-images';
import { buildItemListStructuredData } from '@/lib/structured-data';
import { buildFallbackDatasetSnapshot } from '@/lib/shared-data-fallbacks';
import { getSiteUrl, SITE_NAME } from '@/lib/site';

export const revalidate = 3600;

function resolvePublishedMonths(
  availableMonths: string[],
  monthlySeriesKeys: string[]
): string[] {
  const monthSet = new Set<string>();

  for (const month of [...availableMonths, ...monthlySeriesKeys]) {
    if (isValidMonthKey(month)) {
      monthSet.add(month);
    }
  }

  return Array.from(monthSet).sort((left, right) => right.localeCompare(left));
}

export async function generateMetadata(): Promise<Metadata> {
  const [monthsResponse, monthlySeries] = await Promise.all([
    fetchAvailableDataMonths().catch(() => ({
      months: [],
      generatedAt: new Date().toISOString(),
    })),
    fetchCachedMonthlyDemandCurve(36).catch(() => []),
  ]);
  const months = resolvePublishedMonths(
    monthsResponse.months,
    monthlySeries.map((row) => row.monthKey)
  );

  return buildPageMetadata({
    title: 'Informes mensuales de Bizi Zaragoza | Archivo historico',
    description:
      'Archivo historico de informes mensuales de Bizi Zaragoza con URLs limpias por mes, comparativas y acceso directo a cada informe indexable.',
    path: appRoutes.reports(),
    keywords: [
      'informes mensuales bizi zaragoza',
      'archivo historico bizi zaragoza',
      'informes por mes bizi',
      'estadisticas bizi zaragoza',
    ],
    socialImagePath: buildSocialImagePath({
      kind: 'report',
      title: 'Informes mensuales de Bizi Zaragoza',
      subtitle: `Archivo historico con ${months.length} meses publicados y URLs limpias por mes`,
      eyebrow: 'Archivo mensual indexable',
      badges: [months[0] ? formatMonthLabel(months[0]) : 'Sin datos', 'Informes', 'Historico'],
    }),
    indexability: {
      pageType: 'report',
      hasMeaningfulContent: true,
      hasData: months.length > 0,
      requiresStrongCoverage: true,
      thresholds: [
        {
          label: 'published-months',
          current: months.length,
          minimum: 1,
        },
      ],
    },
  });
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return 'Sin datos';
  }

  return new Intl.NumberFormat('es-ES', {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function ReportsIndexPage() {
  const siteUrl = getSiteUrl();
  const nowIso = new Date().toISOString();
  const [monthsResponse, monthlySeries, dataset] = await Promise.all([
    fetchAvailableDataMonths().catch(() => ({ months: [], generatedAt: new Date().toISOString() })),
    fetchCachedMonthlyDemandCurve(24).catch(() => []),
    fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)),
  ]);

  const months = resolvePublishedMonths(
    monthsResponse.months,
    monthlySeries.map((row) => row.monthKey)
  );
  const monthMap = new Map(monthlySeries.map((row) => [row.monthKey, row]));
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
      <PublicPageViewTracker pageType="report_archive" template="reports_index" pageSlug="informes" />

      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <header className="hero-card">
        <SiteBreadcrumbs items={breadcrumbs} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Archivo mensual indexable</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              Informes Bizi Zaragoza por mes
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Archivo SEO con informes mensuales permanentes, comparativas de demanda estimada y acceso directo al dashboard filtrado por mes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="kpi-chip">{months.length} meses indexables</span>
            {latestMonth ? <span className="kpi-chip">Ultimo informe {formatMonthLabel(latestMonth)}</span> : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {latestMonth ? (
            <TrackedLink
              href={appRoutes.reportMonth(latestMonth)}
              eventName="report_open_click"
              eventData={{ source: 'reports_hero', month: latestMonth }}
              className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
            >
              Abrir ultimo informe mensual
            </TrackedLink>
          ) : null}
          <TrackedLink
            href={appRoutes.dashboardConclusions()}
            eventName="related_module_click"
            eventData={{ source: 'reports_hero', destination: 'dashboard_conclusions' }}
            className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
          >
            Abrir conclusiones del dashboard
          </TrackedLink>
        </div>
      </header>

      {shouldShowDataStateNotice(reportsDataState) ? (
        <DataStateNotice
          state={reportsDataState}
          subject="el archivo mensual"
          description="Los informes mensuales usan la misma cobertura compartida que la API y el dashboard. Si falta cobertura o el dataset es parcial, puede haber meses sin informe o series incompletas."
          href={appRoutes.status()}
          actionLabel="Ver estado"
        />
      ) : null}

      <section className="dashboard-card">
        <div className="max-w-5xl space-y-3 text-sm leading-7 text-[var(--muted)] md:text-base">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Que aporta este archivo
            </p>
            <h2 className="text-xl font-black leading-tight text-[var(--foreground)]">
              Una capa editorial estable para buscar meses, comparar y enlazar
            </h2>
          </div>
          <p>
            El archivo mensual concentra las URLs persistentes con mejor potencial de indexacion
            para consultas historicas sobre Bizi Zaragoza. Cada informe resume un periodo concreto,
            conserva su propio contexto y permite navegar a barrios, estaciones y rankings sin
            pasar por superficies interactivas o con query strings.
          </p>
          <p>
            Si vienes desde buscadores, esta pagina es el mejor punto para localizar el ultimo mes
            publicado o revisar la secuencia historica. Si buscas operativa en tiempo real, desde
            aqui puedes saltar al dashboard de conclusiones sin perder el enlace editorial.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="dashboard-card">
          <p className="stat-label">Ultimo mes con informe</p>
          <p className="stat-value">{latestMonth ? formatMonthLabel(latestMonth) : 'Sin datos'}</p>
          <p className="text-xs text-[var(--muted)]">Enlace persistente para bots, buscadores y navegacion editorial.</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Meses publicados</p>
          <p className="stat-value">{months.length}</p>
          <p className="text-xs text-[var(--muted)]">Archivo historico disponible para indexacion y enlazado interno.</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Cobertura de serie</p>
          <p className="stat-value">{monthlySeries.length}</p>
          <p className="text-xs text-[var(--muted)]">Meses con agregados mensuales disponibles en base de datos.</p>
        </article>
      </section>

      <section className="dashboard-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[var(--foreground)]">Archivo de informes mensuales</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Cada informe tiene su propia URL estable y enlaza al dashboard con el mes ya seleccionado.</p>
          </div>
          <Link href={appRoutes.reports()} className="text-sm font-bold text-[var(--accent)] transition hover:opacity-80">
            Ver archivo completo
          </Link>
        </div>

        <div className="mt-2 space-y-3">
          {months.map((month) => {
            const row = monthMap.get(month);

            return (
              <TrackedLink
                key={month}
                href={appRoutes.reportMonth(month)}
                eventName="report_open_click"
                eventData={{ source: 'reports_archive', month }}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">Informe {formatMonthLabel(month)}</p>
                  <p className="text-[11px] text-[var(--muted)]">
                    {row
                      ? `${formatInteger(row.demandScore)} pts de demanda estimada · ocupacion ${formatPercent(row.avgOccupancy)} · ${row.activeStations} estaciones`
                      : 'Informe disponible con acceso al dashboard filtrado por mes.'}
                  </p>
                </div>
                <span className="text-xs font-bold text-[var(--accent)]">Abrir informe</span>
              </TrackedLink>
            );
          })}
        </div>
      </section>

      <section className="dashboard-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Mas rutas para seguir explorando</h2>
        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <TrackedLink
            href={appRoutes.seoPage('viajes-por-mes-zaragoza')}
            eventName="related_module_click"
            eventData={{ source: 'reports_related', destination: 'monthly_series' }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Serie mensual</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Evolucion agregada para complementar el archivo editorial por mes.
            </p>
          </TrackedLink>
          <TrackedLink
            href={appRoutes.districtLanding()}
            eventName="related_module_click"
            eventData={{ source: 'reports_related', destination: 'district_hub' }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Barrios de Zaragoza</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Descubre que zonas destacan en uso y que estaciones concentran mas actividad.
            </p>
          </TrackedLink>
          <TrackedLink
            href={appRoutes.seoPage('ranking-estaciones-bizi')}
            eventName="related_module_click"
            eventData={{ source: 'reports_related', destination: 'station_ranking' }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Ranking de estaciones</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Da el salto del contexto mensual al ranking actual de estaciones.
            </p>
          </TrackedLink>
          <TrackedLink
            href={appRoutes.developers()}
            eventName="api_cta_click"
            eventData={{ source: 'reports_related' }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">API y datos abiertos</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Accede a OpenAPI, CSV y trazabilidad del mismo dataset que alimenta los informes.
            </p>
          </TrackedLink>
          <TrackedLink
            href={appRoutes.methodology()}
            eventName="related_module_click"
            eventData={{ source: 'reports_related', destination: 'methodology' }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Metodologia y calidad</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Revisa como leer demanda, cobertura y limites antes de interpretar la serie mensual.
            </p>
          </TrackedLink>
        </div>
      </section>
    </main>
  );
}
