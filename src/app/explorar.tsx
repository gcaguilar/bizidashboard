import { Badge } from '@/components/ui/badge';
import { Link, createFileRoute, useSearch } from '@tanstack/react-router';
import { PublicSearchForm } from '@/app/_components/PublicSearchForm';
import { PublicSectionNav } from '@/app/_components/PublicSectionNav';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { formatMonthLabel } from '@/lib/months';
import { getExploreHubSections } from '@/lib/public-navigation';
import { appRoutes } from '@/lib/routes';
import { EXPLORE_PAGE_NAV_CONFIG } from '@/lib/seo-pages';
import { PageShell } from '@/components/layout/page-shell';
import { formatStatusDateTime } from '@/lib/system-status';
import { getExploreLoaderData } from '@/server-functions/explorar';
import { getSiteUrl } from '@/lib/site';

type ExploreSearch = {
  q?: string;
};

function getFirstSearchParam(
  value: string | string[] | undefined
): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

export const Route = createFileRoute('/explorar')({
  head: () => {
    const siteUrl = getSiteUrl()
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Hub publico para descubrir estaciones, flujo, rankings, heatmap, comparativas, historico, mapas y KPIs del sistema.',
        },
        { property: 'og:title', content: 'Explorar - DatosBizi' },
        { property: 'og:description', content: 'Hub publico para descubrir estaciones, flujo, rankings, heatmap, comparativas, historico, mapas y KPIs del sistema.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/explorar` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Explorar - DatosBizi' },
        { name: 'twitter:description', content: 'Hub publico para descubrir estaciones, flujo, rankings, heatmap, comparativas, historico, mapas y KPIs del sistema.' },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}/explorar` }],
      title: 'Explorar',
    }
  },
  loader: () => getExploreLoaderData(),
  component: ExploreHubPage,
});

export default function ExploreHubPage() {
  const { searchQuery, searchResults, latestMonth, sections, totalTools, breadcrumbs, structuredData } = Route.useLoaderData();

  return (
    <PageShell>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
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
              Explorar
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Punto unico para descubrir estaciones, flujo, rankings, heatmap, historico,
              comparador, barrios, mapas y KPIs del sistema sin navegar por rutas dispersas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="ui-chip">{totalTools} herramientas enlazadas</span>
            <span className="ui-chip">Ultima muestra {formatStatusDateTime('')}</span>
            <span className="ui-chip">0 dias de cobertura</span>
            <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold">
              Desconocido
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
              className="ui-inline-action"
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
                to={appRoutes.explore()}
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
                          to={result.href}
                          className="block rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--primary)]/40"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-[var(--foreground)]">
                              {result.title}
                            </p>
                            <Badge variant="muted">{result.badge}</Badge>
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
          <p className="stat-value">0</p>
          <p className="text-xs text-[var(--muted)]">Estaciones con datos historicos.</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Ultima generacion</p>
          <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">
            {formatStatusDateTime('')}
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
                to={item.href}
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
    </PageShell>
  );
}
