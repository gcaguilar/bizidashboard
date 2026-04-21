import { appRoutes } from '@/lib/routes';
import { normalizeSeoPath, resolveCanonicalSeoPath } from '@/lib/seo-policy';
import { getCityName, getSiteUrl } from '@/lib/site';

type MarkdownPage = {
  title: string;
  summary: string;
  links: Array<{ label: string; href: string }>;
  bullets?: string[];
};

function absoluteUrl(path: string): string {
  return new URL(path, getSiteUrl()).toString();
}

function buildGenericPage(pathname: string): MarkdownPage {
  const cityName = getCityName();
  const normalized = normalizeSeoPath(pathname);

  if (normalized === appRoutes.home()) {
    return {
      title: `DatosBizi ${cityName}`,
      summary:
        'Portal publico de analitica para Bizi con dashboard en vivo, hubs SEO, informes mensuales y documentacion de la API.',
      links: [
        { label: 'Dashboard', href: appRoutes.dashboard() },
        { label: 'Informes', href: appRoutes.reports() },
        { label: 'Estado', href: appRoutes.status() },
        { label: 'Developers', href: appRoutes.developers() },
      ],
      bullets: [
        'El dashboard operativo y las herramientas interactivas siguen estando disponibles en HTML.',
        'La capa publica incluye URLs canonicas, `llms.txt`, `llms-full.txt`, OpenAPI y sitemap.',
      ],
    };
  }

  if (normalized === appRoutes.developers()) {
    return {
      title: `Developers ${cityName}`,
      summary:
        'Hub de integracion para la API publica con OpenAPI, ejemplos de consumo, politicas de acceso y descargas CSV.',
      links: [
        { label: 'OpenAPI', href: appRoutes.api.openApi() },
        { label: 'Estado API', href: appRoutes.api.status() },
        { label: 'Sitemap', href: '/sitemap.xml' },
        { label: 'LLMs Full', href: appRoutes.llmsFull() },
      ],
      bullets: [
        'Los endpoints costosos o CSV pueden requerir `X-Public-Api-Key` o un bearer token OAuth con `public_api.read`.',
        'Las rutas operativas privadas siguen fuera de robots y del sitemap.',
      ],
    };
  }

  if (normalized === appRoutes.reports()) {
    return {
      title: `Informes mensuales ${cityName}`,
      summary:
        'Archivo historico de informes con URLs persistentes por mes y contexto editorial para cada periodo publicado.',
      links: [
        { label: 'Ultimo estado', href: appRoutes.status() },
        { label: 'Developers', href: appRoutes.developers() },
      ],
      bullets: [
        'Cada mes publicado tiene una URL canonica bajo `/informes/YYYY-MM`.',
        'El sitemap se regenera en runtime para reflejar meses publicados o retirados.',
      ],
    };
  }

  if (normalized === appRoutes.status()) {
    return {
      title: `Estado del sistema ${cityName}`,
      summary:
        'Resumen publico de frescura del dato, salud del pipeline, cobertura historica y versiones del dataset y de la API.',
      links: [
        { label: 'Dashboard', href: appRoutes.dashboard() },
        { label: 'Developers', href: appRoutes.developers() },
        { label: 'OpenAPI', href: appRoutes.api.openApi() },
      ],
    };
  }

  if (/^\/informes\/\d{4}-\d{2}$/u.test(normalized)) {
    const month = normalized.split('/').at(-1) ?? 'mes';
    return {
      title: `Informe ${month}`,
      summary:
        'Informe mensual indexable con la URL canonica del periodo, pensado para lectura editorial y descubrimiento por agentes.',
      links: [
        { label: 'Archivo de informes', href: appRoutes.reports() },
        { label: 'Dashboard', href: appRoutes.dashboard() },
      ],
    };
  }

  if (/^\/estaciones\/[^/]+$/u.test(normalized)) {
    const stationId = normalized.split('/').at(-1) ?? '';
    return {
      title: `Estacion ${stationId}`,
      summary:
        'Ficha publica de estacion con disponibilidad, contexto operativo y enlaces a las rutas canonicas del producto.',
      links: [
        { label: 'Directorio operativo', href: appRoutes.dashboardStations() },
        { label: 'API estaciones', href: appRoutes.api.stations() },
      ],
    };
  }

  if (/^\/barrios\/[^/]+$/u.test(normalized)) {
    const districtSlug = normalized.split('/').at(-1) ?? '';
    return {
      title: `Barrio ${districtSlug}`,
      summary:
        'Landing territorial con enlaces a estaciones destacadas, cobertura local y rutas canonicas de contexto urbano.',
      links: [
        { label: 'Barrios', href: appRoutes.districtLanding() },
        { label: 'Dashboard flujo', href: appRoutes.dashboardFlow() },
      ],
    };
  }

  return {
    title: `DatosBizi ${normalized}`,
    summary:
      'Representacion markdown de una ruta publica del sitio para agentes que negocian `Accept: text/markdown`.',
    links: [
      { label: 'Inicio', href: appRoutes.home() },
      { label: 'Developers', href: appRoutes.developers() },
      { label: 'LLMs', href: appRoutes.llms() },
    ],
  };
}

export function requestWantsMarkdown(request: Request): boolean {
  if (request.method !== 'GET') {
    return false;
  }

  const accept = request.headers.get('accept')?.toLowerCase() ?? '';
  return accept.includes('text/markdown');
}

export function buildMarkdownDocument(pathname: string): string {
  const normalized = normalizeSeoPath(pathname);
  const canonicalPath = resolveCanonicalSeoPath(normalized);
  const page = buildGenericPage(canonicalPath);
  const lines = [
    `# ${page.title}`,
    '',
    page.summary,
    '',
    `Canonical: ${absoluteUrl(canonicalPath)}`,
    '',
    '## Key links',
    ...page.links.map((link) => `- [${link.label}](${absoluteUrl(link.href)})`),
  ];

  if (page.bullets && page.bullets.length > 0) {
    lines.push('', '## Notes', ...page.bullets.map((bullet) => `- ${bullet}`));
  }

  return `${lines.join('\n')}\n`;
}

export function countMarkdownTokens(markdown: string): number {
  return markdown
    .split(/\s+/u)
    .map((part) => part.trim())
    .filter(Boolean).length;
}
