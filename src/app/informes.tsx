import { Outlet, createFileRoute, useLocation } from '@tanstack/react-router';
import { buildSeoHead } from '@/lib/seo-head'
import { DataStateNotice } from '@/app/_components/DataStateNotice';
import { PublicPageViewTracker } from '@/app/_components/PublicPageViewTracker';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { shouldShowDataStateNotice } from '@/lib/data-state';
import { formatRatioDelta, formatInteger, formatPercent } from '@/lib/format';
import { formatMonthLabel, monthDayCount, previousMonthKey } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { PageShell } from '@/components/layout/page-shell';
import { getReportsIndexPageData } from '@/server-functions/informes';
import { toJsonLdScript } from '@/lib/structured-data';

export const Route = createFileRoute('/informes')({
  head: () =>
    buildSeoHead({
      title: 'Informes mensuales de Bizi Zaragoza | Archivo histórico',
      description: 'Archivo de informes mensuales de Bizi Zaragoza con enlaces estables, comparativas y acceso directo a cada mes publicado.',
      path: appRoutes.reports(),
    }),
  loader: () => getReportsIndexPageData(),
  component: ReportsIndexPage,
});

export default function ReportsIndexPage() {
  const location = useLocation();
  const { months, monthMap, latestMonth, latestPeriodCoverage, latestTrend, latestComparisonLabel, currentMonth, reportsDataState, breadcrumbs, structuredData } = Route.useLoaderData();
  const monthlyRows = new Map(Object.entries(monthMap));
  const latestTrendLabel =
    latestComparisonLabel === 'mismos días del mes anterior'
      ? 'vs mismos días del mes anterior'
      : 'frente al mes anterior';

  // Para las filas del archivo comparamos solo meses ya cerrados: el mes en
  // curso es parcial y su total crudo no es comparable con un mes completo.
  // Normalizamos por dias para que no dependa de tener 28, 30 o 31 dias.
  function demandTrendFor(month: string): number | null {
    if (!currentMonth || month >= currentMonth) {
      return null;
    }

    const referenceMonth = previousMonthKey(month);
    const row = monthlyRows.get(month);
    const referenceRow = referenceMonth ? monthlyRows.get(referenceMonth) : undefined;
    const monthDays = monthDayCount(month);
    const referenceDays = referenceMonth ? monthDayCount(referenceMonth) : 0;

    if (!row || !referenceRow || monthDays <= 0 || referenceDays <= 0 || referenceRow.demandScore <= 0) {
      return null;
    }

    const monthRate = row.demandScore / monthDays;
    const referenceRate = referenceRow.demandScore / referenceDays;

    if (referenceRate <= 0) {
      return null;
    }

    return (monthRate - referenceRate) / referenceRate;
  }

  if (location.pathname !== appRoutes.reports()) {
    return <Outlet />;
  }

  return (
    <PageShell>
      <PublicPageViewTracker pageType="report_archive" template="reports_index" pageSlug="informes" />

      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: toJsonLdScript(structuredData) }} />

      <div className="mx-auto mb-4 w-full max-w-[1280px]">
        <SiteBreadcrumbs items={breadcrumbs} />
      </div>

      <header className="ui-page-hero">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Archivo mensual</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              Informes mensuales de Bizi Zaragoza
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Consulta cómo cambió la red cada mes: movimiento estimado, ocupación, estaciones activas y acceso al análisis de cada periodo.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
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
              className="ui-primary-button inline-flex w-fit items-center gap-2 text-base"
            >
              Abrir último informe: {formatMonthLabel(latestMonth)}
            </TrackedLink>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span className="ui-chip">{months.length} meses publicados</span>
            {latestPeriodCoverage ? (
              <span className="ui-chip">
                {latestPeriodCoverage.label} · {latestPeriodCoverage.coveredDays} de {latestPeriodCoverage.expectedDays} días disponibles
              </span>
            ) : null}
            {latestTrend !== null ? (
              <span
                className={`ui-chip ${latestTrend >= 0 ? 'text-[var(--primary)]' : 'text-[var(--warning)]'}`}
              >
                <span aria-hidden="true">{latestTrend >= 0 ? '▲' : '▼'}</span>
                <span className="sr-only">{latestTrend >= 0 ? 'Sube' : 'Baja'}</span>{' '}
                {formatRatioDelta(latestTrend)} {latestTrendLabel}
              </span>
            ) : null}
            <TrackedLink
              href={appRoutes.statsViajes()}
              navigationEvent={{
                source: 'reports_hero',
                destination: 'dashboard_conclusions',
                sourceRole: 'hub',
                destinationRole: 'dashboard',
                transitionKind: 'to_dashboard',
              }}
              className="ui-inline-action"
            >
              Ver evolución mensual
            </TrackedLink>
          </div>
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

      <section className="grid gap-3 md:grid-cols-3">
        <article className="ui-section-card py-3">
          <p className="stat-label">Último mes con informe</p>
          <p className="stat-value">{latestMonth ? formatMonthLabel(latestMonth) : 'Sin datos'}</p>
        </article>
        <article className="ui-section-card py-3">
          <p className="stat-label">Meses publicados</p>
          <p className="stat-value">{months.length}</p>
        </article>
        <article className="ui-section-card py-3">
          <p className="stat-label">Periodo del archivo</p>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {months.length === 0
              ? 'Sin datos'
              : `${formatMonthLabel(months[months.length - 1])} – ${formatMonthLabel(months[0])}`}
          </p>
        </article>
      </section>

      <section className="ui-section-card">
        <div className="mb-3">
          <h2 className="text-xl font-black text-[var(--foreground)]">Todos los informes mensuales</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Aquí puedes consultar el histórico de Bizi Zaragoza mes a mes. Cada informe resume un periodo concreto y te lleva a sus barrios, estaciones y rankings.
          </p>
        </div>

        <div className="space-y-3">
          {months.map((month) => {
            const row = monthlyRows.get(month);
            const trend = demandTrendFor(month);

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
                className="ui-surface-block ui-surface-block-interactive flex items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">Informe {formatMonthLabel(month)}</p>
                  <p className="text-[11px] text-[var(--muted)]">
                    {row
                      ? `${formatInteger(row.demandScore)} puntos de movimiento estimado · ocupación ${formatPercent(row.avgOccupancy)} · ${row.activeStations} estaciones`
                      : 'Informe disponible para consultar ese mes en detalle.'}
                  </p>
                  {month === latestMonth && latestPeriodCoverage ? (
                    <p className="mt-1 text-[11px] font-semibold text-[var(--primary)]">
                      {latestPeriodCoverage.label} · {latestPeriodCoverage.coveredDays} de {latestPeriodCoverage.expectedDays} días disponibles
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {trend !== null ? (
                    <span
                      className={`text-[11px] font-bold ${trend >= 0 ? 'text-[var(--primary)]' : 'text-[var(--warning)]'}`}
                    >
                      <span aria-hidden="true">{trend >= 0 ? '▲' : '▼'}</span>
                      <span className="sr-only">{trend >= 0 ? 'Sube' : 'Baja'}</span>{' '}
                      {formatRatioDelta(trend)}
                    </span>
                  ) : null}
                  <span className="text-xs font-bold text-[var(--primary)]">Abrir informe</span>
                </div>
              </TrackedLink>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
