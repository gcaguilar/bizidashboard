import { createFileRoute } from '@tanstack/react-router';
import { fetchSeoLandingData } from '@/server-functions/seo-landing';
import { getSiteUrl } from '@/lib/site';
import { PageShell } from '@/components/layout/page-shell';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { PublicPageViewTracker } from '@/app/_components/PublicPageViewTracker';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { formatDateLabel } from '@/lib/format';
import { appRoutes, toAbsoluteRouteUrl } from '@/lib/routes';
import { Card } from '@/components/ui/card';

export const Route = createFileRoute('/estadisticas/viajes')({
  loader: () => fetchSeoLandingData({ data: { slug: 'viajes-por-mes-zaragoza' } }),
  head: () => {
    const siteUrl = getSiteUrl();
    const title = 'Viajes Bizi Zaragoza - DatosBizi';
    const description = 'Tendencia diaria y mensual de viajes estimados en el sistema Bizi Zaragoza.';
    return {
      meta: [
        { title },
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/estadisticas/viajes` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}/estadisticas/viajes` }],
      title,
    };
  },
  component: ViajesPage,
});

function ViajesPage() {
  const { config, content } = Route.useLoaderData();
  const canonicalPath = '/estadisticas/viajes';
  const breadcrumbs = createRootBreadcrumbs({ label: config.title, href: canonicalPath });
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'CollectionPage',
        name: config.title,
        description: config.description,
        url: toAbsoluteRouteUrl(canonicalPath),
        dateModified: content.generatedAt,
      },
    ],
  };

  return (
    <PageShell>
      <PublicPageViewTracker pageType="seo_hub" template="statistics_subpage" pageSlug="viajes-por-mes-zaragoza" />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <SiteBreadcrumbs items={breadcrumbs} />

      <header className="ui-page-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{config.heroKicker}</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">{config.title}</h1>
        <p className="mt-3 text-sm text-[var(--muted)] md:text-base">{content.summary}</p>
        <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
          <span className="ui-chip">{config.cadenceLabel}</span>
          <span className="ui-chip">Actualizado {formatDateLabel(content.generatedAt)}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <TrackedLink href={appRoutes.reports()} ctaEvent={{ source: 'viajes_page', ctaId: 'view_reports', destination: 'report_archive', sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }} className="ui-primary-button">Ver informes mensuales</TrackedLink>
          <TrackedLink href={appRoutes.dashboardConclusions()} ctaEvent={{ source: 'viajes_page', ctaId: 'view_trend', destination: 'dashboard_conclusions', sourceRole: 'hub', destinationRole: 'dashboard', transitionKind: 'to_dashboard' }} className="ui-inline-action">Ver tendencia en dashboard</TrackedLink>
        </div>
      </header>

      {content.emptyReason ? (
        <section className="rounded-2xl border border-[var(--warning)]/30 bg-[var(--warning)]/12 px-4 py-3 text-sm text-[var(--foreground)] shadow-[var(--shadow-soft)]">
          <p className="font-semibold">Datos parciales</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{content.emptyReason}</p>
        </section>
      ) : null}

      {content.stats.length > 0 && (
        <section className="grid gap-4 md:grid-cols-3">
          {content.stats.map((stat) => (
            <article key={stat.label} className="ui-section-card">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
              <p className="text-xs text-[var(--muted)]">{stat.detail}</p>
            </article>
          ))}
        </section>
      )}

      {content.sectionItems.length > 0 && (
        <section className="ui-section-card">
          <h2 className="text-xl font-black text-[var(--foreground)]">{content.sectionTitle}</h2>
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            {content.sectionItems.map((item) => {
              const body = (
                <>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
                    <p className="mt-1 text-[11px] text-[var(--muted)]">{item.detail}</p>
                  </div>
                </>
              );
              if (!item.href) {
                return <Card key={`${item.title}-${item.detail}`} variant="stat" className="flex-row items-center justify-between gap-3 px-4 py-3">{body}</Card>;
              }
              return (
                <TrackedLink key={`${item.title}-${item.href}`} href={item.href} navigationEvent={{ source: 'viajes_page_items', destination: item.href, sourceRole: 'hub', destinationRole: 'hub', transitionKind: 'within_public' }} className="group block transition hover:-translate-y-0.5">
                  <Card variant="stat" className="flex-row items-center justify-between gap-3 px-4 py-3 transition-colors group-hover:border-[var(--primary)]/40">{body}</Card>
                </TrackedLink>
              );
            })}
          </div>
        </section>
      )}
    </PageShell>
  );
}
