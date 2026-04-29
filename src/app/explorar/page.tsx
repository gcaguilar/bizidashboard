import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicSearchForm } from '@/app/_components/PublicSearchForm';
import { PublicSectionNav } from '@/app/_components/PublicSectionNav';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { TrackedLink } from '@/app/_components/TrackedLink';
import {
  fetchAvailableDataMonths,
  fetchSharedDatasetSnapshot,
  fetchStatus,
} from '@/lib/api';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { searchGlobalContent } from '@/lib/global-search';
import { formatMonthLabel, isValidMonthKey } from '@/lib/months';
import { getExploreHubSections } from '@/lib/public-navigation';
import { appRoutes, toAbsoluteRouteUrl } from '@/lib/routes';
import { buildPageMetadata } from '@/lib/seo';
import { EXPLORE_PAGE_NAV_CONFIG } from '@/lib/seo-pages';
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

type ExploreHubPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getFirstSearchParam(
  value: string | string[] | undefined
): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

export default async function ExploreHubPage({ searchParams }: ExploreHubPageProps) {
  const nowIso = new Date().toISOString();
  const cityName = getCityName();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const searchQuery = getFirstSearchParam(resolvedSearchParams.q).trim();
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Explorar',
    href: appRoutes.explore(),
  });

  const [dataset, status, availableMonths, searchResults] = await Promise.all([
    fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)),
    fetchStatus().catch(() => buildFallbackStatus(nowIso)),
    fetchAvailableDataMonths().catch(() => buildFallbackAvailableMonths(nowIso)),
    searchQuery ? searchGlobalContent(searchQuery) : Promise.resolve(null),
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
                url: toAbsoluteRouteUrl(appRoutes.explore()),
                hasPart: itemList.map((item, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  name: item.title,
                  url: toAbsoluteRouteUrl(item.href),
                })),
              },
            ],
          }),
        }}
      />

      <header className="ui-page-hero">
        <SiteBreadcrumbs items={breadcrumbs} />
        <PublicSectionNav activeItemId="explore" className="mt-1" />

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
            <span className="ui-chip">{totalTools} herramientas enlazadas</span>
            <span className="ui-chip">Ultima muestra {formatStatusDateTime(dataset.lastUpdated.lastSampleAt)}</span>
            <span className="ui-chip">{dataset.coverage.totalDays} dias de cobertura</span>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getHealthToneClasses(status.pipeline.healthStatus)}`}>
              {getHealthLabel(status.pipeline.healthStatus)}
            </span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-wrap gap-3">
            <TrackedLink
              href={EXPLORE_PAGE_NAV_CONFIG.primaryCta.href}
              ctaEvent={{
                source: 'explore_hero',
                ctaId: 'explore_primary',
                destination: EXPLORE_PAGE_NAV_CONFIG.primaryCta.destination,
                sourceRole: 'hub',
                destinationRole: 'dashboard',
                transitionKind: 'to_dashboard',
              }}
              className="inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
            >
              {EXPLORE_PAGE_NAV_CONFIG.primaryCta.label}
            </TrackedLink>
            <TrackedLink
              href={appRoutes.compare()}
              ctaEvent={{
                source: 'explore_hero',
                ctaId: 'explore_secondary',
                destination: 'compare',
                sourceRole: 'hub',
                destinationRole: 'hub',
                transitionKind: 'within_public',
              }}
              className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--primary)]/40"
            >
              Abrir comparador
            </TrackedLink>
          </div>

          <PublicSearchForm defaultQuery={searchQuery} />
        </div>
      </header>

      {searchResults ? (
        <section className="ui-section-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                Busqueda federada
              </p>
              <h2 className="text-xl font-black text-[var(--foreground)]">
                Resultados para &quot;{searchResults.query}&quot;
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                El buscador cruza estaciones, barrios, informes, paginas publicas y endpoints API.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
              <span className="ui-chip">{searchResults.totalMatches} coincidencias</span>
              <Link
                href={appRoutes.explore()}
                className="inline-flex rounded-full border border-[var(--border)] bg-[var(--secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"
              >
                Limpiar busqueda
              </Link>
            </div>
          </div>

          {searchResults.totalMatches === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4 text-sm text-[var(--muted)]">
              No hemos encontrado coincidencias exactas para esta consulta. Prueba con el nombre de
              una estacion, un barrio, un mes como &quot;2026-03&quot; o un endpoint como
              &quot;/api/status&quot;.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {searchResults.groups.map((group) => (
                <article key={group.id} className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                        {group.title}
                      </p>
                      <h3 className="text-lg font-black text-[var(--foreground)]">
                        {group.results.length}
                      </h3>
                    </div>
                    <span className="text-xs text-[var(--muted)]">
                      {group.results.length > 0 ? 'Top resultados' : group.emptyLabel}
                    </span>
                  </div>

                  {group.results.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {group.results.map((result) => (
                        <Link
                          key={result.id}
                          href={result.href}
                          className="block rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-[var(--foreground)]">
                              {result.title}
                            </p>
                            <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                              {result.badge}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                            {result.description}
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <article className="ui-section-card">
          <p className="stat-label">Herramientas disponibles</p>
          <p className="stat-value">{totalTools}</p>
          <p className="text-xs text-[var(--muted)]">Cobertura transversal de operacion, analisis y archivo.</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Ultimo informe</p>
          <p className="stat-value">{latestMonth ? formatMonthLabel(latestMonth) : 'Sin datos'}</p>
          <p className="text-xs text-[var(--muted)]">Serie mensual conectada con el archivo indexable.</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Cobertura</p>
          <p className="stat-value">{dataset.coverage.totalDays}</p>
          <p className="text-xs text-[var(--muted)]">{dataset.coverage.totalStations} estaciones con datos historicos.</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Ultima generacion</p>
          <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">
            {formatStatusDateTime(dataset.coverage.generatedAt)}
          </p>
          <p className="text-xs text-[var(--muted)]">Snapshot comun para dashboard, informes y API.</p>
        </article>
      </section>

      {sections.map((section) => (
        <section key={section.id} className="ui-section-card">
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
                className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-4 transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                  {item.eyebrow}
                </p>
                <h3 className="mt-2 text-lg font-black text-[var(--foreground)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.description}</p>
                <p className="mt-3 text-xs font-bold text-[var(--primary)]">{item.destinationLabel}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
