'use client';

import { useMemo, useState } from 'react';
import { FeedbackCta } from '@/app/_components/FeedbackCta';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { TrackedAnchor } from '@/app/_components/TrackedAnchor';
import { TrackedLink } from '@/app/_components/TrackedLink';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { appRoutes } from '@/lib/routes';
import type { HistoryMetadata } from '@/services/shared-data/types';
import {
  buildCtaClickEvent,
  buildExportClickEvent,
  buildPanelOpenEvent,
  trackUmamiEvent,
} from '@/lib/umami';
import { DashboardPageViewTracker } from '../../_components/DashboardPageViewTracker';
import { DashboardRouteLinks } from '../../_components/DashboardRouteLinks';
import { GitHubRepoButton } from '../../_components/GitHubRepoButton';
import { ThemeToggleButton } from '../../_components/ThemeToggleButton';
import { FAQ_ITEMS } from './help-center-content';
import {
  buildHelpCenterFaqStructuredData,
  filterHelpCenterFaqItems,
  formatDateTime,
  getHelpCenterCategories,
  getHelpCenterCategoryCounts,
  getHelpCenterCategoryMatchesBySearch,
  groupHelpCenterFaqItems,
  normalizeText,
} from './help-center-selectors';

const HELP_CENTER_FAQ_STRUCTURED_DATA = buildHelpCenterFaqStructuredData();
const HELP_CENTER_CATEGORIES = getHelpCenterCategories();
const HELP_CENTER_CATEGORY_COUNTS = getHelpCenterCategoryCounts();

type HelpCenterClientProps = {
  historyMeta: HistoryMetadata;
};

export function HelpCenterClient({ historyMeta }: HelpCenterClientProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openItemId, setOpenItemId] = useState<string>(FAQ_ITEMS[0]?.id ?? '');
  const breadcrumbs = [
    { label: 'Inicio', href: appRoutes.home() },
    { label: 'Dashboard', href: appRoutes.dashboard() },
    { label: 'Ayuda', href: appRoutes.dashboardHelp() },
  ];

  const normalizedQuery = useMemo(() => normalizeText(query), [query]);

  const filteredItems = useMemo(() => {
    return filterHelpCenterFaqItems({
      query,
      activeCategory,
    });
  }, [activeCategory, query]);

  const categories = HELP_CENTER_CATEGORIES;

  const groupedItems = useMemo(() => {
    return groupHelpCenterFaqItems(filteredItems);
  }, [filteredItems]);

  const categoryCounts = HELP_CENTER_CATEGORY_COUNTS;

  const categoryMatchesBySearch = useMemo(() => {
    return getHelpCenterCategoryMatchesBySearch({
      categories,
      query,
    });
  }, [categories, query]);

  const faqStructuredData = HELP_CENTER_FAQ_STRUCTURED_DATA;

  const showFilteredCount = normalizedQuery.length > 0 || activeCategory !== null;

  const resolvedOpenItemId =
    filteredItems.length === 0
      ? ''
      : filteredItems.some((item) => item.id === openItemId)
        ? openItemId
        : (filteredItems[0]?.id ?? '');

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <DashboardPageViewTracker routeKey="dashboard_help" pageType="dashboard" template="help_center" />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/95 px-6 py-4 backdrop-blur-md md:px-10">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 text-[var(--accent)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
                B
              </div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">Bizi Zaragoza</h2>
            </div>
            <DashboardRouteLinks
              activeRoute="help"
              routes={['dashboard', 'stations', 'flow', 'conclusions', 'help']}
              variant="inline"
              className="hidden items-center gap-6 md:flex"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <label htmlFor="help-search-desktop" className="hidden items-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 sm:flex">
              <span className="sr-only">Buscar ayuda o preguntas frecuentes</span>
              <Input
                id="help-search-desktop"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-auto min-h-0 w-44 border-0 bg-transparent px-0 py-0 text-sm text-[var(--foreground)] shadow-none outline-none placeholder:text-[var(--muted)] focus:border-0"
                placeholder="Buscar ayuda..."
              />
            </label>
            <DashboardRouteLinks
              activeRoute="help"
              routes={['dashboard', 'stations', 'flow', 'conclusions', 'help']}
              variant="chips"
              className="flex flex-wrap items-center gap-2 md:hidden"
            />
            <TrackedLink
              href={appRoutes.api.history()}
              trackingEvent={buildExportClickEvent({
                surface: 'dashboard',
                routeKey: 'dashboard_help',
                source: 'help_header',
                ctaId: 'history_json',
                entityType: 'api',
                module: 'help_header',
              })}
              className="icon-button"
            >
              Historico
            </TrackedLink>
            <ThemeToggleButton />
            <GitHubRepoButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <SiteBreadcrumbs items={breadcrumbs} className="mb-6" />

        <label htmlFor="help-search-mobile" className="mb-6 flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm sm:hidden">
          <span className="sr-only">Buscar ayuda o preguntas frecuentes</span>
          <Input
            id="help-search-mobile"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-auto min-h-0 w-full border-0 bg-transparent px-0 py-0 text-sm text-[var(--foreground)] shadow-none outline-none placeholder:text-[var(--muted)] focus:border-0"
            placeholder="Buscar ayuda..."
          />
        </label>

        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
              Centro de ayuda
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-[var(--foreground)] md:text-5xl">
              Preguntas frecuentes
            </h1>
            <p className="mt-4 text-lg text-[var(--muted)]">
              Explora nuestra metodologia y resuelve dudas sobre como procesamos los datos de Bizi Zaragoza en tiempo real.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--muted)]">
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1">
                {filteredItems.length} preguntas visibles
              </span>
              {activeCategory ? (
                <Button
                  variant="ghost"
                  onClick={() => setActiveCategory(null)}
                  className="h-auto min-h-0 rounded-full border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1 text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
                >
                  Categoria: {activeCategory} ×
                </Button>
              ) : null}
              {normalizedQuery ? (
                <Button
                  variant="ghost"
                  onClick={() => setQuery('')}
                  className="h-auto min-h-0 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Buscar: {query} ×
                </Button>
              ) : null}
            </div>
          </div>

          <aside className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Cobertura de datos
            </p>
            <p className="mt-1 text-sm text-[var(--foreground)]">
              Datos desde: <span className="font-semibold">{formatDateTime(historyMeta?.coverage?.firstRecordedAt)}</span>
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Ultima muestra: {formatDateTime(historyMeta?.coverage?.lastRecordedAt)}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Dias disponibles: {historyMeta?.coverage?.totalDays ?? 0} · Estaciones activas:{' '}
              {historyMeta?.coverage?.totalStations ?? 0}
            </p>
            <p className="mt-3 text-xs text-[var(--muted)]">
              Fuente: {historyMeta?.source?.provider ?? 'Bizi Zaragoza GBFS'}
            </p>
            <TrackedAnchor
              href={historyMeta?.source?.gbfsDiscoveryUrl ?? 'https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json'}
              target="_blank"
              rel="noreferrer"
              trackingEvent={buildCtaClickEvent({
                surface: 'dashboard',
                routeKey: 'dashboard_help',
                source: 'help_coverage',
                ctaId: 'source_feed_open',
                destination: 'gbfs_feed',
                isExternal: true,
              })}
              className="mt-1 inline-flex text-xs font-semibold text-[var(--accent)] underline decoration-[var(--accent)]/40 underline-offset-2"
            >
              Ver feed de origen
            </TrackedAnchor>

            <div className="mt-4 flex flex-wrap gap-2">
              <TrackedLink
                href={appRoutes.api.history()}
                trackingEvent={buildExportClickEvent({
                  surface: 'dashboard',
                  routeKey: 'dashboard_help',
                  source: 'help_coverage',
                  ctaId: 'history_json',
                  entityType: 'api',
                  module: 'help_coverage',
                })}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white"
              >
                Ver historico completo
              </TrackedLink>
              <TrackedLink
                href={appRoutes.api.openApi()}
                trackingEvent={buildCtaClickEvent({
                  surface: 'dashboard',
                  routeKey: 'dashboard_help',
                  source: 'help_coverage',
                  ctaId: 'api_open',
                  destination: 'openapi',
                  entityType: 'api',
                })}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-xs font-bold text-[var(--foreground)]"
              >
                Definicion API
              </TrackedLink>
            </div>
          </aside>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const isCategoryFilterActive = activeCategory === category;
            const categoryMatches = categoryMatchesBySearch.get(category) ?? 0;
            const totalInCategory = categoryCounts.get(category) ?? 0;

            return (
              <Button
                key={category}
                variant="ghost"
                onClick={() => {
                  const nextCategory = activeCategory === category ? null : category;
                  trackUmamiEvent(
                    buildPanelOpenEvent({
                      surface: 'dashboard',
                      routeKey: 'dashboard_help',
                      module: nextCategory ? 'faq_category' : 'faq_category_reset',
                      source: category,
                    })
                  );
                  setActiveCategory(nextCategory);
                }}
                aria-pressed={isCategoryFilterActive}
                className={`h-auto min-h-0 w-full flex-col items-start justify-start rounded-xl border bg-[var(--surface)] p-6 text-left transition hover:border-[var(--accent)] ${
                  isCategoryFilterActive
                    ? 'border-[var(--accent)] bg-[var(--accent)]/6 shadow-[0_0_0_1px_var(--accent-soft)]'
                    : 'border-[var(--border)]'
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-xl font-black text-[var(--accent)]">
                    {category.slice(0, 1)}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    isCategoryFilterActive
                      ? 'bg-[var(--accent)] text-white'
                      : 'border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)]'
                  }`}>
                    {categoryMatches}/{totalInCategory}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[var(--foreground)]">{category}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {showFilteredCount
                    ? `${categoryMatches} de ${totalInCategory} preguntas coinciden.`
                    : `${totalInCategory} preguntas disponibles.`}
                </p>
              </Button>
            );
          })}
        </div>

        <div className="mt-14 space-y-8">
          {groupedItems.length === 0 ? (
            <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
              No hay coincidencias para la busqueda actual.
            </p>
          ) : (
            groupedItems.map(([category, items]) => (
              <section key={category} className="space-y-4">
                <h2 className="flex items-center gap-3 text-2xl font-bold text-[var(--foreground)]">
                  <span className="h-1 w-8 rounded-full bg-[var(--accent)]" />
                  {category}
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--muted)]">
                    {items.length}
                  </span>
                </h2>

                <div className="space-y-3">
                  {items.map((item) => {
                    return (
                      <Accordion
                        key={item.id}
                        type="single"
                        value={resolvedOpenItemId}
                        onValueChange={(value) => setOpenItemId(value)}
                      >
                        <AccordionItem value={item.id} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                          <AccordionTrigger className="h-auto min-h-0 px-5 py-4">
                            <p className="text-base font-semibold text-[var(--foreground)]">{item.question}</p>
                          </AccordionTrigger>
                          <AccordionContent className="px-5 py-4 text-sm leading-relaxed text-[var(--muted)]">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="relative mt-16 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/70 p-8 text-white">
          <div className="max-w-md">
            <h2 className="text-2xl font-bold">No encontraste lo que buscabas?</h2>
            <p className="mt-2 text-sm text-white/85">
              Si necesitas soporte directo o quieres compartir feedback, usa el acceso dedicado y
              deja contexto sobre la vista, la estacion o el problema detectado.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <FeedbackCta
              source="help_support_block"
              ctaId="feedback_help_open"
              module="help_support_block"
              className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-[var(--accent)] transition hover:bg-white/90"
              pendingClassName="rounded-lg border border-white/30 bg-black/20 px-6 py-3 text-sm font-bold text-white/80"
              pendingLabel="Feedback pronto"
            >
              Enviar feedback
            </FeedbackCta>
            <a
              href="https://www.linkedin.com/in/guillermocastella/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/30 bg-black/20 px-6 py-3 text-sm font-bold text-white"
            >
              Contacto
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
