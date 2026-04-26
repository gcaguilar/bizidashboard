import type { Metadata } from 'next';
import Link from 'next/link';
import { DataStateNotice } from '@/app/_components/DataStateNotice';
import { PublicPageViewTracker } from '@/app/_components/PublicPageViewTracker';
import { PublicSearchForm } from '@/app/_components/PublicSearchForm';
import { PublicSectionNav } from '@/app/_components/PublicSectionNav';
import { SiteBreadcrumbs } from '@/app/_components/SiteBreadcrumbs';
import { TrackedLink } from '@/app/_components/TrackedLink';
import {
  fetchAvailableDataMonths,
  fetchSharedDatasetSnapshot,
  fetchStatus,
} from '@/lib/api';
import { buildBreadcrumbStructuredData, createRootBreadcrumbs } from '@/lib/breadcrumbs';
import { combineDataStates, shouldShowDataStateNotice } from '@/lib/data-state';
import { buildDeveloperEndpointAnchorId } from '@/lib/global-search';
import { formatMonthLabel, isValidMonthKey } from '@/lib/months';
import { openApiDocument } from '@/lib/openapi-document';
import { appRoutes } from '@/lib/routes';
import { buildPageMetadata } from '@/lib/seo';
import { buildSocialImagePath } from '@/lib/social-images';
import { buildItemListStructuredData } from '@/lib/structured-data';
import {
  buildFallbackAvailableMonths,
  buildFallbackDatasetSnapshot,
  buildFallbackStatus,
} from '@/lib/shared-data-fallbacks';
import { getCityName, getSiteUrl, SITE_NAME } from '@/lib/site';
import {
  formatStatusDateTime,
  getApiVersionLabel,
  getDatasetVersionLabel,
} from '@/lib/system-status';

type EndpointDoc = {
  path: string;
  method: string;
  summary: string;
  params: string[];
};

const OPENAPI_DESTINATION = 'openapi';

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

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'API y datos abiertos de Bizi Zaragoza',
  description:
    'Documentacion publica de la API y los datos abiertos de Bizi Zaragoza, con OpenAPI, ejemplos de uso, descargas CSV y trazabilidad del dataset.',
  path: appRoutes.developers(),
  socialImagePath: buildSocialImagePath({
    kind: 'api',
    title: 'API y datos abiertos de Bizi Zaragoza',
    subtitle: 'OpenAPI, CSV, ejemplos de uso y trazabilidad del dataset',
    eyebrow: 'API como producto',
    badges: ['OpenAPI', 'CSV', 'Developers'],
  }),
});

function getEndpointDocs(): EndpointDoc[] {
  return Object.entries(openApiDocument.paths)
    .filter(([path]) => path !== '/api/docs')
    .flatMap(([path, operations]) =>
      Object.entries(operations).map(([method, operation]) => {
        const operationRecord = operation as {
          summary?: string;
          parameters?: Array<{ name?: string }>;
        };

        return {
          path,
          method: method.toUpperCase(),
          summary: operationRecord.summary ?? 'Operacion disponible',
          params: Array.isArray(operationRecord.parameters)
            ? operationRecord.parameters.map((param: { name?: string }) => String(param.name ?? ''))
            : [],
        };
      })
    )
    .sort((left, right) => left.path.localeCompare(right.path, 'es'));
}

export default async function DevelopersPage() {
  const nowIso = new Date().toISOString();
  const siteUrl = getSiteUrl();
  const cityName = getCityName();
  const breadcrumbs = createRootBreadcrumbs({
    label: 'Developers',
    href: appRoutes.developers(),
  });

  const [dataset, availableMonths, status] = await Promise.all([
    fetchSharedDatasetSnapshot().catch(() => buildFallbackDatasetSnapshot(nowIso)),
    fetchAvailableDataMonths().catch(() => buildFallbackAvailableMonths(nowIso)),
    fetchStatus().catch(() => buildFallbackStatus(nowIso)),
  ]);

  const latestMonth = availableMonths.months.filter(isValidMonthKey)[0] ?? null;
  const endpointDocs = getEndpointDocs();
  const datasetVersion = getDatasetVersionLabel(dataset);
  const apiVersion = getApiVersionLabel();
  const codeLicense = process.env.npm_package_license ?? 'GPL-3.0-only';
  const developersDataState = combineDataStates([dataset.dataState, status.dataState]);
  const datasetTemporalCoverage =
    dataset.coverage.firstRecordedAt && dataset.coverage.lastRecordedAt
      ? `${dataset.coverage.firstRecordedAt}/${dataset.coverage.lastRecordedAt}`
      : undefined;
  const curlExamples = [
    `curl -s -H "X-Request-Id: docs-example-status" ${siteUrl}${appRoutes.api.status()}`,
    `curl -sG ${siteUrl}${appRoutes.api.rankings({ type: 'turnover', limit: 20 })}`,
    `curl -L -H "x-public-api-key: $PUBLIC_API_KEY" ${siteUrl}${appRoutes.api.historyCsv()}`,
  ];
  const pythonExample = `import requests\n\nbase_url = "${siteUrl}"\nresponse = requests.get(f"{base_url}${appRoutes.api.status()}", timeout=15)\nresponse.raise_for_status()\npayload = response.json()\nprint(payload["pipeline"]["healthStatus"])`;
  const jsExample = `const response = await fetch("${siteUrl}${appRoutes.api.stations()}");\nif (!response.ok) throw new Error(\`HTTP \${response.status}\`);\nconst payload = await response.json();\nconsole.log(payload.stations.length);`;
  const csvDownloads = [
    {
      label: 'Estado actual de estaciones',
      href: appRoutes.api.stations({ format: 'csv' }),
      detail: 'Snapshot actual en CSV con bicis, anclajes y capacidad. Acceso anonimo.',
    },
    {
      label: 'Historico agregado',
      href: appRoutes.api.historyCsv(),
      detail: 'Serie diaria con demanda, ocupacion, balance y muestras. Requiere `X-Public-Api-Key`.',
    },
    {
      label: 'Alertas historicas',
      href: appRoutes.api.alertsHistory({ format: 'csv', state: 'all', limit: 500 }),
      detail: 'Incidencias activas y resueltas con exportacion tabular. Requiere `X-Public-Api-Key`.',
    },
    {
      label: 'Ranking de friccion',
      href: appRoutes.api.rankings({ type: 'availability', limit: 200, format: 'csv' }),
      detail: 'Horas problema y riesgo de disponibilidad por estacion. Acceso anonimo.',
    },
    {
      label: 'Resumen del sistema',
      href: appRoutes.api.status({ format: 'csv' }),
      detail: 'Estado del pipeline, frescura y volumen reciente. Acceso anonimo.',
    },
  ] as const;
  const accessPolicies = [
    {
      label: 'Correlacion',
      title: 'Todas las respuestas API devuelven `X-Request-Id`',
      detail:
        'Si el cliente envia su propio identificador se reutiliza en logs, Sentry, auditoria y ejecuciones operativas.',
    },
    {
      label: 'Ops',
      title: '`GET/POST /api/collect` requieren `X-Ops-Api-Key`',
      detail:
        'La cabecera `x-collect-api-key` sigue aceptandose temporalmente como alias de compatibilidad para cron antiguos.',
    },
    {
      label: 'Elevated public',
      title: 'CSV costosos y ventanas amplias requieren `X-Public-Api-Key`',
      detail:
        'Afecta a historico CSV, alertas historicas CSV, movilidad extendida y rebalancing con ventanas o exportaciones amplias.',
    },
    {
      label: 'Mobile',
      title: '`Authorization` + `X-Installation-Id` en auth movil',
      detail:
        'Geo search y geo reverse soportan firma HMAC (`timestamp` + `signature`) y el backend puede volverla obligatoria por feature flag.',
    },
  ] as const;
  const useCases = [
    'Supervision operativa del sistema y cuadros de mando internos.',
    'Periodismo de datos y storytelling sobre movilidad urbana.',
    'Investigacion sobre demanda, equilibrio y comportamiento horario.',
    'Integraciones con apps moviles, paneles de ciudad o herramientas GIS.',
  ] as const;
  const changelog = [
    `v${apiVersion}: especificacion OpenAPI publicada y accesible para tooling.`,
    'Version actual: request tracing con `X-Request-Id`, collect protegido por clave operativa y auditoria persistente para auth, rate limits y ejecuciones.',
    `Dataset ${datasetVersion}: cobertura compartida con ${dataset.coverage.totalDays} dias y ${dataset.stats.totalSamples} muestras agregadas.`,
  ] as const;
  const datasetDownloadEntries = csvDownloads.map((item) => ({
    name: item.label,
    url: `${siteUrl}${item.href}`,
  }));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
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
                  'Portal de acceso para desarrolladores con documentacion, versiones, ejemplos y descargas.',
                url: `${siteUrl}${appRoutes.developers()}`,
              },
              {
                '@type': 'Dataset',
                name: `Dataset Bizi ${cityName}`,
                description:
                  'Snapshot actual, historico agregado y descargas CSV del mismo dataset que alimenta dashboard, informes y rankings publicos.',
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

      <header className="hero-card">
        <SiteBreadcrumbs items={breadcrumbs} />
        <PublicSectionNav activeItemId="api" className="mt-1" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              API como producto
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--foreground)] md:text-4xl">
              Developers y API {cityName}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
              Superficie visible para consumir el proyecto como producto: documentacion, OpenAPI,
              ejemplos, endpoints, descargas CSV, versiones de dataset, changelog, licencia y
              pautas de cita.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
            <span className="kpi-chip">OpenAPI {openApiDocument.openapi}</span>
            <span className="kpi-chip">API v{apiVersion}</span>
            <span className="kpi-chip">Dataset {datasetVersion}</span>
            <span className="kpi-chip">{endpointDocs.length} endpoints publicados</span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-wrap gap-3">
            <TrackedLink
              href={appRoutes.api.openApi()}
              ctaEvent={buildOpenApiCtaEvent('developers_hero')}
              className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
            >
              Descargar OpenAPI JSON
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
              className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
            >
              Ver llms.txt
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
              className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
            >
              Ver llms-full.txt
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
              className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
            >
              Ver estado del sistema
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
              className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
            >
              Ver metodologia
            </TrackedLink>
          </div>
          <PublicSearchForm eventSource="developers" />
        </div>
      </header>

      {shouldShowDataStateNotice(developersDataState) ? (
        <DataStateNotice
          state={developersDataState}
          subject="la API publica"
          description="La documentacion sigue visible, pero la disponibilidad real de snapshots, historico y exportaciones depende del mismo estado compartido que consume el dashboard."
          href={appRoutes.status()}
          actionLabel="Ver estado API"
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <article className="dashboard-card">
          <p className="stat-label">Version API</p>
          <p className="stat-value">{apiVersion}</p>
          <p className="text-xs text-[var(--muted)]">Version declarada en la especificacion OpenAPI.</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Version dataset</p>
          <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">{datasetVersion}</p>
          <p className="text-xs text-[var(--muted)]">Derivada de la ultima muestra util y del historico agregado.</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Cobertura historica</p>
          <p className="stat-value">{dataset.coverage.totalDays}</p>
          <p className="text-xs text-[var(--muted)]">{dataset.stats.totalSamples} muestras y {dataset.stats.totalStations} estaciones.</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Ultima generacion</p>
          <p className="text-sm font-semibold leading-snug text-[var(--foreground)]">
            {formatStatusDateTime(dataset.coverage.generatedAt)}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {latestMonth ? `Ultimo mes publicado ${formatMonthLabel(latestMonth)}.` : 'Sin archivo mensual publicado.'}
          </p>
        </article>
      </section>

      <section className="dashboard-card">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Quick start
          </p>
          <h2 className="text-xl font-black text-[var(--foreground)]">Ejemplos de consumo</h2>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="stat-label">curl</p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[var(--foreground)]">
              <code>{curlExamples.join('\n\n')}</code>
            </pre>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="stat-label">Python</p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[var(--foreground)]">
              <code>{pythonExample}</code>
            </pre>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="stat-label">JavaScript</p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[var(--foreground)]">
              <code>{jsExample}</code>
            </pre>
          </article>
        </div>
      </section>

      <section className="dashboard-card" id="rebalancing-api">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Logistica y redistribucion
          </p>
          <h2 className="text-xl font-black text-[var(--foreground)]">API de reequilibrio</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            El endpoint <code>/api/rebalancing-report</code> devuelve recomendaciones origen-destino,
            clasificacion estructural A-F y metricas de impacto operativo estimadas.
          </p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="stat-label">Ejemplo (curl)</p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[var(--foreground)]">
              <code>{`curl -sG ${siteUrl}${appRoutes.api.rebalancingReport({ district: 'Centro', days: 15 })}`}</code>
            </pre>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="stat-label">Ejemplo (Python)</p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[var(--foreground)]">
              <code>{`import requests

base_url = "${siteUrl}"
params = {"days": 15, "format": "json"}
res = requests.get(f"{base_url}${appRoutes.api.rebalancingReport()}", params=params, timeout=20)
res.raise_for_status()
print(len(res.json()["transfers"]))`}</code>
            </pre>
          </article>
        </div>
      </section>

      <section className="dashboard-card">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Acceso y seguridad
          </p>
          <h2 className="text-xl font-black text-[var(--foreground)]">Contrato operativo actual</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {accessPolicies.map((policy) => (
            <article
              key={policy.label}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4"
            >
              <p className="stat-label">{policy.label}</p>
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{policy.title}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">{policy.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Superficie disponible
            </p>
            <h2 className="text-xl font-black text-[var(--foreground)]">Endpoints publicados</h2>
          </div>
          <TrackedLink
            href={appRoutes.api.openApi()}
            ctaEvent={buildOpenApiCtaEvent('developers_endpoints')}
            className="text-sm font-bold text-[var(--accent)] transition hover:opacity-80"
          >
            Ver JSON OpenAPI
          </TrackedLink>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {endpointDocs.map((endpoint) => (
            <article
              key={`${endpoint.method}-${endpoint.path}`}
              id={buildDeveloperEndpointAnchorId(endpoint.path, endpoint.method)}
              className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                {endpoint.method}
              </p>
              <p className="mt-2 font-mono text-sm font-semibold text-[var(--foreground)]">{endpoint.path}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{endpoint.summary}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {endpoint.params.length > 0 ? `Params: ${endpoint.params.join(', ')}` : 'Sin parametros obligatorios o query destacados.'}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <article className="dashboard-card">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Dataset y descargas
            </p>
            <h2 className="text-xl font-black text-[var(--foreground)]">Historico, CSV y versiones</h2>
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
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{item.label}</p>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">{item.detail}</p>
                </div>
                <span className="text-xs font-bold text-[var(--accent)]">Descargar</span>
              </TrackedLink>
            ))}
          </div>
        </article>

        <article className="dashboard-card">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Rate limits y politicas
            </p>
            <h2 className="text-xl font-black text-[var(--foreground)]">Consumo responsable</h2>
          </div>
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <div className="stat-card">
              <p className="stat-label">Lectura publica</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">Modelo mixto: anonimo para lectura barata, clave para acceso elevado</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Las lecturas ligeras siguen abiertas; CSV costosos y ventanas amplias pasan por `X-Public-Api-Key` y rate limit compartido.</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Ingesta protegida</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">GET y POST /api/collect aplican auth operativa + Redis rate limit</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Configuracion por defecto: 6 solicitudes por 60 segundos y cabecera `x-ops-api-key`; `x-collect-api-key` queda como alias temporal.</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Licencia del codigo</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{codeLicense}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">La app esta licenciada como software libre; para redistribuir datos derivados revisa tambien los terminos del proveedor GBFS.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="dashboard-card">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Changelog actual
            </p>
            <h2 className="text-xl font-black text-[var(--foreground)]">Versiones y cambios visibles</h2>
          </div>
          <div className="space-y-3">
            {changelog.map((item) => (
              <div key={item} className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--muted)]">
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-card">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Cita y licencia de datos
            </p>
            <h2 className="text-xl font-black text-[var(--foreground)]">Como citar y reutilizar</h2>
          </div>
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <div className="stat-card">
              <p className="stat-label">Cita sugerida</p>
              <p className="text-sm leading-relaxed text-[var(--foreground)]">
                {`BiziDashboard ${cityName}, dataset historico agregado (version ${datasetVersion}), consultado el ${new Date().toLocaleDateString('es-ES')}. Fuente primaria: ${dataset.source.gbfsDiscoveryUrl}`}
              </p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Fuente primaria</p>
              <Link href={dataset.source.gbfsDiscoveryUrl} className="break-all text-sm font-semibold text-[var(--accent)] transition hover:opacity-80">
                {dataset.source.gbfsDiscoveryUrl}
              </Link>
            </div>
            <div className="stat-card">
              <p className="stat-label">Ultima generacion compartida</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{formatStatusDateTime(dataset.coverage.generatedAt)}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-card">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Casos de uso
          </p>
          <h2 className="text-xl font-black text-[var(--foreground)]">Para que sirve esta API hoy</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {useCases.map((item) => (
            <article key={item} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4 text-sm text-[var(--muted)]">
              {item}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
