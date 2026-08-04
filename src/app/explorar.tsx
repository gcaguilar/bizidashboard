import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { PageShell } from '@/components/layout/page-shell';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { PublicPageLoading } from '@/app/_components/PublicPageLoading';
import { getExploreLoaderData } from '@/server-functions/explorar';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { appRoutes } from '@/lib/routes';
import type { GlobalSearchResponse } from '@/lib/global-search';

export const Route = createFileRoute('/explorar')({
  ssr: 'data-only',
  validateSearch: z.object({
    q: z.string().optional(),
  }),
  head: () => {
    const title = 'Explorar datos de Bizi Zaragoza - DatosBizi'
    const description = 'Hub de herramientas para analizar datos de Bizi Zaragoza: mapas, alertas, comparativas, histórico y movilidad.'
    return {
      meta: [
        { title },
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: appRoutes.explore() },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
      ],
      links: [{ rel: 'canonical', href: appRoutes.explore() }],
      title,
    }
  },
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ deps }) => getExploreLoaderData({ data: { q: deps.q } }),
  pendingComponent: PublicPageLoading,
  errorComponent: ExploreErrorPage,
  component: ExplorePage,
});

function ExploreErrorPage() {
  return (
    <PageShell>
      <header className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Hub no disponible</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
          No se pudo cargar Explorar
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
          Intenta recargar en unos minutos o revisa el estado de datos del sistema.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <TrackedLink href={appRoutes.status()} className="ui-primary-button">Ver estado</TrackedLink>
          <TrackedLink href={appRoutes.statsHub()} className="ui-inline-action">Ir a estadísticas</TrackedLink>
        </div>
      </header>
    </PageShell>
  );
}

function ExploreSearchResults({
  searchQuery,
  searchResults,
}: {
  searchQuery: string;
  searchResults: GlobalSearchResponse;
}) {
  const hasMatches = searchResults.totalMatches > 0;

  return (
    <section className="ui-section-card">
      <h2 className="text-xl font-black text-[var(--foreground)]">
        Resultados para &ldquo;{searchQuery}&rdquo;
      </h2>
      {!hasMatches && (
        <p className="mt-2 text-sm text-[var(--muted)]">
          No hay resultados para esta búsqueda. Prueba con el nombre o ID de una estación, un barrio o una herramienta.
        </p>
      )}
      {searchResults.groups
        .filter((group) => group.results.length > 0)
        .map((group) => (
          <div key={group.id} className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">{group.title}</h3>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              {group.results.map((result) => (
                <TrackedLink
                  key={result.id}
                  href={result.href}
                  navigationEvent={{
                    source: 'explore_search',
                    destination: result.id,
                    sourceRole: 'hub',
                    destinationRole: 'hub',
                    transitionKind: 'within_public',
                  }}
                  className="ui-surface-block ui-surface-block-interactive flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">{result.badge}</p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--foreground)]">{result.title}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--muted)]">{result.description}</p>
                  </div>
                </TrackedLink>
              ))}
            </div>
          </div>
        ))}
    </section>
  );
}

function ExplorePage() {
  const { sections, breadcrumbs, latestMonth, searchQuery, searchResults } = Route.useLoaderData();

  return (
    <PageShell>
      <SiteBreadcrumbs items={breadcrumbs} />

      <header className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Hub de herramientas</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">Explorar datos de Bizi Zaragoza</h1>
        <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
          Herramientas para analizar el sistema Bizi: mapas, alertas, comparativas, histórico y movilidad urbana.
          {latestMonth ? ` Último informe mensual disponible: ${latestMonth}.` : ''}
        </p>
      </header>

      {searchQuery && searchResults && (
        <ExploreSearchResults searchQuery={searchQuery} searchResults={searchResults} />
      )}

      {sections.map((section) => (
        <section key={section.id} className="ui-section-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">{section.title}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{section.description}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {section.items.map((item) => (
              <TrackedLink
                key={item.id}
                href={item.href}
                navigationEvent={{
                  source: 'explore_hub',
                  destination: item.id,
                  sourceRole: 'hub',
                  destinationRole: 'hub',
                  transitionKind: 'within_public',
                }}
                className="ui-surface-block ui-surface-block-interactive group flex items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">{item.eyebrow}</p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--muted)]">{item.description}</p>
                </div>
                <span className="shrink-0 text-xs font-bold text-[var(--primary)] group-hover:underline">{item.destinationLabel}</span>
              </TrackedLink>
            ))}
          </div>
        </section>
      ))}
    </PageShell>
  );
}
