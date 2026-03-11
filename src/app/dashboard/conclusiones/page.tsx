import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchAvailableDataMonths } from '@/lib/api';
import { formatPercent } from '@/lib/format';
import { normalizeMonthSearchParam, resolveActiveMonth, toMonthOptions } from '@/lib/months';
import { getDailyMobilityConclusions, type MobilityConclusionsPayload } from '@/lib/mobility-conclusions';
import { buildPageMetadata } from '@/lib/seo';
import { getSiteUrl, SITE_NAME } from '@/lib/site';
import { DashboardRouteLinks } from '../_components/DashboardRouteLinks';
import { MonthFilter } from '../_components/MonthFilter';
import { ThemeToggleButton } from '../_components/ThemeToggleButton';

const REPO_URL = 'https://github.com/gcaguilar/bizidashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export const metadata: Metadata = buildPageMetadata({
  title: 'Conclusiones de movilidad',
  description:
    'Resumen ejecutivo de movilidad en Zaragoza con demanda, horas pico, barrios mas activos y patrones entre semana y fin de semana.',
  path: '/dashboard/conclusiones',
});

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

function formatInteger(value: number): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value);
}

function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00-${String((hour + 1) % 24).padStart(2, '0')}:00`;
}

function getDemandCardLabel(selectedMonth: string | null): string {
  return selectedMonth ? 'Variacion demanda del mes' : 'Variacion demanda 7 dias';
}

function getDemandCardDetail(payload: MobilityConclusionsPayload): string {
  const monthLabel = payload.selectedMonth
    ? toMonthOptions([payload.selectedMonth])[0]?.label ?? payload.selectedMonth
    : null;

  return payload.selectedMonth
    ? `Demanda agregada: ${formatInteger(payload.metrics.demandLast7Days)} puntos en ${monthLabel} (indice de actividad, no viajes exactos).`
    : `Demanda agregada: ${formatInteger(payload.metrics.demandLast7Days)} puntos en 7 dias (indice de actividad, no viajes exactos).`;
}

function getOccupancyCardLabel(selectedMonth: string | null): string {
  return selectedMonth ? 'Ocupacion media del mes' : 'Ocupacion media 7 dias';
}

function getPeriodCaption(selectedMonth: string | null, fallback: string): string {
  if (!selectedMonth) {
    return fallback;
  }

  return toMonthOptions([selectedMonth])[0]?.label ?? selectedMonth;
}

function getWeekPatternSummary(payload: MobilityConclusionsPayload): string {
  const { weekdayWeekendProfile } = payload;

  if (!weekdayWeekendProfile.dominantPeriod) {
    return 'Aun no hay suficiente muestra para comparar dias laborables y fin de semana.';
  }

  return weekdayWeekendProfile.dominantPeriod === 'weekday'
    ? `Entre semana la red concentra mas actividad media por dia que en fin de semana (${weekdayWeekendProfile.weekday.avgDemand.toFixed(1)} vs ${weekdayWeekendProfile.weekend.avgDemand.toFixed(1)} pts).`
    : `En fin de semana la red concentra mas actividad media por dia que entre semana (${weekdayWeekendProfile.weekend.avgDemand.toFixed(1)} vs ${weekdayWeekendProfile.weekday.avgDemand.toFixed(1)} pts).`;
}

type DashboardConclusionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function buildFallbackPayload(): MobilityConclusionsPayload {
  const now = new Date().toISOString().slice(0, 10);

  return {
    dateKey: now,
    generatedAt: new Date().toISOString(),
    selectedMonth: null,
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
    peakDemandHours: [],
    topDistrictsByDemand: [],
    topStationsByDemand: [],
    leastUsedStations: [],
    weekdayWeekendProfile: {
      weekday: { avgDemand: 0, avgOccupancy: 0, daysCount: 0 },
      weekend: { avgDemand: 0, avgOccupancy: 0, daysCount: 0 },
      demandGapRatio: null,
      dominantPeriod: null,
    },
  };
}

export default async function DashboardConclusionsPage({ searchParams }: DashboardConclusionsPageProps) {
  const siteUrl = getSiteUrl();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const fallbackPayload = buildFallbackPayload();
  const availableMonths = await fetchAvailableDataMonths().catch(() => ({
    months: [],
    generatedAt: new Date().toISOString(),
  }));
  const activeMonth = resolveActiveMonth(
    availableMonths.months,
    normalizeMonthSearchParam(resolvedSearchParams.month)
  );

  const { payload, fromCache } = await getDailyMobilityConclusions(activeMonth).catch(() => ({
    payload: fallbackPayload,
    fromCache: false,
  }));

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Dashboard', item: `${siteUrl}/dashboard` },
          { '@type': 'ListItem', position: 3, name: 'Conclusiones', item: `${siteUrl}/dashboard/conclusiones` },
        ],
      },
      {
        '@type': 'Report',
        name: 'Conclusiones de movilidad en Zaragoza',
        description: payload.summary,
        datePublished: payload.generatedAt,
        dateModified: payload.generatedAt,
        inLanguage: 'es',
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: siteUrl,
        },
        about: {
          '@type': 'Dataset',
          name: 'Movilidad urbana de Bizi Zaragoza',
          distribution: [
            { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${siteUrl}/api/history` },
          ],
        },
      },
    ],
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
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

          <div className="flex flex-wrap items-center justify-end gap-2">
            <DashboardRouteLinks
              activeRoute="conclusions"
              routes={['dashboard', 'stations', 'conclusions', 'help']}
              variant="chips"
              className="flex flex-wrap items-center gap-2 md:hidden"
            />
            <ThemeToggleButton />
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="icon-button"
              aria-label="Repositorio de la aplicacion"
            >
              <span className="sm:hidden">Repo</span>
              <span className="hidden sm:inline">Repositorio</span>
            </a>
          </div>
        </div>
      </header>

      <MonthFilter months={availableMonths.months} activeMonth={activeMonth} />

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
            <span className="kpi-chip">{fromCache ? 'Actualizacion diaria en cache' : 'Actualizado hoy'}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article className="dashboard-card">
          <p className="stat-label">{getDemandCardLabel(payload.selectedMonth)}</p>
          <p className="stat-value">{formatDelta(payload.metrics.demandDeltaRatio)}</p>
          <p className="text-xs text-[var(--muted)]">{getDemandCardDetail(payload)}</p>
        </article>

        <article className="dashboard-card">
          <p className="stat-label">{getOccupancyCardLabel(payload.selectedMonth)}</p>
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

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="dashboard-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[var(--foreground)]">Entre semana vs fin de semana</h3>
            <span className="text-xs text-[var(--muted)]">{getPeriodCaption(payload.selectedMonth, 'Ventana actual')}</span>
          </div>

          <p className="mt-3 text-sm text-[var(--muted)]">{getWeekPatternSummary(payload)}</p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Entre semana</p>
              <p className="mt-2 text-xl font-black text-[var(--foreground)]">{payload.weekdayWeekendProfile.weekday.avgDemand.toFixed(1)} pts</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Ocupacion media {formatPercent(payload.weekdayWeekendProfile.weekday.avgOccupancy)} · {payload.weekdayWeekendProfile.weekday.daysCount} dias
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Fin de semana</p>
              <p className="mt-2 text-xl font-black text-[var(--foreground)]">{payload.weekdayWeekendProfile.weekend.avgDemand.toFixed(1)} pts</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Ocupacion media {formatPercent(payload.weekdayWeekendProfile.weekend.avgOccupancy)} · {payload.weekdayWeekendProfile.weekend.daysCount} dias
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs text-[var(--muted)]">
            Variacion relativa fin de semana vs laborable: {formatDelta(payload.weekdayWeekendProfile.demandGapRatio)}
          </p>
        </article>

        <article className="dashboard-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[var(--foreground)]">Horas pico de demanda</h3>
            <span className="text-xs text-[var(--muted)]">{getPeriodCaption(payload.selectedMonth, 'Ultimos 7 dias')}</span>
          </div>

          {payload.peakDemandHours.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">Todavia no hay suficiente historico horario para detectar picos.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {payload.peakDemandHours.map((slot, index) => (
                <div
                  key={`${slot.hour}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{formatHourLabel(slot.hour)}</p>
                    <p className="text-[11px] text-[var(--muted)]">Franja con mayor actividad agregada</p>
                  </div>
                  <p className="text-xs font-bold text-[var(--foreground)]">{formatInteger(slot.demandScore)} pts</p>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="dashboard-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[var(--foreground)]">Barrios con mas demanda</h3>
            <span className="text-xs text-[var(--muted)]">{getPeriodCaption(payload.selectedMonth, 'Ultimos 7 dias')}</span>
          </div>

          {payload.topDistrictsByDemand.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">No se ha podido agrupar la demanda por barrios todavia.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {payload.topDistrictsByDemand.map((district, index) => (
                <div
                  key={`${district.district}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{district.district}</p>
                    <p className="text-[11px] text-[var(--muted)]">Mayor intensidad agregada de uso reciente</p>
                  </div>
                  <p className="text-xs font-bold text-[var(--foreground)]">{formatInteger(district.demandScore)} pts</p>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="dashboard-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[var(--foreground)]">
              {payload.selectedMonth ? 'Estaciones con mayor demanda media del mes' : 'Estaciones con mayor demanda media (30 dias)'}
            </h3>
            <span className="text-xs text-[var(--muted)]">
              {payload.selectedMonth ? getPeriodCaption(payload.selectedMonth, '') : 'Actualizacion diaria en cache de BD'}
            </span>
          </div>

          {payload.topStationsByDemand.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Sin ranking de estaciones disponible todavia.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {payload.topStationsByDemand.map((station, index) => (
                <Link
                  key={station.stationId}
                  href={`/dashboard/estaciones/${encodeURIComponent(station.stationId)}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
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
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className="dashboard-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[var(--foreground)]">
              {payload.selectedMonth ? 'Estaciones menos usadas del mes' : 'Estaciones menos usadas'}
            </h3>
            <span className="text-xs text-[var(--muted)]">Tambien enlaza al detalle</span>
          </div>

          {payload.leastUsedStations.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Sin ranking de estaciones menos usadas disponible todavia.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {payload.leastUsedStations.map((station, index) => (
                <Link
                  key={station.stationId}
                  href={`/dashboard/estaciones/${encodeURIComponent(station.stationId)}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)]/8 text-xs font-bold text-[var(--foreground)]">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">{station.stationName}</p>
                      <p className="text-[11px] text-[var(--muted)]">ID {station.stationId}</p>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-[var(--foreground)]">Indice {station.avgDemand.toFixed(1)}</p>
                </Link>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
