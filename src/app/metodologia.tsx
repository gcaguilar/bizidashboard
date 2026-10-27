import { createFileRoute } from '@tanstack/react-router';
import { buildSeoHead } from '@/lib/seo-head'
import { PublicPageViewTracker } from '@/app/_components/PublicPageViewTracker';
import { PublicSearchForm } from '@/app/_components/PublicSearchForm';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { formatMonthLabel } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { getCityName } from '@/lib/site';
import { PageShell } from '@/components/layout/page-shell';
import {
  getApiVersionLabel,
  getCoverageLabel,
  getDatasetVersionLabel,
  getHealthLabel,
  getHealthToneClasses,
  getObservedCadenceLabel,
} from '@/lib/system-status';
import { getMethodologyPageData } from '@/server-functions/metodologia';
import { toJsonLdScript } from '@/lib/structured-data';
import { translate } from '@/lib/i18n/messages';
import { useT } from '@/lib/i18n/use-locale';
import { localizeStructuredData } from '@/lib/i18n/seo';

export const Route = createFileRoute('/metodologia')({
  head: ({ match }) =>
    buildSeoHead({
      title: translate(match.context.locale, 'methodology.seo.title'),
      description: translate(match.context.locale, 'methodology.seo.description'),
      path: appRoutes.methodology(),
      locale: match.context.locale,
    }),
  loader: () => getMethodologyPageData(),
  component: MethodologyPage,
});

function MethodologyPage() {
  const { historyMeta, dataset, status, latestMonth, breadcrumbs, faqItems, structuredData } = Route.useLoaderData();
  const cityName = getCityName();
  const { locale, t } = useT();

  return (
    <PageShell>
      <PublicPageViewTracker pageType="methodology" template="methodology_hub" pageSlug="metodologia" />

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(localizeStructuredData(structuredData, locale)) }}
      />

      <header className="ui-page-hero">
        <SiteBreadcrumbs items={breadcrumbs} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              {t('methodology.hero.eyebrow')}
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              {t('methodology.hero.title', { city: cityName })}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              {t('methodology.hero.intro')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="ui-chip">{t('methodology.chip.days', { count: historyMeta.coverage.totalDays })}</span>
            <span className="ui-chip">{t('methodology.chip.stations', { count: historyMeta.coverage.totalStations })}</span>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getHealthToneClasses(status.pipeline.healthStatus)}`}>
              {getHealthLabel(status.pipeline.healthStatus)}
            </span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-wrap gap-3">
            <TrackedLink
              href={appRoutes.developers()}
              ctaEvent={{
                source: 'methodology_hero',
                ctaId: 'api_open',
                destination: 'developers',
                entityType: 'api',
                sourceRole: 'utility',
                destinationRole: 'utility',
                transitionKind: 'within_public',
              }}
              className="ui-inline-action"
            >
              {t('methodology.cta.api')}
            </TrackedLink>
            <TrackedLink
              href={appRoutes.status()}
              navigationEvent={{
                source: 'methodology_hero',
                destination: 'status',
                sourceRole: 'utility',
                destinationRole: 'utility',
                transitionKind: 'within_public',
              }}
              className="ui-inline-action"
            >
              {t('methodology.cta.status')}
            </TrackedLink>
          </div>

          <PublicSearchForm eventSource="methodology" />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="ui-section-card">
          <p className="stat-label">{t('methodology.source.label')}</p>
          <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">
            {historyMeta.source.provider}
          </p>
          <p className="text-xs text-[var(--muted)]">{t('methodology.source.note')}</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">{t('methodology.coverage.label')}</p>
          <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">
            {getCoverageLabel(dataset)}
          </p>
          <p className="text-xs text-[var(--muted)]">{t('methodology.coverage.note')}</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">{t('methodology.cadence.label')}</p>
          <p className="stat-value">{getObservedCadenceLabel(status)}</p>
          <p className="text-xs text-[var(--muted)]">{t('methodology.cadence.note')}</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">{t('methodology.versions.label')}</p>
          <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">
            {getDatasetVersionLabel(dataset)} · API v{getApiVersionLabel()}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {latestMonth ? t('methodology.versions.latestReport', { month: formatMonthLabel(latestMonth) }) : t('methodology.versions.noReport')}
          </p>
        </article>
      </section>

      <section className="ui-section-card">
        <div className="max-w-5xl space-y-3 text-sm leading-7 text-[var(--muted)] md:text-base">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              {t('methodology.origin.eyebrow')}
            </p>
            <h2 className="text-xl font-black leading-tight text-[var(--foreground)]">
              {t('methodology.origin.title')}
            </h2>
          </div>
          <p>{t('methodology.origin.body', { city: cityName })}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="ui-section-card">
          <p className="stat-label">{t('methodology.current.eyebrow')}</p>
          <h2 className="mt-2 text-lg font-black text-[var(--foreground)]">{t('methodology.current.title')}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t('methodology.current.body')}
          </p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">{t('methodology.history.eyebrow')}</p>
          <h2 className="mt-2 text-lg font-black text-[var(--foreground)]">{t('methodology.history.title')}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t('methodology.history.body')}
          </p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">{t('methodology.activity.eyebrow')}</p>
          <h2 className="mt-2 text-lg font-black text-[var(--foreground)]">{t('methodology.activity.title')}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t('methodology.activity.body')}
          </p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">{t('methodology.prediction.eyebrow')}</p>
          <h2 className="mt-2 text-lg font-black text-[var(--foreground)]">{t('methodology.prediction.title')}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t('methodology.prediction.body')}
          </p>
        </article>
      </section>

      <section className="ui-section-card">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            {t('methodology.faq.eyebrow')}
          </p>
          <h2 className="text-xl font-black text-[var(--foreground)]">{t('methodology.faq.title')}</h2>
        </div>

        <div className="mt-2 grid gap-3 md:grid-cols-2">
          {faqItems.slice(0, 4).map((item) => (
            <article
              key={item.id}
              className="ui-surface-block"
            >
              <p className="text-sm font-semibold text-[var(--foreground)]">{item.question}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
