import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { fetchSharedDatasetSnapshot, fetchStations, fetchStatus, type SharedDatasetSnapshot } from '@/lib/api';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { appRoutes } from '@/lib/routes';
import { buildPageMetadata } from '@/lib/seo';
import { getSharedDataSource } from '@/services/shared-data';
import { DashboardRouteLinks } from '../_components/DashboardRouteLinks';
import { GitHubRepoButton } from '../_components/GitHubRepoButton';
import { StatusBanner } from '../_components/StatusBanner';
import { ThemeToggleButton } from '../_components/ThemeToggleButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'Estado del sistema',
  description:
    'Vista dedicada al estado del sistema Bizi Zaragoza con frescura de datos, volumen reciente y diagnostico operativo.',
  path: appRoutes.dashboardStatus(),
});

function formatValue(value: string | null | undefined): string {
  if (!value) {
    return 'Sin datos';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('es-ES');
}

function buildFallbackDatasetSnapshot(nowIso: string): SharedDatasetSnapshot {
  return {
    source: getSharedDataSource(),
    coverage: {
      firstRecordedAt: null,
      lastRecordedAt: null,
      totalSamples: 0,
      totalStations: 0,
      totalDays: 0,
      generatedAt: nowIso,
    },
    lastUpdated: {
      lastSampleAt: null,
      generatedAt: nowIso,
    },
    stats: {
      totalSamples: 0,
      totalStations: 0,
      totalDays: 0,
      generatedAt: nowIso,
    },
    pipeline: {
      pipeline: { lastSuccessfulPoll: null, totalRowsCollected: 0, pollsLast24Hours: 0, validationErrors: 0, consecutiveFailures: 0, lastDataFreshness: false, lastStationCount: 0, averageStationsPerPoll: 0, healthStatus: 'down', healthReason: 'No se pudieron consultar las tablas de datos.' },
      quality: { freshness: { isFresh: false, lastUpdated: null, maxAgeSeconds: 300 }, volume: { recentStationCount: 0, averageStationsPerPoll: 0, expectedRange: { min: 200, max: 500 } }, lastCheck: null },
      system: { uptime: nowIso, version: '0.1.0', environment: 'production' },
      timestamp: nowIso,
    },
  };
}

export default async function DashboardStatusPage() {
  const nowIso = new Date().toISOString();
  const breadcrumbs = createRootBreadcrumbs(
    {
      label: 'Dashboard',
      href: appRoutes.dashboard(),
    },
    {
      label: 'Estado',
      href: appRoutes.dashboardStatus(),
    }
  );
  const [status, stations, dataset] = await Promise.all([
    fetchStatus().catch(() => ({
      pipeline: { lastSuccessfulPoll: null, totalRowsCollected: 0, pollsLast24Hours: 0, validationErrors: 0, consecutiveFailures: 0, lastDataFreshness: false, lastStationCount: 0, averageStationsPerPoll: 0, healthStatus: 'down' as const, healthReason: 'No se pudieron consultar las tablas de datos.' },
      quality: { freshness: { isFresh: false, lastUpdated: null, maxAgeSeconds: 300 }, volume: { recentStationCount: 0, averageStationsPerPoll: 0, expectedRange: { min: 200, max: 500 } }, lastCheck: null },
      system: { uptime: nowIso, version: '0.1.0', environment: 'production' },
      timestamp: nowIso,
    })),
    fetchStations().catch(() => ({ stations: [], generatedAt: nowIso })),
    fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)),
  ]);

  return (
    <main className="min-h-screen overflow-x-clip px-4 py-6 md:px-6 md:py-8">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            ...buildBreadcrumbStructuredData(breadcrumbs),
          }),
        }}
      />
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6">
        <header className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur-md">
          <SiteBreadcrumbs items={breadcrumbs} className="mb-3" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3 text-[var(--accent)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-black text-white">
                B
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Estado del sistema</h1>
                <p className="text-xs text-[var(--muted)]">Vista dedicada para diagnostico, frescura y cobertura de datos.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href={appRoutes.dashboard()} className="icon-button">Volver al dashboard</Link>
              <ThemeToggleButton />
              <GitHubRepoButton />
            </div>
          </div>

          <div className="mt-3 border-t border-[var(--border)]/70 pt-3">
            <DashboardRouteLinks
              activeRoute="dashboard"
              routes={['dashboard', 'stations', 'flow', 'conclusions', 'help']}
              variant="chips"
              className="flex flex-wrap items-center gap-2"
            />
          </div>
        </header>

        <StatusBanner
          status={status}
          stationsGeneratedAt={stations.generatedAt}
          coverage={dataset.coverage}
          lastSampleAt={dataset.lastUpdated.lastSampleAt}
        />

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="dashboard-card">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Pipeline</p>
            <h2 className="text-lg font-bold text-[var(--foreground)]">Diagnostico rapido</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="stat-card">
                <p className="stat-label">Ultima recogida correcta</p>
                <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">
                  {formatValue(status.pipeline.lastSuccessfulPoll)}
                </p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Ultima comprobacion</p>
                <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">
                  {formatValue(status.quality.lastCheck ?? status.timestamp)}
                </p>
              </div>
            </div>
          </article>

          <article className="dashboard-card">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Cobertura</p>
            <h2 className="text-lg font-bold text-[var(--foreground)]">Volumen reciente</h2>
            <div className="grid gap-3">
              <div className="stat-card">
                <p className="stat-label">Estaciones en snapshot actual</p>
                <p className="stat-value">{stations.stations.length}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Media por sondeo</p>
                <p className="stat-value">{Math.round(status.quality.volume.averageStationsPerPoll)}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Cobertura historica</p>
                <p className="stat-value">{dataset.coverage.totalDays}</p>
                <p className="text-xs text-[var(--muted)]">{dataset.coverage.totalStations} estaciones activas cubiertas</p>
              </div>
            </div>
          </article>

          <article className="dashboard-card">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Acciones</p>
            <h2 className="text-lg font-bold text-[var(--foreground)]">Siguientes pasos</h2>
            <div className="space-y-3 text-sm text-[var(--muted)]">
              <p>Si este bloque cae a menudo, revisa primero la ultima recogida correcta, la frescura y si el volumen reciente esta dentro del rango esperado.</p>
              <Link
                href={appRoutes.dashboardHelp('desconectado-frescura')}
                className="inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
              >
                Ver ayuda de diagnostico
              </Link>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
