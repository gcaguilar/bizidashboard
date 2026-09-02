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

export const Route = createFileRoute('/metodologia')({
  head: () =>
    buildSeoHead({
      title: 'Metodología y calidad de datos de Bizi Zaragoza',
      description: 'Descubre de dónde salen los datos de Bizi Zaragoza, cómo se actualizan, qué significan sus métricas y qué límites tienen las estimaciones.',
      path: appRoutes.methodology(),
    }),
  loader: () => getMethodologyPageData(),
  component: MethodologyPage,
});

export default function MethodologyPage() {
  const { historyMeta, dataset, status, latestMonth, breadcrumbs, faqItems, structuredData } = Route.useLoaderData();
  const cityName = getCityName();

  return (
    <PageShell>
      <PublicPageViewTracker pageType="methodology" template="methodology_hub" pageSlug="metodologia" />

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="ui-page-hero">
        <SiteBreadcrumbs items={breadcrumbs} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Como leer los datos
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              Metodologia y calidad de datos de Bizi en {cityName}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Aqui explicamos de donde salen los datos, cada cuanto se actualizan, que metricas son
              estimaciones y que limites conviene tener presentes antes de sacar conclusiones.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="ui-chip">{historyMeta.coverage.totalDays} dias de cobertura</span>
            <span className="ui-chip">{historyMeta.coverage.totalStations} estaciones con histórico</span>
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
              Ver API y descargas
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
              Ver estado del sistema
            </TrackedLink>
          </div>

          <PublicSearchForm eventSource="methodology" />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="ui-section-card">
          <p className="stat-label">Fuente primaria</p>
          <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">
            {historyMeta.source.provider}
          </p>
          <p className="text-xs text-[var(--muted)]">Fuente oficial de Bizi, consultada y revisada periódicamente.</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Cobertura visible</p>
          <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">
            {getCoverageLabel(dataset)}
          </p>
          <p className="text-xs text-[var(--muted)]">La misma base que usamos en informes, listas y fichas públicas.</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Cadencia observada</p>
          <p className="stat-value">{getObservedCadenceLabel(status)}</p>
          <p className="text-xs text-[var(--muted)]">Ritmo observado en las recogidas recientes.</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Versiones activas</p>
          <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">
            {getDatasetVersionLabel(dataset)} · API v{getApiVersionLabel()}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {latestMonth ? `Ultimo informe publicado: ${formatMonthLabel(latestMonth)}.` : 'Sin informe mensual publicado.'}
          </p>
        </article>
      </section>

      <section className="ui-section-card">
        <div className="max-w-5xl space-y-3 text-sm leading-7 text-[var(--muted)] md:text-base">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Cómo se construyen las vistas públicas
            </p>
            <h2 className="text-xl font-black leading-tight text-[var(--foreground)]">
              Del dato original a páginas fáciles de comparar
            </h2>
          </div>
          <p>
            El dato base llega desde el feed oficial GBFS de Bizi {cityName}. A partir de ese origen se
            capturan muestras de estaciones, se validan, se agregan y se reutilizan en varias vistas:
            disponibilidad actual, histórico resumido, listas, páginas por barrio, informes mensuales
            y la API.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="ui-section-card">
          <p className="stat-label">Estado actual</p>
          <h2 className="mt-2 text-lg font-black text-[var(--foreground)]">Lo que ves ahora mismo</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Bicis disponibles, huecos libres y capacidad describen el estado reciente de una estación,
            no una media histórica.
          </p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Histórico resumido</p>
          <h2 className="mt-2 text-lg font-black text-[var(--foreground)]">Lo que suele pasar</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Rotación, horas con problemas, perfiles horarios y comparativas por barrio usan series acumuladas,
            no una sola foto puntual.
          </p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Actividad y movilidad</p>
          <h2 className="mt-2 text-lg font-black text-[var(--foreground)]">Lecturas estimadas</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            La demanda publicada es un índice de actividad y la movilidad es una estimación agregada por
            zonas; ninguna de las dos equivale a viajes oficiales uno a uno.
          </p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Predicción</p>
          <h2 className="mt-2 text-lg font-black text-[var(--foreground)]">Orientación, no garantía</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Las predicciones combinan patrones históricos y estado reciente para anticipar tensiones a
            corto plazo, pero no sustituyen la lectura real final.
          </p>
        </article>
      </section>

      <section className="ui-section-card">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            FAQs visibles
          </p>
          <h2 className="text-xl font-black text-[var(--foreground)]">Preguntas que mas cambian la interpretacion</h2>
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
