import { createFileRoute } from '@tanstack/react-router';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { Suspense } from 'react';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { formatDateLabel, formatInteger, formatPercent } from '@/lib/format';
import { toMonthOptions } from '@/lib/months';
import type { MobilityConclusionsPayload } from '@/lib/mobility-conclusions';
import { appRoutes } from '@/lib/routes';
import { DashboardPageViewTracker } from '@/app/dashboard/_components/DashboardPageViewTracker';
import { GitHubRepoButton } from '@/app/dashboard/_components/GitHubRepoButton';
import { MonthFilter } from '@/app/dashboard/_components/MonthFilter';
import { ThemeToggleButton } from '@/app/dashboard/_components/ThemeToggleButton';
import { Button } from '@/components/ui/button';
import { PageHeaderCard } from '@/components/layout/page-header-card';
import { PageShell } from '@/components/layout/page-shell';
import { getDashboardConclusionsPageData } from '@/server-functions/dashboard-conclusiones';

// Dashboard sections contract: dashboard, stations, flow, conclusions, redistribucion, help.

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

  return formatDateLabel(parsed);
}

function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00-${String((hour + 1) % 24).padStart(2, '0')}:00`;
}

function getDemandCardLabel(selectedMonth: string | null): string {
  return selectedMonth ? 'Cambio de demanda del mes' : 'Cambio de demanda 7 dias';
}

function getDemandCardDetail(payload: MobilityConclusionsPayload): string {
  const monthLabel = payload.selectedMonth
    ? toMonthOptions([payload.selectedMonth])[0]?.label ?? payload.selectedMonth
    : null;

  return payload.selectedMonth
    ? `Demanda estimada: ${formatInteger(payload.metrics.demandLast7Days)} puntos en ${monthLabel} (indice de actividad, no viajes exactos).`
    : `Demanda estimada: ${formatInteger(payload.metrics.demandLast7Days)} puntos en 7 dias (indice de actividad, no viajes exactos).`;
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

export const Route = createFileRoute('/dashboard/conclusiones/')({
  head: () => {
    const title = 'Conclusiones de movilidad'
    const description = 'Resumen ejecutivo de movilidad en Zaragoza con demanda, horas pico, barrios mas activos y patrones entre semana y fin de semana.'
    return {
      meta: [
        { title },
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { name: 'robots', content: 'noindex, nofollow' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      title,
    }
  },
  loaderDeps: ({ location }) => ({ searchStr: location.searchStr ?? '' }),
  loader: async ({ deps }) =>
    getDashboardConclusionsPageData({ data: Object.fromEntries(new URLSearchParams(deps.searchStr)) }),
  component: DashboardConclusionsPage,
});

export default function DashboardConclusionsPage() {
  const { payload, fromCache, availableMonths, activeMonth, breadcrumbs, structuredData } = Route.useLoaderData();

  return (
    <PageShell>
      <DashboardPageViewTracker
        routeKey="dashboard_conclusions"
        pageType="dashboard"
        template="conclusions_report"
      />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PageHeaderCard>
        <SiteBreadcrumbs items={breadcrumbs} className="mb-3" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">Dashboard</p>
            <h1 className="text-lg font-bold text-[var(--foreground)]">Conclusiones</h1>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <ThemeToggleButton />
            <GitHubRepoButton />
          </div>
        </div>
      </PageHeaderCard>

      <Suspense>
        <MonthFilter
          months={availableMonths.months}
          activeMonth={activeMonth}
          routeKey="dashboard_conclusions"
          source="dashboard_conclusions"
        />
      </Suspense>

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Resumen diario
            </p>
            <h2 className="text-2xl font-black leading-tight text-[var(--foreground)] md:text-3xl">
              Conclusiones generales de movilidad en Zaragoza
            </h2>
            <p className="text-sm text-[var(--muted)]">{payload.summary}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span className="ui-chip">Dia {payload.dateKey}</span>
            <span className="ui-chip">Cobertura desde {formatDate(payload.sourceFirstDay)}</span>
            <span className="ui-chip">Ultima muestra {formatDate(payload.sourceLastDay)}</span>
            <span className="ui-chip">{fromCache ? 'Actualizacion diaria guardada' : 'Actualizado hoy'}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article className="ui-section-card">
          <p className="stat-label">{getDemandCardLabel(payload.selectedMonth)}</p>
          <p className="stat-value">{formatDelta(payload.metrics.demandDeltaRatio)}</p>
          <p className="text-xs text-[var(--muted)]">{getDemandCardDetail(payload)}</p>
        </article>

        <article className="ui-section-card">
          <p className="stat-label">{getOccupancyCardLabel(payload.selectedMonth)}</p>
          <p className="stat-value">{formatPercent(payload.metrics.occupancyLast7Days)}</p>
          <p className="text-xs text-[var(--muted)]">
            Variacion: {formatDelta(payload.metrics.occupancyDeltaRatio)}
          </p>
        </article>

        <article className="ui-section-card">
          <p className="stat-label">Cobertura historica</p>
          <p className="stat-value">{payload.totalHistoricalDays}</p>
          <p className="text-xs text-[var(--muted)]">Dias con informacion consolidada.</p>
        </article>

      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <article className="ui-section-card xl:col-span-7">
          <h3 className="text-base font-bold text-[var(--foreground)]">Hallazgos principales</h3>
          <p className="text-xs text-[var(--muted)]">
            Cobertura desde {formatDate(payload.sourceFirstDay)} hasta {formatDate(payload.sourceLastDay)}.
          </p>

          {payload.highlights.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">Aun no hay hallazgos suficientes para el dia actual.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {payload.highlights.map((item) => (
                <article
                  key={`${item.title}-${item.detail}`}
                  className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{item.detail}</p>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="ui-section-card xl:col-span-5">
          <h3 className="text-base font-bold text-[var(--foreground)]">Recomendaciones operativas</h3>
          {payload.recommendations.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">Sin recomendaciones para hoy.</p>
          ) : (
            <ol className="mt-4 space-y-3 text-sm text-[var(--muted)]">
              {payload.recommendations.map((recommendation, index) => (
                <li
                  key={`${recommendation}-${index}`}
                  className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3"
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)]/15 text-[10px] font-bold text-[var(--primary)]">
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
        <article className="ui-section-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[var(--foreground)]">Entre semana vs fin de semana</h3>
            <span className="text-xs text-[var(--muted)]">{getPeriodCaption(payload.selectedMonth, 'Ventana actual')}</span>
          </div>

          <p className="mt-3 text-sm text-[var(--muted)]">{getWeekPatternSummary(payload)}</p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Entre semana</p>
              <p className="mt-2 text-xl font-black text-[var(--foreground)]">{payload.weekdayWeekendProfile.weekday.avgDemand.toFixed(1)} pts</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Ocupacion media {formatPercent(payload.weekdayWeekendProfile.weekday.avgOccupancy)} · {payload.weekdayWeekendProfile.weekday.daysCount} dias
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-4">
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

        <article className="ui-section-card">
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
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3"
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

        <article className="ui-section-card">
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
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3"
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
        <article className="ui-section-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[var(--foreground)]">
              {payload.selectedMonth ? 'Estaciones con mayor demanda media del mes' : 'Estaciones con mayor demanda media (30 dias)'}
            </h3>
            <span className="text-xs text-[var(--muted)]">
              {payload.selectedMonth ? getPeriodCaption(payload.selectedMonth, '') : 'Actualizacion diaria guardada'}
            </span>
          </div>

          {payload.topStationsByDemand.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Sin ranking de estaciones disponible todavia.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {payload.topStationsByDemand.map((station, index) => (
                <Button asChild key={station.stationId} variant="outline" size="sm">
                  <TrackedLink href={appRoutes.dashboardStation(station.stationId)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:bg-[var(--card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-xs font-bold text-[var(--primary)]">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--foreground)]">{station.stationName}</p>
                        <p className="text-[11px] text-[var(--muted)]">ID {station.stationId}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-[var(--foreground)]">Indice {station.avgDemand.toFixed(1)}</p>
                  </TrackedLink>
                </Button>
              ))}
            </div>
          )}
        </article>

        <article className="ui-section-card">
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
                <Button asChild key={station.stationId} variant="outline" size="sm">
                  <TrackedLink href={appRoutes.dashboardStation(station.stationId)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:bg-[var(--card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
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
                  </TrackedLink>
                </Button>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="ui-section-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[var(--foreground)]">Informes mensuales publicados</h3>
            <TrackedLink href={appRoutes.reports()}
              className="text-xs font-bold text-[var(--primary)] transition hover:opacity-80"
            >
              Ver archivo completo
            </TrackedLink>
          </div>

          <div className="mt-4 space-y-2">
            {availableMonths.months.slice(0, 6).map((month) => (
              <Button asChild key={month} variant="outline" size="sm">
                <TrackedLink href={appRoutes.reportMonth(month)}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:bg-[var(--card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">Informe {toMonthOptions([month])[0]?.label ?? month}</p>
                    <p className="text-[11px] text-[var(--muted)]">Enlace permanente con resumen y accesos al dashboard filtrado.</p>
                  </div>
                  <span className="text-xs font-bold text-[var(--primary)]">Abrir</span>
                </TrackedLink>
              </Button>
            ))}
          </div>
        </article>

        <article className="ui-section-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[var(--foreground)]">Landings SEO relacionadas</h3>
            <span className="text-xs text-[var(--muted)]">Con enlaces al dashboard y al detalle de estaciones</span>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {[
              [appRoutes.dashboardStations(), 'Estaciones mas usadas'],
              [`${appRoutes.dashboard()}?rankingTab=turnover`, 'Ranking de estaciones'],
              [appRoutes.dashboardFlow(), 'Viajes por dia'],
              [appRoutes.reports(), 'Viajes por mes'],
            ].map(([href, label]) => (
              <Button asChild key={href} variant="outline" size="sm">
                <TrackedLink href={href}
                  className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:bg-[var(--card)]"
                >
                  {label}
                </TrackedLink>
              </Button>
            ))}
          </div>
        </article>
      </section>
    </PageShell>
  );
}
