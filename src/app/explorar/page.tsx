import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicSearchForm } from '@/app/_components/PublicSearchForm';
import { PublicSectionNav } from '@/app/_components/PublicSectionNav';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import {
  fetchAvailableDataMonths,
  fetchSharedDatasetSnapshot,
  fetchStatus,
} from '@/lib/api';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { formatMonthLabel, isValidMonthKey } from '@/lib/months';
import { getExploreHubSections } from '@/lib/public-navigation';
import { appRoutes } from '@/lib/routes';
import { buildPageMetadata } from '@/lib/seo';
import { buildFallbackAvailableMonths, buildFallbackDatasetSnapshot, buildFallbackStatus } from '@/lib/shared-data-fallbacks';
import { getCityName } from '@/lib/site';
import {
  formatStatusDateTime,
  getHealthLabel,
  getHealthToneClasses,
} from '@/lib/system-status';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'Explorar',
  description:
    'Hub publico para descubrir estaciones, flujo, rankings, heatmap, comparativas, historico, mapas y KPIs del sistema.',
  path: appRoutes.explore(),
});

export default async function ExploreHubPage() {
  const nowIso = new Date().toISOString();
  const cityName = getCityName();
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Explorar',
    href: appRoutes.explore(),
  });

  const [dataset, status, availableMonths] = await Promise.all([
    fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)),
    fetchStatus().catch(() => buildFallbackStatus(nowIso)),
    fetchAvailableDataMonths().catch(() => buildFallbackAvailableMonths(nowIso)),
  ]);

  const latestMonth = availableMonths.months.filter(isValidMonthKey)[0] ?? null;
  const sections = getExploreHubSections({ latestMonth });
  const totalTools = sections.reduce((count, section) => count + section.items.length, 0);
  const itemList = sections.flatMap((section) => section.items);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              buildBreadcrumbStructuredData(breadcrumbs),
              {
                '@type': 'CollectionPage',
                name: `Hub Explorar ${cityName}`,
                description:
                  'Indice publico de herramientas de analisis, comparativa, mapas, historico y movilidad.',
                url: appRoutes.explore(),
                hasPart: itemList.map((item, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  name: item.title,
                  url: item.href,
                })),
              },
            ],
          }),
        }}
      />

      <header className="hero-card">
        <SiteBreadcrumbs items={breadcrumbs} />
        <PublicSectionNav activeHref={appRoutes.explore()} className="mt-1" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Hub de analisis
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              Explorar {cityName}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Punto unico para descubrir estaciones, flujo, rankings, heatmap, historico,
              comparador, barrios, mapas y KPIs del sistema sin navegar por rutas dispersas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="kpi-chip">{totalTools} herramientas enlazadas</span>
            <span className="kpi-chip">Ultima muestra {formatStatusDateTime(dataset.lastUpdated.lastSampleAt)}</span>
            <span className="kpi-chip">{dataset.coverage.totalDays} dias de cobertura</span>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getHealthToneClasses(status.pipeline.healthStatus)}`}>
              {getHealthLabel(status.pipeline.healthStatus)}
            </span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-wrap gap-3">
            <Link
              href={appRoutes.dashboardView('research')}
              className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
            >
              Abrir analisis del dashboard
            </Link>
            <Link
              href={appRoutes.compare()}
              className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
            >
              Abrir comparador
            </Link>
          </div>

          <PublicSearchForm />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="dashboard-card">
          <p className="stat-label">Herramientas disponibles</p>
          <p className="stat-value">{totalTools}</p>
          <p className="text-xs text-[var(--muted)]">Cobertura transversal de operacion, analisis y archivo.</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Ultimo informe</p>
          <p className="stat-value">{latestMonth ? formatMonthLabel(latestMonth) : 'Sin datos'}</p>
          <p className="text-xs text-[var(--muted)]">Serie mensual conectada con el archivo indexable.</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Cobertura</p>
          <p className="stat-value">{dataset.coverage.totalDays}</p>
          <p className="text-xs text-[var(--muted)]">{dataset.coverage.totalStations} estaciones con datos historicos.</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Ultima generacion</p>
          <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">
            {formatStatusDateTime(dataset.coverage.generatedAt)}
          </p>
          <p className="text-xs text-[var(--muted)]">Snapshot comun para dashboard, informes y API.</p>
        </article>
      </section>

      {sections.map((section) => (
        <section key={section.id} className="dashboard-card">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                {section.title}
              </p>
              <h2 className="text-xl font-black text-[var(--foreground)]">{section.title}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{section.description}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {section.items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                  {item.eyebrow}
                </p>
                <h3 className="mt-2 text-lg font-black text-[var(--foreground)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.description}</p>
                <p className="mt-3 text-xs font-bold text-[var(--accent)]">{item.destinationLabel}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
