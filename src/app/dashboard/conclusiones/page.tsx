import type { Metadata } from 'next';
import { formatPercent } from '@/lib/format';
import { getDailyMobilityConclusions, type MobilityConclusionsPayload } from '@/lib/mobility-conclusions';
import { SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site';
import { DashboardRouteLinks } from '../_components/DashboardRouteLinks';

const REPO_URL = 'https://github.com/gcaguilar/bizidashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Conclusiones de movilidad',
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/dashboard/conclusiones',
  },
  openGraph: {
    title: `${SITE_TITLE} - Conclusiones de movilidad`,
    description: SITE_DESCRIPTION,
    url: '/dashboard/conclusiones',
  },
};

function formatDelta(deltaRatio: number | null): string {
  if (deltaRatio === null || !Number.isFinite(deltaRatio)) {
    return 'Sin referencia';
  }

  const prefix = deltaRatio >= 0 ? '+' : '';
  return `${prefix}${Math.round(deltaRatio * 100)}%`;
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'Sin datos';
  }

  const parsed = new Date(value.length <= 10 ? `${value}T00:00:00.000Z` : value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('es-ES');
}

function buildFallbackPayload(): MobilityConclusionsPayload {
  const now = new Date().toISOString().slice(0, 10);

  return {
    dateKey: now,
    generatedAt: new Date().toISOString(),
    sourceFirstDay: null,
    sourceLastDay: null,
    totalHistoricalDays: 0,
    stationsWithData: 0,
    activeStations: 0,
    metrics: {
      demandLast7Days: 0,
      demandPrevious7Days: 0,
      demandDeltaRatio: null,
      occupancyLast7Days: 0,
      occupancyPrevious7Days: 0,
      occupancyDeltaRatio: null,
    },
    summary: 'Todavia no hay historico suficiente para generar conclusiones de movilidad.',
    highlights: [],
    recommendations: ['Recoge al menos varios dias de datos para habilitar recomendaciones operativas.'],
    topStationsByDemand: [],
  };
}

export default async function DashboardConclusionsPage() {
  const fallbackPayload = buildFallbackPayload();

  const { payload, fromCache } = await getDailyMobilityConclusions().catch(() => ({
    payload: fallbackPayload,
    fromCache: false,
  }));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
      <header className="sticky top-0 z-50 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-[var(--accent)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-black text-white">
                B
              </div>
              <h1 className="text-lg font-bold text-[var(--foreground)]">Bizi Zaragoza</h1>
            </div>
            <DashboardRouteLinks
              activeRoute="conclusions"
              routes={['dashboard', 'stations', 'flow', 'conclusions', 'help']}
              variant="inline"
              className="hidden items-center gap-5 md:flex"
            />
          </div>

          <div className="flex items-center gap-2">
            <DashboardRouteLinks
              activeRoute="conclusions"
              routes={['dashboard', 'stations', 'conclusions', 'help']}
              variant="chips"
              className="flex items-center gap-2 md:hidden"
            />
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="icon-button"
              aria-label="Repositorio de la aplicacion"
            >
              Repositorio
            </a>
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Informe ejecutivo diario
            </p>
            <h2 className="text-2xl font-black leading-tight text-[var(--foreground)] md:text-3xl">
              Conclusiones generales de movilidad en Zaragoza
            </h2>
            <p className="text-sm text-[var(--muted)]">{payload.summary}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span className="kpi-chip">Dia informe {payload.dateKey}</span>
            <span className="kpi-chip">{fromCache ? 'Cache diaria DB' : 'Recalculado hoy'}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="dashboard-card">
          <p className="stat-label">Demanda ultimos 7 dias</p>
          <p className="stat-value">{payload.metrics.demandLast7Days}</p>
          <p className="text-xs text-[var(--muted)]">Variacion: {formatDelta(payload.metrics.demandDeltaRatio)}</p>
        </article>

        <article className="dashboard-card">
          <p className="stat-label">Ocupacion media 7 dias</p>
          <p className="stat-value">{formatPercent(payload.metrics.occupancyLast7Days)}</p>
          <p className="text-xs text-[var(--muted)]">
            Variacion: {formatDelta(payload.metrics.occupancyDeltaRatio)}
          </p>
        </article>

        <article className="dashboard-card">
          <p className="stat-label">Cobertura historica</p>
          <p className="stat-value">{payload.totalHistoricalDays}</p>
          <p className="text-xs text-[var(--muted)]">Dias con informacion consolidada.</p>
        </article>

        <article className="dashboard-card">
          <p className="stat-label">Estaciones monitorizadas</p>
          <p className="stat-value">{payload.activeStations}</p>
          <p className="text-xs text-[var(--muted)]">Con muestra historica: {payload.stationsWithData}</p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <article className="dashboard-card xl:col-span-7">
          <h3 className="text-base font-bold text-[var(--foreground)]">Hallazgos principales</h3>
          <p className="text-xs text-[var(--muted)]">
            Cobertura desde {formatDate(payload.sourceFirstDay)} hasta {formatDate(payload.sourceLastDay)}.
          </p>

          {payload.highlights.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">Sin highlights disponibles para el dia actual.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {payload.highlights.map((item) => (
                <article
                  key={`${item.title}-${item.detail}`}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{item.detail}</p>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="dashboard-card xl:col-span-5">
          <h3 className="text-base font-bold text-[var(--foreground)]">Recomendaciones operativas</h3>
          {payload.recommendations.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">Sin recomendaciones para hoy.</p>
          ) : (
            <ol className="mt-4 space-y-3 text-sm text-[var(--muted)]">
              {payload.recommendations.map((recommendation, index) => (
                <li
                  key={`${recommendation}-${index}`}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3"
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[10px] font-bold text-[var(--accent)]">
                    {index + 1}
                  </span>
                  {recommendation}
                </li>
              ))}
            </ol>
          )}
        </article>
      </section>

      <section className="dashboard-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-[var(--foreground)]">Estaciones con mayor demanda media (30 dias)</h3>
          <span className="text-xs text-[var(--muted)]">Actualizacion diaria en cache de BD</span>
        </div>

        {payload.topStationsByDemand.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Sin ranking de estaciones disponible todavia.</p>
        ) : (
          <div className="space-y-2">
            {payload.topStationsByDemand.map((station, index) => (
              <div
                key={station.stationId}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-xs font-bold text-[var(--accent)]">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">{station.stationName}</p>
                    <p className="text-[11px] text-[var(--muted)]">ID {station.stationId}</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-[var(--foreground)]">Indice {station.avgDemand.toFixed(1)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
