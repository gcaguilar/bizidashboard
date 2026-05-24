import type React from 'react';
import { PublicPageViewTracker } from '@/app/_components/PublicPageViewTracker';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { appRoutes, toAbsoluteRouteUrl } from '@/lib/routes';
import { buildItemListStructuredData } from '@/lib/structured-data';
import { getSiteUrl, SITE_NAME } from '@/lib/site';
import { PageShell } from '@/components/layout/page-shell';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  getSeoPageConfig,
  PRIMARY_SEO_PAGE_SLUGS,
  type SeoPageConfig,
  type SeoPageSlug,
} from '@/lib/seo-pages';

type SeoStat = {
  label: string;
  value: string;
  detail: string;
};

type SeoItem = {
  title: string;
  detail: string;
  href?: string;
  badge?: string;
};

export type SeoLandingContent = {
  generatedAt: string;
  summary: string;
  stats: SeoStat[];
  sectionTitle: string;
  sectionItems: SeoItem[];
  emptyReason?: string;
};

function buildSeoFaqStructuredData(config: SeoPageConfig) {
  return {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Que ofrece la pagina ${config.title}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: config.description,
        },
      },
      {
        '@type': 'Question',
        name: 'Cada cuanto se actualiza esta informacion?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${config.cadenceLabel}. La fecha visible en la pagina indica la ultima actualizacion publicada.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Donde puedo ver el detalle operativo completo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Desde esta pagina puedes abrir ${config.primaryCta.label.toLowerCase()} para consultar el detalle actualizado.`,
        },
      },
    ],
  };
}

function resolveSeoLandingDestinationRole(href: string): 'dashboard' | 'hub' | 'utility' {
  if (href.startsWith('/dashboard')) {
    return 'dashboard';
  }
  if (
    href === appRoutes.developers() ||
    href === appRoutes.methodology() ||
    href === appRoutes.status()
  ) {
    return 'utility';
  }
  return 'hub';
}

function resolveSeoLandingDestination(href: string): string {
  if (href.startsWith('/dashboard')) {
    return 'dashboard_view';
  }
  if (href.startsWith('/estaciones/')) {
    return 'station_detail';
  }
  if (href.startsWith('/barrios/')) {
    return 'district_detail';
  }
  if (href.startsWith('/informes/')) {
    return 'monthly_report';
  }
  return href === appRoutes.reports() ? 'report_archive' : 'seo_or_hub';
}

function resolveSeoLandingTransitionKind(href: string): 'to_dashboard' | 'within_public' {
  return href.startsWith('/dashboard') ? 'to_dashboard' : 'within_public';
}

type SeoLandingPageProps = {
  slug: SeoPageSlug;
  config: SeoPageConfig;
  content: SeoLandingContent;
  indexability: { canonicalPath?: string };
  navOverride?: React.ReactNode;
};

export function SeoLandingPageComponent({ slug, config, content, indexability, navOverride }: SeoLandingPageProps) {
  const siteUrl = getSiteUrl();
  const canonicalPath = indexability.canonicalPath;
  const breadcrumbs = createRootBreadcrumbs({
    label: config.title,
    href: canonicalPath,
  });
  const relatedPages = PRIMARY_SEO_PAGE_SLUGS.filter((pageSlug) => pageSlug !== slug)
    .slice(0, 4)
    .map((pageSlug) => getSeoPageConfig(pageSlug));
  const itemListEntries = content.sectionItems
    .filter((item): item is SeoItem & { href: string } => typeof item.href === 'string')
    .map((item) => ({
      name: item.title,
      url: toAbsoluteRouteUrl(item.href),
    }));
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'CollectionPage',
        name: config.title,
        description: config.description,
        inLanguage: 'es',
        url: toAbsoluteRouteUrl(canonicalPath),
        dateModified: content.generatedAt,
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: siteUrl,
        },
      },
      ...(itemListEntries.length > 0
        ? [buildItemListStructuredData(content.sectionTitle, itemListEntries)]
        : []),
      buildSeoFaqStructuredData(config),
    ],
  };

  return (
    <PageShell>
      <PublicPageViewTracker pageType="seo_hub" template="seo_landing" pageSlug={slug} />

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SiteBreadcrumbs items={breadcrumbs} />

      <header className="ui-page-hero">
        {navOverride ?? null}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              {config.heroKicker}
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              {config.title}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              {content.summary}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="ui-chip">{config.cadenceLabel}</span>
            <span className="ui-chip">
              Actualizado {new Date(content.generatedAt).toLocaleDateString('es-ES')}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <TrackedLink
            href={config.primaryCta.href}
            ctaEvent={{
              source: 'seo_landing_hero',
              ctaId: 'seo_primary',
              destination: config.primaryCta.destination,
              sourceRole: config.pageRole === 'HUB' ? 'hub' : 'entry_seo',
              destinationRole: config.primaryCta.destination.startsWith('dashboard_') ? 'dashboard' : 'hub',
              transitionKind: config.primaryCta.destination.startsWith('dashboard_') ? 'to_dashboard' : 'within_public',
            }}
            className="ui-primary-button"
          >
            {config.primaryCta.label}
          </TrackedLink>
          <TrackedLink
            href={appRoutes.reports()}
            ctaEvent={{
              source: 'seo_landing_hero',
              ctaId: 'report_open',
              destination: 'report_archive',
              entityType: 'report',
              sourceRole: config.pageRole === 'HUB' ? 'hub' : 'entry_seo',
              destinationRole: 'hub',
              transitionKind: 'within_public',
            }}
            className="ui-inline-action"
          >
            Abrir archivo mensual
          </TrackedLink>
        </div>
      </header>

      {content.emptyReason ? (
        <section className="rounded-2xl border border-[var(--warning)]/30 bg-[var(--warning)]/12 px-4 py-3 text-sm text-[var(--foreground)] shadow-[var(--shadow-soft)]">
            <p className="font-semibold">Datos parciales</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{content.emptyReason}</p>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {content.stats.map((stat) => (
          <article key={stat.label} className="ui-section-card">
            <p className="stat-label">{stat.label}</p>
            <p className="stat-value">{stat.value}</p>
            <p className="text-xs text-[var(--muted)]">{stat.detail}</p>
          </article>
        ))}
      </section>

      <section className="ui-section-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[var(--foreground)]">
              {content.sectionTitle}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Resumen con enlaces a las paginas relacionadas.
            </p>
          </div>
        </div>

        {content.sectionItems.length > 0 ? (
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            {content.sectionItems.map((item) => {
              const body = (
                <>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--muted)]">{item.detail}</p>
                  </div>
                  {item.badge ? (
                    <Badge className="px-3 py-1 text-xs font-bold normal-case tracking-normal">
                      {item.badge}
                    </Badge>
                  ) : null}
                </>
              );

              if (!item.href) {
                return (
                  <Card
                    key={`${item.title}-${item.badge ?? 'static'}`}
                    variant="stat"
                    className="flex-row items-center justify-between gap-3 px-4 py-3"
                  >
                    {body}
                  </Card>
                );
              }

              return (
                <TrackedLink
                  key={`${item.title}-${item.href}`}
                  href={item.href}
                  navigationEvent={{
                    source: 'seo_landing_items',
                    destination: resolveSeoLandingDestination(item.href),
                    sourceRole: config.pageRole === 'HUB' ? 'hub' : 'entry_seo',
                    destinationRole: resolveSeoLandingDestinationRole(item.href),
                    transitionKind: resolveSeoLandingTransitionKind(item.href),
                  }}
                  className="group block transition hover:-translate-y-0.5"
                >
                  <Card
                    variant="stat"
                    className="flex-row items-center justify-between gap-3 px-4 py-3 transition-colors group-hover:border-[var(--primary)]/40"
                  >
                    {body}
                  </Card>
                </TrackedLink>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Esta pagina se completara automaticamente cuando haya cobertura suficiente.
          </p>
        )}
      </section>

      <section className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Rutas relacionadas</h2>
        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {relatedPages.map((page) => (
            <TrackedLink
              key={page.slug}
              href={appRoutes.seoPage(page.slug)}
              navigationEvent={{
                source: 'seo_landing_related',
                destination: page.slug,
                sourceRole: config.pageRole === 'HUB' ? 'hub' : 'entry_seo',
                destinationRole: page.pageRole === 'HUB' ? 'hub' : 'entry_seo',
                transitionKind: 'within_public',
              }}
              className="group block transition hover:-translate-y-0.5"
            >
              <Card variant="stat" className="px-4 py-4 transition-colors group-hover:border-[var(--primary)]/40">
                <p className="text-sm font-semibold text-[var(--foreground)]">{page.title}</p>
                <p className="mt-1 text-[11px] text-[var(--muted)]">{page.description}</p>
              </Card>
            </TrackedLink>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
