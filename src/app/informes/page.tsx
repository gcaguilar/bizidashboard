import type { Metadata } from 'next';
import Link from 'next/link';
import { getMonthlyDemandCurve } from '@/analytics/queries/read';
import { fetchAvailableDataMonths } from '@/lib/api';
import { formatMonthLabel, isValidMonthKey } from '@/lib/months';
import { buildPageMetadata } from '@/lib/seo';
import { getSiteUrl, SITE_NAME } from '@/lib/site';

export const revalidate = 3600;

export const metadata: Metadata = buildPageMetadata({
  title: 'Informes Bizi Zaragoza por mes',
  description:
    'Indice SEO de informes mensuales de Bizi Zaragoza con acceso al historico por mes, comparativas y enlaces al dashboard filtrado.',
  path: '/informes',
  keywords: [
    'informes bizi zaragoza',
    'informes por mes bizi',
    'archivo mensual bizi zaragoza',
    'estadisticas bizi zaragoza',
  ],
});

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
  const [monthsResponse, monthlySeries] = await Promise.all([
    fetchAvailableDataMonths().catch(() => ({ months: [], generatedAt: new Date().toISOString() })),
    getMonthlyDemandCurve(24).catch(() => []),
  ]);

  const months = monthsResponse.months.filter(isValidMonthKey);
  const monthMap = new Map(monthlySeries.map((row) => [row.monthKey, row]));
  const latestMonth = months[0] ?? null;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Informes Bizi Zaragoza por mes',
        description:
          'Archivo historico de informes mensuales de Bizi Zaragoza con enlaces persistentes por mes y acceso al dashboard filtrado.',
        url: `${siteUrl}/informes`,
        inLanguage: 'es',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Informes', item: `${siteUrl}/informes` },
        ],
      },
      {
        '@type': 'Organization',
        name: SITE_NAME,
        url: siteUrl,
      },
    ],
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <header className="hero-card">
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
            <Link
              href={`/informes/${latestMonth}`}
              className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
            >
              Abrir ultimo informe mensual
            </Link>
          ) : null}
          <Link
            href="/dashboard/conclusiones"
            className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
          >
            Abrir conclusiones del dashboard
          </Link>
        </div>
      </header>

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
          <Link href="/informes" className="text-sm font-bold text-[var(--accent)] transition hover:opacity-80">
            Ver archivo completo
          </Link>
        </div>

        <div className="mt-2 space-y-3">
          {months.map((month) => {
            const row = monthMap.get(month);

            return (
              <Link
                key={month}
                href={`/informes/${month}`}
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
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
