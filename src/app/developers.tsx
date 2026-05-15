import { Link, createFileRoute } from '@tanstack/react-router';
import { DataStateNotice } from '@/app/_components/DataStateNotice';
import { PublicPageViewTracker } from '@/app/_components/PublicPageViewTracker';
import { PublicSearchForm } from '@/app/_components/PublicSearchForm';
import { PublicSectionNav } from '@/app/_components/PublicSectionNav';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { TrackedLink } from '@/app/_components/TrackedLink';
import { buildBreadcrumbStructuredData } from '@/lib/breadcrumbs';
import { shouldShowDataStateNotice } from '@/lib/data-state';
import { formatMonthLabel } from '@/lib/months';
import { openApiDocument } from '@/lib/openapi-document';
import { appRoutes } from '@/lib/routes';
import { buildItemListStructuredData } from '@/lib/structured-data';
import { getSiteUrl, SITE_NAME } from '@/lib/site';
import { PageShell } from '@/components/layout/page-shell';
import { Card } from '@/components/ui/card';
import {
  formatStatusDateTime,
} from '@/lib/system-status';
import { getDevelopersPageData } from '@/server-functions/developers';



const OPENAPI_DESTINATION = 'openapi';

function buildDeveloperEndpointAnchorId(
  path: string,
  method: string
): string {
  const normalized = `${method}-${path}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');

  return `endpoint-${normalized}`;
}

function buildOpenApiCtaEvent(source: 'developers_hero' | 'developers_endpoints') {
  return {
    source,
    ctaId: 'api_open',
    destination: OPENAPI_DESTINATION,
    entityType: 'api',
    sourceRole: 'utility',
    destinationRole: 'utility',
    transitionKind: 'within_public',
  } as const;
}

export const Route = createFileRoute('/developers')({
  head: () => {
    const siteUrl = getSiteUrl()
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
            content:
            'API publica y datos abiertos de Bizi Zaragoza, con OpenAPI, ejemplos, descargas CSV y notas para entender de donde sale cada dato.',
        },
        { property: 'og:title', content: 'API y datos abiertos de Bizi Zaragoza' },
        { property: 'og:description', content: 'API publica y datos abiertos de Bizi Zaragoza, con OpenAPI, ejemplos, descargas CSV y notas para entender de donde sale cada dato.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${siteUrl}/developers` },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'API y datos abiertos de Bizi Zaragoza' },
        { name: 'twitter:description', content: 'API publica y datos abiertos de Bizi Zaragoza, con OpenAPI, ejemplos, descargas CSV y notas para entender de donde sale cada dato.' },
      ],
      links: [{ rel: 'canonical', href: `${siteUrl}/developers` }],
      title: 'API y datos abiertos de Bizi Zaragoza',
    }
  },
  loader: () => getDevelopersPageData(),
  component: DevelopersPage,
});



export default function DevelopersPage() {
  const { siteUrl, cityName, breadcrumbs, latestMonth, endpointDocs, datasetVersion, apiVersion, codeLicense, developersDataState, datasetTemporalCoverage, curlExamples, pythonExample, jsExample, csvDownloads, accessPolicies, useCases, changelog, datasetDownloadEntries, dataset } = Route.useLoaderData();

  return (
    <PageShell>
      <PublicPageViewTracker pageType="developers" template="developers_hub" pageSlug="developers" />

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              buildBreadcrumbStructuredData(breadcrumbs),
              {
                '@type': 'TechArticle',
                name: `Developers y API ${cityName}`,
                description:
                  'Punto de entrada para consultar la API, descargar datos y entender versiones, ejemplos y limites.',
                url: `${siteUrl}${appRoutes.developers()}`,
              },
              {
                '@type': 'Dataset',
                name: `Dataset Bizi ${cityName}`,
                description:
                  'Datos actuales, historico agregado y descargas CSV que alimentan el dashboard, los informes y los rankings.',
                url: `${siteUrl}${appRoutes.developers()}`,
                inLanguage: 'es',
                isAccessibleForFree: true,
                dateModified: dataset.coverage.generatedAt,
                ...(datasetTemporalCoverage ? { temporalCoverage: datasetTemporalCoverage } : {}),
                publisher: {
                  '@type': 'Organization',
                  name: SITE_NAME,
                  url: siteUrl,
                },
                distribution: csvDownloads.map((item) => ({
                  '@type': 'DataDownload',
                  name: item.label,
                  description: item.detail,
                  encodingFormat: 'text/csv',
                  contentUrl: `${siteUrl}${item.href}`,
                })),
              },
              buildItemListStructuredData('Descargas CSV y dataset', datasetDownloadEntries),
            ],
          }),
        }}
      />

      <header className="ui-page-hero">
        <SiteBreadcrumbs items={breadcrumbs} />
        <PublicSectionNav activeItemId="api" className="mt-1" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              API y datos abiertos
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              API y datos abiertos de {cityName}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Todo lo necesario para reutilizar DatosBizi: documentacion, OpenAPI, ejemplos,
              endpoints, descargas CSV, versiones de datos, cambios recientes, licencia y
              pautas para citar los datos.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="ui-chip">OpenAPI {openApiDocument.openapi}</span>
            <span className="ui-chip">API v{apiVersion}</span>
            <span className="ui-chip">Datos {datasetVersion}</span>
            <span className="ui-chip">{endpointDocs.length} endpoints publicados</span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-wrap gap-3">
            <TrackedLink
              href={appRoutes.api.openApi()}
              ctaEvent={buildOpenApiCtaEvent('developers_hero')}
              className="inline-flex rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
            >
              Descargar especificacion OpenAPI
            </TrackedLink>
            <TrackedLink
              href={appRoutes.llms()}
              navigationEvent={{
                source: 'developers_hero',
                destination: 'llms',
                sourceRole: 'utility',
                destinationRole: 'utility',
                transitionKind: 'within_public',
              }}
              className="ui-inline-action"
            >
              Abrir llms.txt
            </TrackedLink>
            <TrackedLink
              href={appRoutes.llmsFull()}
              navigationEvent={{
                source: 'developers_hero',
                destination: 'llms_full',
                sourceRole: 'utility',
                destinationRole: 'utility',
                transitionKind: 'within_public',
              }}
              className="ui-inline-action"
            >
              Abrir llms-full.txt
            </TrackedLink>
            <TrackedLink
              href={appRoutes.status()}
              navigationEvent={{
                source: 'developers_hero',
                destination: 'status',
                sourceRole: 'utility',
                destinationRole: 'utility',
                transitionKind: 'within_public',
              }}
              className="ui-inline-action"
            >
              Revisar estado de los datos
            </TrackedLink>
            <TrackedLink
              href={appRoutes.methodology()}
              navigationEvent={{
                source: 'developers_hero',
                destination: 'methodology',
                sourceRole: 'utility',
                destinationRole: 'utility',
                transitionKind: 'within_public',
              }}
              className="ui-inline-action"
            >
              Entender la metodologia
            </TrackedLink>
          </div>
          <PublicSearchForm eventSource="developers" />
        </div>
      </header>

      {shouldShowDataStateNotice(developersDataState) ? (
        <DataStateNotice
          state={developersDataState}
          subject="la API publica"
          description="La documentacion sigue disponible, pero los datos actuales, el historico y las exportaciones dependen del mismo estado que usa el dashboard."
          href={appRoutes.status()}
          actionLabel="Revisar estado"
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <article className="ui-section-card">
          <p className="stat-label">Version API</p>
          <p className="stat-value">{apiVersion}</p>
          <p className="text-xs text-[var(--muted)]">Version publicada en la especificacion OpenAPI.</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Version de datos</p>
          <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">{datasetVersion}</p>
          <p className="text-xs text-[var(--muted)]">Calculada a partir de la ultima muestra util y del historico agregado.</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Cobertura historica</p>
          <p className="stat-value">{dataset.coverage.totalDays}</p>
          <p className="text-xs text-[var(--muted)]">{dataset.stats.totalSamples} muestras y {dataset.stats.totalStations} estaciones.</p>
        </article>
        <article className="ui-section-card">
          <p className="stat-label">Ultima generacion</p>
          <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">
            {formatStatusDateTime(dataset.coverage.generatedAt)}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {latestMonth ? `Ultimo mes publicado ${formatMonthLabel(latestMonth)}.` : 'Sin archivo mensual publicado.'}
          </p>
        </article>
      </section>

      <section className="ui-section-card">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Quick start
          </p>
          <h2 className="text-xl font-black text-[var(--foreground)]">Ejemplos de consumo</h2>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card variant="stat" className="p-4">
            <p className="stat-label">curl</p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[var(--foreground)]">
              <code>{curlExamples.join('\n\n')}</code>
            </pre>
          </Card>
          <Card variant="stat" className="p-4">
            <p className="stat-label">Python</p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[var(--foreground)]">
              <code>{pythonExample}</code>
            </pre>
          </Card>
          <Card variant="stat" className="p-4">
            <p className="stat-label">JavaScript</p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[var(--foreground)]">
              <code>{jsExample}</code>
            </pre>
          </Card>
        </div>
      </section>

      <section className="ui-section-card" id="rebalancing-api">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Logistica y redistribucion
          </p>
          <h2 className="text-xl font-black text-[var(--foreground)]">API de reequilibrio</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            El endpoint <code>/api/rebalancing-report</code> devuelve recomendaciones origen-destino,
            clasificacion A-F y metricas estimadas para priorizar movimientos.
          </p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card variant="stat" className="p-4">
            <p className="stat-label">Ejemplo (curl)</p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[var(--foreground)]">
              <code>{`curl -sG ${siteUrl}${appRoutes.api.rebalancingReport({ district: 'Centro', days: 15 })}`}</code>
            </pre>
          </Card>
          <Card variant="stat" className="p-4">
            <p className="stat-label">Ejemplo (Python)</p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[var(--foreground)]">
              <code>{`import requests

base_url = "${siteUrl}"
params = {"days": 15, "format": "json"}
res = requests.get(f"{base_url}${appRoutes.api.rebalancingReport()}", params=params, timeout=20)
res.raise_for_status()
print(len(res.json()["transfers"]))`}</code>
            </pre>
          </Card>
        </div>
      </section>

      <section className="ui-section-card">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Acceso y seguridad
          </p>
          <h2 className="text-xl font-black text-[var(--foreground)]">Reglas de acceso actuales</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {accessPolicies.map((policy) => (
            <Card
              key={policy.label}
              variant="stat"
              className="rounded-2xl px-4 py-4"
            >
              <p className="stat-label">{policy.label}</p>
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{policy.title}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">{policy.detail}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="ui-section-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Endpoints disponibles
            </p>
            <h2 className="text-xl font-black text-[var(--foreground)]">Endpoints publicados</h2>
          </div>
          <TrackedLink
            href={appRoutes.api.openApi()}
            ctaEvent={buildOpenApiCtaEvent('developers_endpoints')}
            className="text-sm font-bold text-[var(--primary)] transition hover:opacity-80"
          >
            Ver JSON OpenAPI
          </TrackedLink>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {endpointDocs.map((endpoint) => (
            <Card
              key={`${endpoint.method}-${endpoint.path}`}
              variant="stat"
              id={buildDeveloperEndpointAnchorId(endpoint.path, endpoint.method)}
              className="scroll-mt-24 px-4 py-4"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                {endpoint.method}
              </p>
              <p className="mt-2 font-mono text-sm font-semibold text-[var(--foreground)]">{endpoint.path}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{endpoint.summary}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {endpoint.params.length > 0 ? `Params: ${endpoint.params.join(', ')}` : 'Sin parametros obligatorios o query destacados.'}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <article className="ui-section-card">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Datos y descargas
            </p>
            <h2 className="text-xl font-black text-[var(--foreground)]">Historico, CSV y versiones de datos</h2>
          </div>
          <div className="space-y-3">
            {csvDownloads.map((item) => (
              <TrackedLink
                key={item.label}
                href={item.href}
                ctaEvent={{
                  source: 'developers_dataset',
                  ctaId: 'dataset_download',
                  destination: item.href,
                  entityType: 'api',
                  sourceRole: 'utility',
                  destinationRole: 'utility',
                  transitionKind: 'within_public',
                }}
                className="group block transition hover:-translate-y-0.5"
              >
                <Card
                  variant="stat"
                  className="flex-row items-center justify-between gap-3 px-4 py-3 transition-colors group-hover:border-[var(--primary)]/40"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{item.label}</p>
                    <p className="mt-1 text-[11px] text-[var(--muted)]">{item.detail}</p>
                  </div>
                  <span className="text-xs font-bold text-[var(--primary)]">Descargar</span>
                </Card>
              </TrackedLink>
            ))}
          </div>
        </article>

        <article className="ui-section-card">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Limites y politicas
            </p>
            <h2 className="text-xl font-black text-[var(--foreground)]">Consumo responsable</h2>
          </div>
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <div className="ui-metric-card">
              <p className="stat-label">Lectura publica</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">Lecturas ligeras abiertas; usos intensivos con clave</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Las consultas sencillas siguen abiertas. CSV grandes y ventanas amplias usan `X-Public-Api-Key` y limites compartidos.</p>
            </div>
            <div className="ui-metric-card">
              <p className="stat-label">Ingesta protegida</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">GET y POST /api/collect requieren clave interna y limite de uso</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Configuracion por defecto: 6 solicitudes por 60 segundos y cabecera `x-ops-api-key`; `x-collect-api-key` se mantiene como alias temporal.</p>
            </div>
            <div className="ui-metric-card">
              <p className="stat-label">Licencia del codigo</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{codeLicense}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">La app es software libre. Para redistribuir datos derivados, revisa tambien los terminos del proveedor GBFS.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="ui-section-card">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Cambios recientes
            </p>
            <h2 className="text-xl font-black text-[var(--foreground)]">Versiones y novedades visibles</h2>
          </div>
          <div className="space-y-3">
            {changelog.map((item) => (
              <Card key={item} variant="stat" className="px-4 py-3 text-sm text-[var(--muted)]">
                {item}
              </Card>
            ))}
          </div>
        </article>

        <article className="ui-section-card">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Cita y licencia de datos
            </p>
            <h2 className="text-xl font-black text-[var(--foreground)]">Como citar y reutilizar</h2>
          </div>
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <div className="ui-metric-card">
              <p className="stat-label">Cita sugerida</p>
              <p className="text-sm leading-relaxed text-[var(--foreground)]">
                {`BiziDashboard ${cityName}, datos historicos agregados (version ${datasetVersion}), consultado el ${new Date().toLocaleDateString('es-ES')}. Fuente primaria: ${dataset.source.gbfsDiscoveryUrl}`}
              </p>
            </div>
            <div className="ui-metric-card">
              <p className="stat-label">Fuente primaria</p>
              <Link to={dataset.source.gbfsDiscoveryUrl} className="break-all text-sm font-semibold text-[var(--primary)] transition hover:opacity-80">
                {dataset.source.gbfsDiscoveryUrl}
              </Link>
            </div>
            <div className="ui-metric-card">
              <p className="stat-label">Ultima actualizacion compartida</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{formatStatusDateTime(dataset.coverage.generatedAt)}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="ui-section-card">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Casos de uso
          </p>
          <h2 className="text-xl font-black text-[var(--foreground)]">Para que sirve esta API hoy</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {useCases.map((item) => (
            <Card key={item} variant="stat" className="px-4 py-4 text-sm text-[var(--muted)]">
              {item}
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
