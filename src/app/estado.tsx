import { Link, createFileRoute } from '@tanstack/react-router';
import { PublicPageViewTracker } from '@/app/_components/PublicPageViewTracker';
import { PublicSearchForm } from '@/app/_components/PublicSearchForm';
import { PublicSectionNav } from '@/app/_components/PublicSectionNav';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { formatMonthLabel } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { getCityName, getSiteUrl } from '@/lib/site';
import {
  formatStatusDateTime,
  formatStatusNumber,
  getApiVersionLabel,
  getCoverageLabel,
  getDatasetVersionLabel,
  getHealthLabel,
  getHealthToneClasses,
  getObservedCadenceLabel,
  getPipelineLagLabel,
} from '@/lib/system-status';
import { StatusBanner } from '@/app/dashboard/_components/StatusBanner';
import { PageShell } from '@/components/layout/page-shell';
import { getSystemStatusPageData } from '@/server-functions/estado';

export const Route = createFileRoute('/estado')({
  head: () => {
    const siteUrl = getSiteUrl()
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Comprueba si los datos de Bizi Zaragoza estan frescos, que cobertura tienen y si hay incidencias que afecten al dashboard, la API o los informes.',
        },
        { property: 'og:title', content: 'Cobertura y estado de datos de Bizi Zaragoza' },
        { property: 'og:description', content: 'Comprueba si los datos de Bizi Zaragoza estan frescos, que cobertura tienen y si hay incidencias activas.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/estado` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Cobertura y estado de datos de Bizi Zaragoza' },
        { name: 'twitter:description', content: 'Comprueba si los datos de Bizi Zaragoza estan frescos, que cobertura tienen y si hay incidencias activas.' },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}/estado` }],
      title: 'Cobertura y estado de datos de Bizi Zaragoza',
    }
  },
  loader: () => getSystemStatusPageData(),
  component: SystemStatusPage,
});

export default function SystemStatusPage() {
  const { status, stations, dataset, availableMonths, latestMonth, incidents, capabilities, activeIncidentCount, activeStationsCount } = Route.useLoaderData();
  const cityName = getCityName();
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Estado',
    href: appRoutes.status(),
  });
  const healthLabel = getHealthLabel(status.pipeline.healthStatus);
  const summaryCards = [
    {
      label: 'Ultima muestra util',
      value: formatStatusDateTime(dataset.lastUpdated.lastSampleAt),
      hint: 'Referencia que comparten dashboard, informes y API.',
    },
    {
      label: 'Ritmo de actualizacion',
      value: getObservedCadenceLabel(status),
      hint: `Objetivo: datos con menos de ${Math.round(status.quality.freshness.maxAgeSeconds / 60)} min de retraso.`,
    },
    {
      label: 'Cobertura historica',
      value: getCoverageLabel(dataset),
      hint: `${formatStatusNumber(dataset.coverage.totalStations)} estaciones con cobertura acumulada.`,
    },
    {
      label: 'Estaciones activas',
      value: formatStatusNumber(activeStationsCount),
      hint: 'Estaciones vistas en la muestra mas reciente.',
    },
    {
      label: 'Muestras guardadas',
      value: formatStatusNumber(dataset.stats.totalSamples),
      hint: 'Base disponible para historico, comparativas y rankings.',
    },
    {
      label: 'Retraso de datos',
      value: getPipelineLagLabel(status),
      hint: 'Tiempo aproximado desde la ultima recogida valida.',
    },
    {
      label: 'Version dataset',
      value: getDatasetVersionLabel(dataset),
      hint: 'Version derivada de la ultima muestra util y del volumen agregado.',
    },
    {
      label: 'Version API',
      value: getApiVersionLabel(),
      hint: 'Version publicada en la especificacion OpenAPI.',
    },
    {
      label: 'Informes generados',
      value: formatStatusDateTime(availableMonths.generatedAt),
      hint: latestMonth ? `Ultimo mes indexable ${formatMonthLabel(latestMonth)}.` : 'Sin meses publicados todavia.',
    },
    {
      label: 'Incidentes activos',
      value: formatStatusNumber(activeIncidentCount),
      hint: activeIncidentCount > 0 ? 'Conviene revisarlas antes de usar los datos.' : 'No hay incidencias activas detectadas.',
    },
  ] as const;

  return (
    <PageShell>
      <PublicPageViewTracker pageType="status" template="system_status" pageSlug="estado" />

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              buildBreadcrumbStructuredData(breadcrumbs),
              {
                '@type': 'Dataset',
                name: `Estado del sistema ${cityName}`,
                description:
                  'Cobertura, frescura, versiones e incidencias de los datos publicos.',
                url: appRoutes.status(),
              },
            ],
          }),
        }}
      />

      <header className="ui-page-hero">
        <SiteBreadcrumbs items={breadcrumbs} />
        <PublicSectionNav activeItemId="status" className="mt-1" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Frescura y cobertura
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              Estado de los datos de {cityName}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Una vista rapida para saber si los datos estan al dia, cuanta cobertura historica hay,
              si existen incidencias y que servicios pueden verse afectados.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="ui-chip">Ultima muestra {formatStatusDateTime(dataset.lastUpdated.lastSampleAt)}</span>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getHealthToneClasses(status.pipeline.healthStatus)}`}>
              {healthLabel}
            </span>
            <span className="ui-chip">{dataset.coverage.totalDays} dias de cobertura</span>
            <span className="ui-chip">API {getApiVersionLabel()}</span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-wrap gap-3">
            <TrackedLink
              href={appRoutes.dashboard()}
              navigationEvent={{
                source: 'status_hero',
                destination: 'dashboard_home',
                sourceRole: 'utility',
                destinationRole: 'dashboard',
                transitionKind: 'to_dashboard',
              }}
              className="inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
            >
              Abrir dashboard
            </TrackedLink>
            <TrackedLink
              href={appRoutes.developers()}
              ctaEvent={{
                source: 'status_hero',
                ctaId: 'api_open',
                destination: 'developers',
                entityType: 'api',
                sourceRole: 'utility',
                destinationRole: 'utility',
                transitionKind: 'within_public',
              }}
              className="ui-inline-action"
            >
              Ver API y datos abiertos
            </TrackedLink>
            <TrackedLink
              href={appRoutes.methodology()}
              navigationEvent={{
                source: 'status_hero',
                destination: 'methodology',
                sourceRole: 'utility',
                destinationRole: 'utility',
                transitionKind: 'within_public',
              }}
              className="ui-inline-action"
            >
              Entender metodologia
            </TrackedLink>
          </div>

          <PublicSearchForm />
        </div>
      </header>

      <StatusBanner
        status={status}
        stationsGeneratedAt={stations.generatedAt}
        coverage={dataset.coverage}
        lastSampleAt={dataset.lastUpdated.lastSampleAt}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <article key={card.label} className="ui-section-card">
            <p className="stat-label">{card.label}</p>
            <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">{card.value}</p>
            <p className="text-xs text-[var(--muted)]">{card.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
        <article className="ui-section-card">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Incidentes
            </p>
            <h2 className="text-xl font-black text-[var(--foreground)]">Incidencias y notas importantes</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Aqui aparecen los problemas que conviene revisar antes de usar los datos. Si no hay
              incidencias, puedes tomarlo como una senal de estabilidad.
            </p>
          </div>

          <div className="space-y-3">
            {incidents.map((incident) => (
              <article
                key={incident.id}
                className={`rounded-xl border px-4 py-3 ${getHealthToneClasses(incident.severity)}`}
              >
                <p className="text-sm font-semibold">{incident.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-current/90">{incident.description}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="ui-section-card">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Fuente y versiones
            </p>
            <h2 className="text-xl font-black text-[var(--foreground)]">De donde salen los datos</h2>
          </div>
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <div className="ui-metric-card">
              <p className="stat-label">Proveedor</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{dataset.source.provider}</p>
            </div>
            <div className="ui-metric-card">
              <p className="stat-label">Discovery GBFS</p>
              <Link
                to={dataset.source.gbfsDiscoveryUrl}
                className="break-all text-sm font-semibold text-[var(--primary)] transition hover:opacity-80"
              >
                {dataset.source.gbfsDiscoveryUrl}
              </Link>
            </div>
            <div className="ui-metric-card">
              <p className="stat-label">Version de datos</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{getDatasetVersionLabel(dataset)}</p>
            </div>
            <div className="ui-metric-card">
              <p className="stat-label">Ultimo informe publicado</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {latestMonth ? formatMonthLabel(latestMonth) : 'Sin informes'}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="ui-section-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Servicios conectados
            </p>
            <h2 className="text-xl font-black text-[var(--foreground)]">Estado por servicio</h2>
          </div>
          <Link
            to={appRoutes.compare()}
            className="text-sm font-bold text-[var(--primary)] transition hover:opacity-80"
          >
            Abrir comparador
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {capabilities.map((capability) => (
            <Link
              key={capability.id}
              to={capability.href}
              className={`rounded-2xl border px-4 py-4 transition hover:-translate-y-0.5 ${getHealthToneClasses(capability.state)}`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-current/80">
                {capability.label}
              </p>
              <p className="mt-2 text-base font-bold text-current">{getHealthLabel(capability.state)}</p>
              <p className="mt-2 text-sm leading-relaxed text-current/90">{capability.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
