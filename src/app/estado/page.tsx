import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicPageViewTracker } from '@/app/_components/PublicPageViewTracker';
import { PublicSearchForm } from '@/app/_components/PublicSearchForm';
import { PublicSectionNav } from '@/app/_components/PublicSectionNav';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { TrackedLink } from '@/app/_components/TrackedLink';
import {
  fetchAvailableDataMonths,
  fetchSharedDatasetSnapshot,
  fetchStations,
  fetchStatus,
} from '@/lib/api';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { combineDataStates } from '@/lib/data-state';
import { formatMonthLabel, isValidMonthKey } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { buildPageMetadata } from '@/lib/seo';
import { buildSocialImagePath } from '@/lib/social-images';
import { buildFallbackAvailableMonths, buildFallbackDatasetSnapshot, buildFallbackStations, buildFallbackStatus } from '@/lib/shared-data-fallbacks';
import { getCityName } from '@/lib/site';
import {
  buildSystemCapabilities,
  buildSystemIncidents,
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

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const nowIso = new Date().toISOString();
  const [status, dataset, stations] = await Promise.all([
    fetchStatus().catch(() => buildFallbackStatus(nowIso)),
    fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)),
    fetchStations().catch(() => buildFallbackStations(nowIso)),
  ]);

  return buildPageMetadata({
    title: 'Cobertura y estado de datos de Bizi Zaragoza',
    description:
      'Revisa la cobertura, la ultima muestra, el lag del pipeline y la salud operativa de los datos de Bizi Zaragoza desde una unica pagina publica.',
    path: appRoutes.status(),
    socialImagePath: buildSocialImagePath({
      kind: 'api',
      title: 'Cobertura y estado de datos de Bizi Zaragoza',
      subtitle: 'Frescura del dato, cobertura historica y salud operativa del sistema',
      eyebrow: 'Salud y cobertura',
      badges: ['Estado', 'Cobertura', 'Pipeline'],
    }),
    indexability: {
      pageType: 'data_hub',
      dataState: combineDataStates([status.dataState, dataset.dataState]),
      hasMeaningfulContent: true,
      hasData:
        dataset.coverage.totalDays > 0 ||
        Boolean(dataset.lastUpdated.lastSampleAt) ||
        stations.stations.length > 0,
    },
  });
}

export default async function SystemStatusPage() {
  const nowIso = new Date().toISOString();
  const cityName = getCityName();
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Estado',
    href: appRoutes.status(),
  });

  const [status, stations, dataset, availableMonths] = await Promise.all([
    fetchStatus().catch(() => buildFallbackStatus(nowIso)),
    fetchStations().catch(() => buildFallbackStations(nowIso)),
    fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)),
    fetchAvailableDataMonths().catch(() => buildFallbackAvailableMonths(nowIso)),
  ]);

  const months = availableMonths.months.filter(isValidMonthKey);
  const latestMonth = months[0] ?? null;
  const incidents = buildSystemIncidents(status, dataset);
  const capabilities = buildSystemCapabilities(status, dataset, stations);
  const activeIncidentCount = incidents.filter((incident) => incident.severity !== 'healthy').length;
  const activeStationsCount = Math.max(
    stations.stations.length,
    status.quality.volume.recentStationCount
  );
  const healthLabel = getHealthLabel(status.pipeline.healthStatus);
  const summaryCards = [
    {
      label: 'Ultima muestra',
      value: formatStatusDateTime(dataset.lastUpdated.lastSampleAt),
      hint: 'Marca compartida por dashboard, informes y API.',
    },
    {
      label: 'Frecuencia de actualizacion',
      value: getObservedCadenceLabel(status),
      hint: `Objetivo operativo <= ${Math.round(status.quality.freshness.maxAgeSeconds / 60)} min de frescura.`,
    },
    {
      label: 'Cobertura historica',
      value: getCoverageLabel(dataset),
      hint: `${formatStatusNumber(dataset.coverage.totalStations)} estaciones con cobertura acumulada.`,
    },
    {
      label: 'Estaciones activas',
      value: formatStatusNumber(activeStationsCount),
      hint: 'Snapshot actual con estaciones vivas o recientemente observadas.',
    },
    {
      label: 'Numero de muestras',
      value: formatStatusNumber(dataset.stats.totalSamples),
      hint: 'Total agregado disponible para historico, comparativas y rankings.',
    },
    {
      label: 'Lag del pipeline',
      value: getPipelineLagLabel(status),
      hint: 'Diferencia aproximada respecto a la ultima recogida valida.',
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
      label: 'Generacion informes',
      value: formatStatusDateTime(availableMonths.generatedAt),
      hint: latestMonth ? `Ultimo mes indexable ${formatMonthLabel(latestMonth)}.` : 'Sin meses publicados todavia.',
    },
    {
      label: 'Incidentes activos',
      value: formatStatusNumber(activeIncidentCount),
      hint: activeIncidentCount > 0 ? 'Requieren seguimiento operativo.' : 'Sin incidencias activas detectadas.',
    },
  ] as const;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
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
                  'Cobertura, salud del pipeline, versiones y superficie operativa de la API publica.',
                url: appRoutes.status(),
              },
            ],
          }),
        }}
      />

      <header className="hero-card">
        <SiteBreadcrumbs items={breadcrumbs} />
        <PublicSectionNav activeItemId="status" className="mt-1" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Estado operativo y cobertura
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              Estado del sistema {cityName}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Vista publica para seguir ultima muestra, lag del pipeline, cobertura historica,
              versiones, incidentes y el estado de API, scrapers, ingestion, rankings y
              predicciones.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="kpi-chip">Ultima muestra {formatStatusDateTime(dataset.lastUpdated.lastSampleAt)}</span>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getHealthToneClasses(status.pipeline.healthStatus)}`}>
              {healthLabel}
            </span>
            <span className="kpi-chip">{dataset.coverage.totalDays} dias de cobertura</span>
            <span className="kpi-chip">API {getApiVersionLabel()}</span>
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
              className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
            >
              Abrir dashboard en vivo
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
              className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
            >
              Ver API y developers
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
              className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
            >
              Ver metodologia
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
          <article key={card.label} className="dashboard-card">
            <p className="stat-label">{card.label}</p>
            <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">{card.value}</p>
            <p className="text-xs text-[var(--muted)]">{card.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
        <article className="dashboard-card">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Incidentes
            </p>
            <h2 className="text-xl font-black text-[var(--foreground)]">Incidencias y notas operativas</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Este bloque resume lo que hoy exige seguimiento. Si no hay incidentes, actua como
              confirmacion de estabilidad.
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

        <article className="dashboard-card">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Fuente y versionado
            </p>
            <h2 className="text-xl font-black text-[var(--foreground)]">Trazabilidad del dataset</h2>
          </div>
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <div className="stat-card">
              <p className="stat-label">Proveedor</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{dataset.source.provider}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Discovery GBFS</p>
              <Link
                href={dataset.source.gbfsDiscoveryUrl}
                className="break-all text-sm font-semibold text-[var(--accent)] transition hover:opacity-80"
              >
                {dataset.source.gbfsDiscoveryUrl}
              </Link>
            </div>
            <div className="stat-card">
              <p className="stat-label">Version dataset</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{getDatasetVersionLabel(dataset)}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Ultimo informe publicado</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {latestMonth ? formatMonthLabel(latestMonth) : 'Sin informes'}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Superficie del sistema
            </p>
            <h2 className="text-xl font-black text-[var(--foreground)]">Estado por capa</h2>
          </div>
          <Link
            href={appRoutes.compare()}
            className="text-sm font-bold text-[var(--accent)] transition hover:opacity-80"
          >
            Abrir comparador
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {capabilities.map((capability) => (
            <Link
              key={capability.id}
              href={capability.href}
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
    </main>
  );
}
