import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { PageShell } from '@/components/layout/page-shell';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { PublicPageLoading } from '@/app/_components/PublicPageLoading';
import { getExploreLoaderData } from '@/server-functions/explorar';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { appRoutes } from '@/lib/routes';

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
  loader: () => getExploreLoaderData(),
  pendingComponent: PublicPageLoading,
  component: ExplorePage,
});

function ExplorePage() {
  const { sections, breadcrumbs, latestMonth } = Route.useLoaderData();

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
