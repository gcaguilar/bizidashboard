import type { Metadata } from 'next';
import { PublicPageViewTracker } from '@/app/_components/PublicPageViewTracker';
import { PublicSearchForm } from '@/app/_components/PublicSearchForm';
import { PublicSectionNav } from '@/app/_components/PublicSectionNav';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { TrackedAnchor } from '@/app/_components/TrackedAnchor';
import { TrackedLink } from '@/app/_components/TrackedLink';
import {
  fetchAvailableDataMonths,
  fetchHistoryMetadata,
  fetchSharedDatasetSnapshot,
  fetchStatus,
} from '@/lib/api';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { combineDataStates } from '@/lib/data-state';
import { FAQ_ITEMS } from '@/app/dashboard/ayuda/_components/help-center-content';
import { formatMonthLabel, isValidMonthKey } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { buildPageMetadata } from '@/lib/seo';
import { buildSocialImagePath } from '@/lib/social-images';
import {
  buildFallbackAvailableMonths,
  buildFallbackDatasetSnapshot,
  buildFallbackStatus,
} from '@/lib/shared-data-fallbacks';
import { getSharedDataSource, type HistoryMetadata } from '@/services/shared-data';
import { getCityName, getSiteUrl, SITE_NAME } from '@/lib/site';
import {
  formatStatusDateTime,
  getApiVersionLabel,
  getCoverageLabel,
  getDatasetVersionLabel,
  getHealthLabel,
  getHealthToneClasses,
  getObservedCadenceLabel,
  getPipelineLagLabel,
} from '@/lib/system-status';

export const revalidate = 3600;

const FAQ_IDS = [
  'fuente-datos',
  'actualizacion',
  'demanda-no-viajes-reales',
  'prediccion-que-es',
] as const;

function buildFallbackHistoryMetadata(nowIso: string): HistoryMetadata {
  return {
    source: getSharedDataSource(),
    coverage: {
      firstRecordedAt: null,
      lastRecordedAt: null,
      totalSamples: 0,
      totalStations: 0,
      totalDays: 0,
      generatedAt: nowIso,
    },
    generatedAt: nowIso,
  };
}

function getMethodologyFaqItems() {
  return FAQ_IDS.flatMap((id) => FAQ_ITEMS.filter((item) => item.id === id));
}

export async function generateMetadata(): Promise<Metadata> {
  const nowIso = new Date().toISOString();
  const [historyMeta, dataset, status, monthsResponse] = await Promise.all([
    fetchHistoryMetadata().catch(() => buildFallbackHistoryMetadata(nowIso)),
    fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)),
    fetchStatus().catch(() => buildFallbackStatus(nowIso)),
    fetchAvailableDataMonths().catch(() => buildFallbackAvailableMonths(nowIso)),
  ]);
  const months = monthsResponse.months.filter(isValidMonthKey);

  return buildPageMetadata({
    title: 'Metodologia y calidad de datos de Bizi Zaragoza',
    description:
      'Entiende de donde salen los datos de Bizi Zaragoza, como se actualizan, que significan las metricas publicas y que limites conviene tener en cuenta al interpretar estaciones, barrios e informes.',
    path: appRoutes.methodology(),
    keywords: [
      'metodologia bizi zaragoza',
      'calidad datos bizi',
      'fuente gbfs bizi zaragoza',
      'como se calculan metricas bizi',
    ],
    socialImagePath: buildSocialImagePath({
      kind: 'api',
      title: 'Metodologia y calidad de datos de Bizi Zaragoza',
      subtitle: `${historyMeta.coverage.totalDays} dias de cobertura, API v${getApiVersionLabel()} y ${months.length} meses publicados`,
      eyebrow: 'Guia publica de confianza',
      badges: ['Metodologia', 'GBFS', 'Calidad'],
    }),
    indexability: {
      pageType: 'marketing',
      dataState: combineDataStates([dataset.dataState, status.dataState]),
      hasMeaningfulContent: true,
      hasData:
        historyMeta.coverage.totalDays > 0 ||
        dataset.coverage.totalDays > 0 ||
        Boolean(dataset.lastUpdated.lastSampleAt),
    },
  });
}

export default async function MethodologyPage() {
  const nowIso = new Date().toISOString();
  const cityName = getCityName();
  const siteUrl = getSiteUrl();
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Metodologia',
    href: appRoutes.methodology(),
  });
  const faqItems = getMethodologyFaqItems();

  const [historyMeta, dataset, status, monthsResponse] = await Promise.all([
    fetchHistoryMetadata().catch(() => buildFallbackHistoryMetadata(nowIso)),
    fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)),
    fetchStatus().catch(() => buildFallbackStatus(nowIso)),
    fetchAvailableDataMonths().catch(() => buildFallbackAvailableMonths(nowIso)),
  ]);

  const months = monthsResponse.months.filter(isValidMonthKey);
  const latestMonth = months[0] ?? null;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbStructuredData(breadcrumbs),
      {
        '@type': 'TechArticle',
        headline: `Metodologia y calidad de datos de Bizi ${cityName}`,
        name: `Metodologia y calidad de datos de Bizi ${cityName}`,
        description:
          'Guia publica para interpretar la fuente, la cobertura, la frecuencia y las metricas de las paginas publicas de DatosBizi.',
        url: `${siteUrl}${appRoutes.methodology()}`,
        inLanguage: 'es',
        dateModified: dataset.coverage.generatedAt ?? historyMeta.generatedAt ?? nowIso,
        author: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: siteUrl,
        },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: siteUrl,
        },
      },
      {
        '@type': 'Dataset',
        name: `Dataset Bizi ${cityName}`,
        description:
          'Cobertura historica, snapshot actual y criterios de interpretacion del dataset usado por estaciones, barrios, informes y API.',
        url: `${siteUrl}${appRoutes.methodology()}`,
        inLanguage: 'es',
        isAccessibleForFree: true,
        dateModified: dataset.coverage.generatedAt,
        distribution: [
          {
            '@type': 'DataDownload',
            name: 'OpenAPI JSON',
            encodingFormat: 'application/json',
            contentUrl: `${siteUrl}${appRoutes.api.openApi()}`,
          },
          {
            '@type': 'DataDownload',
            name: 'Historico CSV',
            encodingFormat: 'text/csv',
            contentUrl: `${siteUrl}${appRoutes.api.historyCsv()}`,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
      <PublicPageViewTracker pageType="methodology" template="methodology_hub" pageSlug="metodologia" />

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="hero-card">
        <SiteBreadcrumbs items={breadcrumbs} />
        <PublicSectionNav activeItemId="help" className="mt-1" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Guia publica de confianza
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              Metodologia y calidad de datos de Bizi {cityName}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Esta pagina explica como se construyen las lecturas publicas de DatosBizi: de donde sale
              el dato base, con que frescura se actualiza, que metricas son estimadas y que limites
              conviene tener presentes antes de interpretar estaciones, barrios, rankings e informes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="kpi-chip">{historyMeta.coverage.totalDays} dias de cobertura</span>
            <span className="kpi-chip">{historyMeta.coverage.totalStations} estaciones con historico</span>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getHealthToneClasses(status.pipeline.healthStatus)}`}>
              {getHealthLabel(status.pipeline.healthStatus)}
            </span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-wrap gap-3">
            <TrackedAnchor
              href={historyMeta.source.gbfsDiscoveryUrl}
              target="_blank"
              rel="noopener noreferrer"
              ctaEvent={{
                source: 'methodology_hero',
                ctaId: 'dataset_source_open',
                destination: 'gbfs_discovery',
                isExternal: true,
                sourceRole: 'utility',
                destinationRole: 'utility',
                transitionKind: 'within_public',
              }}
              className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
            >
              Ver feed GBFS oficial
            </TrackedAnchor>
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
              className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
            >
              Abrir API y datos abiertos
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
              className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
            >
              Ver estado del sistema
            </TrackedLink>
          </div>

          <PublicSearchForm eventSource="methodology" />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="dashboard-card">
          <p className="stat-label">Fuente primaria</p>
          <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">
            {historyMeta.source.provider}
          </p>
          <p className="text-xs text-[var(--muted)]">Discovery GBFS consultado y validado de forma periodica.</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Cobertura visible</p>
          <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">
            {getCoverageLabel(dataset)}
          </p>
          <p className="text-xs text-[var(--muted)]">Base compartida por informes, rankings y fichas publicas.</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Cadencia observada</p>
          <p className="stat-value">{getObservedCadenceLabel(status)}</p>
          <p className="text-xs text-[var(--muted)]">Lectura reciente del pipeline y de la frescura del sistema.</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Versiones activas</p>
          <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">
            {getDatasetVersionLabel(dataset)} · API v{getApiVersionLabel()}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {latestMonth ? `Ultimo informe publicado: ${formatMonthLabel(latestMonth)}.` : 'Sin informe mensual publicado.'}
          </p>
        </article>
      </section>

      <section className="dashboard-card">
        <div className="max-w-5xl space-y-3 text-sm leading-7 text-[var(--muted)] md:text-base">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Como se construye la capa publica
            </p>
            <h2 className="text-xl font-black leading-tight text-[var(--foreground)]">
              Del feed oficial a paginas utiles y comparables
            </h2>
          </div>
          <p>
            El dato base llega desde el feed oficial GBFS de Bizi {cityName}. A partir de ese origen se
            capturan snapshots de estaciones, se validan, se agregan y se reutilizan en varias capas:
            disponibilidad actual, historico agregado, rankings, hubs territoriales, informes mensuales
            y endpoints API.
          </p>
          <p>
            La ultima muestra util hoy es {formatStatusDateTime(dataset.lastUpdated.lastSampleAt)} y el
            lag visible del pipeline es {getPipelineLagLabel(status)}. Cuando falta cobertura o la serie
            es parcial, la policy SEO desindexa las plantillas debiles en lugar de forzar contenido
            pobre. Ese criterio se aplica igual a estaciones, barrios, informes y landings.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="dashboard-card">
          <p className="stat-label">Snapshot actual</p>
          <h2 className="mt-2 text-lg font-black text-[var(--foreground)]">Lo que ves ahora mismo</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Bicis disponibles, anclajes libres y capacidad describen el estado reciente de una estacion,
            no una media historica.
          </p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Historico agregado</p>
          <h2 className="mt-2 text-lg font-black text-[var(--foreground)]">Lo que suele pasar</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Rotacion, horas problema, perfiles horarios y comparativas por barrio usan series acumuladas,
            no una sola foto puntual.
          </p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Demanda y movilidad</p>
          <h2 className="mt-2 text-lg font-black text-[var(--foreground)]">Lecturas estimadas</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            La demanda publica es un indice de actividad y la movilidad es una estimacion agregada por
            zonas; ninguna de las dos equivale a viajes oficiales uno a uno.
          </p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Prediccion</p>
          <h2 className="mt-2 text-lg font-black text-[var(--foreground)]">Orientacion, no garantia</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Las predicciones combinan patrones historicos y estado reciente para anticipar tensiones a
            corto plazo, pero no sustituyen la lectura real final.
          </p>
        </article>
      </section>

      <section className="dashboard-card">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            FAQs visibles
          </p>
          <h2 className="text-xl font-black text-[var(--foreground)]">Preguntas que mas cambian la interpretacion</h2>
        </div>

        <div className="mt-2 grid gap-3 md:grid-cols-2">
          {faqItems.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3"
            >
              <p className="text-sm font-semibold text-[var(--foreground)]">{item.question}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-card">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Siguiente paso segun tu necesidad
          </p>
          <h2 className="text-xl font-black text-[var(--foreground)]">Rutas relacionadas</h2>
        </div>

        <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <TrackedLink
            href={appRoutes.developers()}
            ctaEvent={{
              source: 'methodology_related',
              ctaId: 'api_open',
              destination: 'developers',
              entityType: 'api',
              sourceRole: 'utility',
              destinationRole: 'utility',
              transitionKind: 'within_public',
            }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">API y datos abiertos</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              OpenAPI, CSV, versiones y trazabilidad del mismo dataset explicado aqui.
            </p>
          </TrackedLink>
          <TrackedLink
            href={appRoutes.status()}
            navigationEvent={{
              source: 'methodology_related',
              destination: 'status',
              sourceRole: 'utility',
              destinationRole: 'utility',
              transitionKind: 'within_public',
            }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Estado y cobertura</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Comprueba frescura, incidencias, lag del pipeline y salud operativa antes de interpretar.
            </p>
          </TrackedLink>
          <TrackedLink
            href={appRoutes.reports()}
            ctaEvent={{
              source: 'methodology_related',
              ctaId: 'report_open',
              destination: 'report_archive',
              entityType: 'report',
              sourceRole: 'utility',
              destinationRole: 'hub',
              transitionKind: 'within_public',
            }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Archivo mensual</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Usa el contexto metodologico para leer mejor los informes y sus insights por mes.
            </p>
          </TrackedLink>
          <TrackedLink
            href={appRoutes.seoPage('uso-bizi-por-estacion')}
            navigationEvent={{
              source: 'methodology_related',
              destination: 'station_hub',
              sourceRole: 'utility',
              destinationRole: 'hub',
              transitionKind: 'within_public',
            }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Fichas de estacion</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Baja al detalle publico de disponibilidad, horas activas y comparacion con la ciudad.
            </p>
          </TrackedLink>
          <TrackedLink
            href={appRoutes.districtLanding()}
            navigationEvent={{
              source: 'methodology_related',
              destination: 'district_hub',
              sourceRole: 'utility',
              destinationRole: 'hub',
              transitionKind: 'within_public',
            }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Barrios y contexto territorial</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Interpreta comparativas por barrio sabiendo que metricas son snapshot y cuales son agregadas.
            </p>
          </TrackedLink>
          <TrackedLink
            href={appRoutes.dashboardHelp()}
            navigationEvent={{
              source: 'methodology_related',
              destination: 'dashboard_help',
              sourceRole: 'utility',
              destinationRole: 'dashboard',
              transitionKind: 'to_dashboard',
            }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Ayuda completa del dashboard</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Si necesitas mas detalle operativo o FAQ extensa, entra en la ayuda interna del producto.
            </p>
          </TrackedLink>
        </div>
      </section>
    </main>
  );
}
