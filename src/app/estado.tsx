import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { PublicPageLoading } from '@/app/_components/PublicPageLoading';
import { PublicPageViewTracker } from '@/app/_components/PublicPageViewTracker';
import { PublicSearchForm } from '@/app/_components/PublicSearchForm';
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
    const title = 'Cobertura y estado de datos de Bizi Zaragoza'
    return {
      meta: [
        { title },
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Comprueba si los datos de Bizi Zaragoza están frescos, qué cobertura tienen y si hay incidencias que afecten al mapa avanzado, la API o los informes.',
        },
        { property: 'og:title', content: 'Cobertura y estado de datos de Bizi Zaragoza' },
        { property: 'og:description', content: 'Comprueba si los datos de Bizi Zaragoza están frescos, qué cobertura tienen y si hay incidencias activas.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/estado` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Cobertura y estado de datos de Bizi Zaragoza' },
        { name: 'twitter:description', content: 'Comprueba si los datos de Bizi Zaragoza están frescos, qué cobertura tienen y si hay incidencias activas.' },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}/estado` }],
      title,
    }
  },
  loader: () => getSystemStatusPageData(),
  pendingComponent: PublicPageLoading,
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
  const [showTechnical, setShowTechnical] = useState(false);
  const summaryCards = [
    {
      label: 'Última muestra útil',
      value: formatStatusDateTime(dataset.lastUpdated.lastSampleAt),
      hint: 'Referencia que comparten el mapa avanzado, los informes y la API.',
    },
    {
      label: 'Frecuencia de actualización',
      value: getObservedCadenceLabel(status),
      hint: `Objetivo: datos con menos de ${Math.round(status.quality.freshness.maxAgeSeconds / 60)} min de retraso.`,
    },
    {
      label: 'Historial disponible',
      value: getCoverageLabel(dataset),
      hint: `${formatStatusNumber(dataset.coverage.totalStations)} estaciones con cobertura acumulada.`,
    },
    {
      label: 'Estaciones activas',
      value: formatStatusNumber(activeStationsCount),
      hint: 'Estaciones vistas en la muestra más reciente.',
    },
    {
      label: 'Registros almacenados',
      value: formatStatusNumber(dataset.stats.totalSamples),
      hint: 'Base disponible para histórico, comparativas y rankings.',
    },
    {
      label: 'Atraso en los datos',
      value: getPipelineLagLabel(status),
      hint: 'Tiempo aproximado desde la última recogida válida.',
    },
    {
      label: 'Versión de datos',
      value: getDatasetVersionLabel(dataset),
      hint: 'Versión derivada de la última muestra útil y del volumen agregado.',
    },
    {
      label: 'Versión de la API',
      value: getApiVersionLabel(),
      hint: 'Versión publicada en la especificación OpenAPI.',
    },
    {
      label: 'Última actualización de informes',
      value: formatStatusDateTime(availableMonths.generatedAt),
      hint: latestMonth ? `Último mes indexable ${formatMonthLabel(latestMonth)}.` : 'Sin meses publicados todavía.',
    },
    {
      label: 'Problemas activos',
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
                  'Cobertura, frescura, versiones e incidencias de los datos públicos.',
                url: appRoutes.status(),
              },
            ],
          }),
        }}
      />

      <div className="mx-auto mb-4 w-full max-w-[1280px]">
        <SiteBreadcrumbs items={breadcrumbs} />
      </div>

      <header className="ui-page-hero">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Frescura y cobertura
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              Estado de los datos de {cityName}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Una vista rápida para saber si los datos están al día, cuánta cobertura histórica hay,
              si existen incidencias y qué servicios pueden verse afectados.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="ui-chip">Última muestra {formatStatusDateTime(dataset.lastUpdated.lastSampleAt)}</span>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getHealthToneClasses(status.pipeline.healthStatus)}`}>
              {healthLabel}
            </span>
            <span className="ui-chip">{dataset.coverage.totalDays} días de cobertura</span>
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
              className="ui-primary-button"
            >
              Abrir mapa avanzado
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
              Entender metodología
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

      <section className="ui-section-card border-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className={`h-4 w-4 rounded-full ${status.pipeline.healthStatus === 'healthy' ? 'bg-[var(--success)]' : status.pipeline.healthStatus === 'degraded' ? 'bg-[var(--warning)]' : 'bg-[var(--danger)]'}`} />
          <p className="text-lg font-bold text-[var(--foreground)]">
            {healthLabel === 'Saludable' ? 'Datos al día' : healthLabel === 'Degradado' ? 'Datos con retraso' : 'Datos con incidencias'}
          </p>
          <span className="ui-chip">
            {activeIncidentCount > 0 ? `${activeIncidentCount} incidencias activas` : 'Sin incidencias'}
          </span>
          <span className="ui-chip">
            {getPipelineLagLabel(status)}
          </span>
        </div>
        {activeIncidentCount > 0 ? (
          <p className="text-sm text-[var(--warning)]">Hay incidencias activas que pueden afectar a la fiabilidad de los datos.</p>
        ) : status.pipeline.healthStatus === 'healthy' ? (
          <p className="text-sm text-[var(--success)]">Los datos están frescos y el sistema funciona con normalidad.</p>
        ) : null}
      </section>

      <section className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <article className="ui-metric-card">
          <p className="stat-label">Última muestra útil</p>
          <p className="text-sm font-semibold text-[var(--foreground)]">{formatStatusDateTime(dataset.lastUpdated.lastSampleAt)}</p>
        </article>
        <article className="ui-metric-card">
          <p className="stat-label">Retraso en los datos</p>
          <p className="text-sm font-semibold text-[var(--foreground)]">{getPipelineLagLabel(status)}</p>
        </article>
        <article className="ui-metric-card">
          <p className="stat-label">Estaciones activas</p>
          <p className="text-sm font-semibold text-[var(--foreground)]">{formatStatusNumber(activeStationsCount)}</p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
        <article className="ui-section-card">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Incidentes
            </p>
            <h2 className="text-xl font-black text-[var(--foreground)]">Incidencias y notas importantes</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Aquí aparecen los problemas que conviene revisar antes de usar los datos. Si no hay
              incidencias, puedes tomarlo como una señal de estabilidad.
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
            <h2 className="text-xl font-black text-[var(--foreground)]">De dónde salen los datos</h2>
          </div>
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <div className="ui-metric-card">
              <p className="stat-label">Proveedor</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{dataset.source.provider}</p>
            </div>
            <div className="ui-metric-card">
              <p className="stat-label">Discovery GBFS</p>
              <a
                href={dataset.source.gbfsDiscoveryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ui-inline-action"
              >
                {dataset.source.gbfsDiscoveryUrl}
              </a>
            </div>
            <div className="ui-metric-card">
              <p className="stat-label">Versión de datos</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{getDatasetVersionLabel(dataset)}</p>
            </div>
            <div className="ui-metric-card">
              <p className="stat-label">Último informe publicado</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {latestMonth ? formatMonthLabel(latestMonth) : 'Sin informes'}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="ui-section-card">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Detalles técnicos
          </p>
          <h2 className="text-xl font-black text-[var(--foreground)]">Métricas del sistema</h2>
          <button
            onClick={() => setShowTechnical(v => !v)}
            className="ui-inline-action mt-2"
          >
            {showTechnical ? 'Ocultar detalles' : 'Mostrar detalles'}
          </button>
        </div>
        {showTechnical && (
          <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {summaryCards.map((card) => (
              <article key={card.label} className="ui-metric-card">
                <p className="stat-label">{card.label}</p>
                <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">{card.value}</p>
                <p className="text-xs text-[var(--muted)]">{card.hint}</p>
              </article>
            ))}
          </section>
        )}
      </section>

      <section className="ui-section-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Servicios conectados
            </p>
            <h2 className="text-xl font-black text-[var(--foreground)]">Estado por servicio</h2>
          </div>
          <TrackedLink href={appRoutes.compare()}
            className="ui-inline-action"
          >
            Abrir comparador
          </TrackedLink>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {capabilities.map((capability) => (
            <TrackedLink
              key={capability.id}
              to={capability.href}
              className={`ui-surface-block ui-surface-block-interactive ${getHealthToneClasses(capability.state)}`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-current/80">
                {capability.label}
              </p>
              <p className="mt-2 text-base font-bold text-current">{getHealthLabel(capability.state)}</p>
              <p className="mt-2 text-sm leading-relaxed text-current/90">{capability.description}</p>
            </TrackedLink>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
