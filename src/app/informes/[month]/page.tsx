import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { fetchAvailableDataMonths } from '@/lib/api';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { formatMonthLabel, isValidMonthKey } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import {
  getDailyMobilityConclusions,
  type MobilityConclusionsPayload,
} from '@/lib/mobility-conclusions';
import { buildPageMetadata } from '@/lib/seo';
import { getSeoPageConfig } from '@/lib/seo-pages';
import { getSiteUrl, SITE_NAME } from '@/lib/site';

export const dynamicParams = false;
export const revalidate = 3600;

type PageProps = {
  params: Promise<{ month: string }>;
};

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

function formatDelta(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return 'Sin referencia';
  }

  const rounded = Math.round(value * 100);
  return `${rounded >= 0 ? '+' : ''}${rounded}%`;
}

function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00-${String((hour + 1) % 24).padStart(2, '0')}:00`;
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

function buildFallbackPayload(month: string): MobilityConclusionsPayload {
  return {
    dateKey: new Date().toISOString().slice(0, 10),
    generatedAt: new Date().toISOString(),
    selectedMonth: month,
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
    summary: 'Todavia no hay historico suficiente para publicar este informe mensual.',
    highlights: [],
    recommendations: [],
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

async function getAvailableMonths(): Promise<string[]> {
  const response = await fetchAvailableDataMonths().catch(() => ({
    months: [],
    generatedAt: new Date().toISOString(),
  }));

  return response.months.filter(isValidMonthKey);
}

export async function generateStaticParams() {
  const months = await getAvailableMonths();
  return months.map((month) => ({ month }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { month } = await params;

  if (!isValidMonthKey(month)) {
    return {};
  }

  const monthLabel = formatMonthLabel(month);

  return buildPageMetadata({
    title: `Informe mensual Bizi Zaragoza ${monthLabel}`,
    description: `Informe mensual de Bizi Zaragoza para ${monthLabel}, con demanda estimada, ocupacion, horas pico, barrios destacados y comparativas operativas.`,
    path: appRoutes.reportMonth(month),
    keywords: [
      `informe mensual bizi ${month}`,
      `bizi zaragoza ${monthLabel}`,
      'reporte mensual bizi zaragoza',
      'estadisticas bizi por mes',
    ],
  });
}

export default async function MonthlyReportPage({ params }: PageProps) {
  const { month } = await params;

  if (!isValidMonthKey(month)) {
    notFound();
  }

  const availableMonths = await getAvailableMonths();

  if (!availableMonths.includes(month)) {
    notFound();
  }

  const payload = await getDailyMobilityConclusions(month)
    .then((result) => result.payload)
    .catch(() => buildFallbackPayload(month));

  const monthLabel = formatMonthLabel(month);
  const siteUrl = getSiteUrl();
  const archiveConfig = getSeoPageConfig('informes-mensuales-bizi-zaragoza');
  const relatedPages = [
    getSeoPageConfig('viajes-por-mes-zaragoza'),
    getSeoPageConfig('estaciones-mas-usadas-zaragoza'),
    getSeoPageConfig('uso-bizi-por-estacion'),
  ];
  const currentIndex = availableMonths.indexOf(month);
  const newerMonth = currentIndex > 0 ? availableMonths[currentIndex - 1] : null;
  const olderMonth = currentIndex >= 0 && currentIndex < availableMonths.length - 1 ? availableMonths[currentIndex + 1] : null;
  const breadcrumbs = createRootBreadcrumbs(
    {
      label: 'Informes mensuales',
      href: appRoutes.seoPage('informes-mensuales-bizi-zaragoza'),
    },
    {
      label: monthLabel,
      href: appRoutes.reportMonth(month),
    }
  );

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'Report',
        name: `Informe mensual Bizi Zaragoza ${monthLabel}`,
        description: payload.summary,
        datePublished: payload.generatedAt,
        dateModified: payload.generatedAt,
        inLanguage: 'es',
        url: `${siteUrl}${appRoutes.reportMonth(month)}`,
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: siteUrl,
        },
      },
    ],
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <header className="hero-card">
        <SiteBreadcrumbs items={breadcrumbs} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Informe mensual indexable</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              Informe mensual Bizi Zaragoza {monthLabel}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">{payload.summary}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="kpi-chip">Mes {month}</span>
            <span className="kpi-chip">Cobertura desde {formatDate(payload.sourceFirstDay)}</span>
            <span className="kpi-chip">Ultima muestra {formatDate(payload.sourceLastDay)}</span>
            <span className="kpi-chip">Actualizado {new Date(payload.generatedAt).toLocaleDateString('es-ES')}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={appRoutes.dashboardConclusions({ month })}
            className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
          >
            Abrir dashboard filtrado por mes
          </Link>
          <Link
            href={appRoutes.reports()}
            className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
          >
            Volver al archivo mensual
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="dashboard-card">
          <p className="stat-label">Demanda del mes</p>
          <p className="stat-value">{formatInteger(payload.metrics.demandLast7Days)} pts</p>
          <p className="text-xs text-[var(--muted)]">Indice agregado del periodo, pensado para comparativa operativa y SEO.</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Variacion</p>
          <p className="stat-value">{formatDelta(payload.metrics.demandDeltaRatio)}</p>
          <p className="text-xs text-[var(--muted)]">Comparativa frente al periodo previo equivalente.</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Ocupacion media</p>
          <p className="stat-value">{formatPercent(payload.metrics.occupancyLast7Days)}</p>
          <p className="text-xs text-[var(--muted)]">Promedio de ocupacion del sistema durante el mes analizado.</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="dashboard-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">Hallazgos del mes</h2>
          <div className="mt-2 space-y-3">
            {payload.highlights.length > 0 ? payload.highlights.map((item) => (
              <article key={`${item.title}-${item.detail}`} className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
                <p className="mt-1 text-[11px] text-[var(--muted)]">{item.detail}</p>
              </article>
            )) : <p className="text-sm text-[var(--muted)]">Sin hallazgos disponibles para este mes.</p>}
          </div>
        </article>

        <article className="dashboard-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">Recomendaciones operativas</h2>
          <div className="mt-2 space-y-3">
            {payload.recommendations.length > 0 ? payload.recommendations.map((item, index) => (
              <article key={`${item}-${index}`} className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--foreground)]">Accion {index + 1}</p>
                <p className="mt-1 text-[11px] text-[var(--muted)]">{item}</p>
              </article>
            )) : <p className="text-sm text-[var(--muted)]">Sin recomendaciones registradas.</p>}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="dashboard-card xl:col-span-2">
          <h2 className="text-xl font-black text-[var(--foreground)]">Estaciones mas destacadas del mes</h2>
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            {payload.topStationsByDemand.map((station, index) => (
              <Link
                key={station.stationId}
                href={appRoutes.dashboardStation(station.stationId)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
              >
                <p className="text-sm font-semibold text-[var(--foreground)]">{index + 1}. {station.stationName}</p>
                <p className="mt-1 text-[11px] text-[var(--muted)]">Indice medio {station.avgDemand.toFixed(1)} pts/dia</p>
              </Link>
            ))}
          </div>
        </article>

        <article className="dashboard-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">Horas pico</h2>
          <div className="mt-2 space-y-3">
            {payload.peakDemandHours.map((slot) => (
              <div key={slot.hour} className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--foreground)]">{formatHourLabel(slot.hour)}</p>
                <p className="mt-1 text-[11px] text-[var(--muted)]">{formatInteger(slot.demandScore)} pts de actividad agregada</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="dashboard-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">Entre semana vs fin de semana</h2>
          <div className="mt-2 space-y-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--foreground)]">Entre semana</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                {payload.weekdayWeekendProfile.weekday.avgDemand.toFixed(1)} pts/dia · ocupacion {formatPercent(payload.weekdayWeekendProfile.weekday.avgOccupancy)}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--foreground)]">Fin de semana</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                {payload.weekdayWeekendProfile.weekend.avgDemand.toFixed(1)} pts/dia · ocupacion {formatPercent(payload.weekdayWeekendProfile.weekend.avgOccupancy)}
              </p>
            </div>
          </div>
        </article>

        <article className="dashboard-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">Barrios destacados</h2>
          <div className="mt-2 space-y-3">
            {payload.topDistrictsByDemand.map((district) => (
              <div key={district.district} className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--foreground)]">{district.district}</p>
                <p className="mt-1 text-[11px] text-[var(--muted)]">{formatInteger(district.demandScore)} pts de demanda agregada</p>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">Cobertura</h2>
          <div className="mt-2 space-y-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--foreground)]">Rango historico</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                Desde {formatDate(payload.sourceFirstDay)} hasta {formatDate(payload.sourceLastDay)}.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--foreground)]">Dias historicos</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">{payload.totalHistoricalDays} dias con datos consolidados.</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--foreground)]">Estaciones con muestra</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">{payload.stationsWithData} estaciones con datos en el periodo.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[var(--foreground)]">Navegacion mensual</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Enlaces persistentes para indexacion, archivo historico y exploracion por mes.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {newerMonth ? (
              <Link href={appRoutes.reportMonth(newerMonth)} className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40">
                Mes mas reciente: {formatMonthLabel(newerMonth)}
              </Link>
            ) : null}
            {olderMonth ? (
              <Link href={appRoutes.reportMonth(olderMonth)} className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40">
                Mes anterior: {formatMonthLabel(olderMonth)}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="dashboard-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Mas paginas relacionadas</h2>
        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Link
            href={appRoutes.seoPage(archiveConfig.slug)}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">{archiveConfig.title}</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Archivo completo de informes y comparativas.</p>
          </Link>
          {relatedPages.map((page) => (
            <Link
              key={page.slug}
              href={appRoutes.seoPage(page.slug)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
            >
              <p className="text-sm font-semibold text-[var(--foreground)]">{page.title}</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">{page.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
