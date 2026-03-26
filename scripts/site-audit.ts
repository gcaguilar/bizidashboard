import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type {
  ApiErrorEntry,
  AuditReport,
  BrokenLinkEntry,
  InconsistentDataEntry,
  NoDataPageEntry,
  OrphanPageEntry,
  RedirectEntry,
  RedirectHop,
  SitemapMismatchEntry,
  StalePageEntry,
  ApiVsFrontendDiffEntry,
} from '../src/lib/site-audit-report';

type UrlCheck = {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  contentType: string | null;
  redirects: RedirectHop[];
  body: string | null;
  error: string | null;
};

type InternalLink = {
  href: string;
  exactUrl: string;
  pageUrl: string | null;
};

type CrawledPage = {
  url: string;
  title: string | null;
  text: string;
  links: InternalLink[];
};


const DEFAULT_BASE_URL = 'http://127.0.0.1:3000';
const DEFAULT_OUTPUT_PATH = 'ops/site-audit-report.json';
const MAX_REDIRECTS = 10;
const MAX_PAGES = 500;
const SEED_SOURCE = '__seed__';
const SITEMAP_SOURCE = '__sitemap__';
const CITY_LABELS: Record<string, string> = {
  zaragoza: 'Zaragoza',
  madrid: 'Madrid',
  barcelona: 'Barcelona',
};
const DATA_DRIVEN_PAGE_PATTERNS = [
  /^\/dashboard(?:\/|$)/,
  /^\/(?:zaragoza|madrid|barcelona)\/dashboard(?:\/|$)/,
  /^\/informes(?:\/|$)/,
  /^\/(?:zaragoza|madrid|barcelona)\/informes(?:\/|$)/,
  /^\/barrios(?:\/|$)/,
  /^\/(?:zaragoza|madrid|barcelona)\/barrios(?:\/|$)/,
];
const NO_DATA_PATTERNS = [
  /sin datos/iu,
  /todavia no hay historico suficiente/iu,
  /sin hallazgos disponibles/iu,
  /sin recomendaciones registradas/iu,
  /no se pudieron cargar/iu,
  /0 meses indexables/iu,
  /0 estaciones/iu,
];
const CRITICAL_API_CHECKS = [
  {
    endpoint: '/api/status',
    validate: (payload: unknown) =>
      Boolean(
        payload &&
          typeof payload === 'object' &&
          'pipeline' in payload &&
          'quality' in payload
      ),
  },
  {
    endpoint: '/api/stations',
    validate: (payload: unknown) =>
      Boolean(
        payload &&
          typeof payload === 'object' &&
          'stations' in payload &&
          Array.isArray((payload as { stations?: unknown[] }).stations)
      ),
  },
  {
    endpoint: '/api/history',
    validate: (payload: unknown) =>
      Boolean(
        payload &&
          typeof payload === 'object' &&
          'history' in payload &&
          Array.isArray((payload as { history?: unknown[] }).history) &&
          'coverage' in payload
      ),
  },
  {
    endpoint: '/api/mobility',
    validate: (payload: unknown) =>
      Boolean(
        payload &&
          typeof payload === 'object' &&
          'hourlySignals' in payload &&
          Array.isArray((payload as { hourlySignals?: unknown[] }).hourlySignals) &&
          'dailyDemand' in payload &&
          Array.isArray((payload as { dailyDemand?: unknown[] }).dailyDemand)
      ),
  },
  {
    endpoint: '/api/rankings?type=turnover&limit=10',
    validate: (payload: unknown) =>
      Boolean(
        payload &&
          typeof payload === 'object' &&
          'rankings' in payload &&
          Array.isArray((payload as { rankings?: unknown[] }).rankings)
      ),
  },
  {
    endpoint: '/api/alerts?limit=10',
    validate: (payload: unknown) =>
      Boolean(
        payload &&
          typeof payload === 'object' &&
          'alerts' in payload &&
          Array.isArray((payload as { alerts?: unknown[] }).alerts)
      ),
  },
  {
    endpoint: '/api/openapi.json',
    validate: (payload: unknown) =>
      Boolean(
        payload &&
          typeof payload === 'object' &&
          'openapi' in payload &&
          typeof (payload as { openapi?: unknown }).openapi === 'string'
      ),
  },
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseArgs(argv: string[]) {
  const args = {
    baseUrl: DEFAULT_BASE_URL,
    outputPath: DEFAULT_OUTPUT_PATH,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === '--base-url' && next) {
      args.baseUrl = next;
      index += 1;
      continue;
    }

    if (current === '--output' && next) {
      args.outputPath = next;
      index += 1;
    }
  }

  return args;
}

function normalizeBaseUrl(value: string): string {
  const url = new URL(value);
  const pathname = url.pathname.replace(/\/+$/, '');
  url.pathname = pathname || '/';
  url.hash = '';
  return pathname === '' || pathname === '/' ? url.origin : url.toString();
}

function normalizePagePath(value: string): string {
  const url = new URL(value, DEFAULT_BASE_URL);
  const pathname = url.pathname.replace(/\/+$/, '');
  return pathname || '/';
}

function normalizeRequestedUrl(baseUrl: string, value: string): string {
  const url = new URL(value, baseUrl);
  url.hash = '';
  return url.toString();
}

function isTextContentType(contentType: string | null): boolean {
  if (!contentType) {
    return false;
  }

  return (
    contentType.includes('text/html') ||
    contentType.includes('application/xhtml+xml') ||
    contentType.includes('application/xml') ||
    contentType.includes('text/xml') ||
    contentType.includes('application/json') ||
    contentType.includes('text/plain')
  );
}

function isHtmlContentType(contentType: string | null): boolean {
  return Boolean(
    contentType &&
      (contentType.includes('text/html') || contentType.includes('application/xhtml+xml'))
  );
}

function isLikelyPagePath(pathname: string): boolean {
  if (pathname.startsWith('/api/')) {
    return false;
  }

  return !/\.[a-z0-9]+$/iu.test(pathname);
}

function stripHtml(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/giu, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/giu, ' ')
    .replace(/<!--[\s\S]*?-->/giu, ' ')
    .replace(/<[^>]+>/gu, ' ')
    .replace(/&nbsp;/giu, ' ')
    .replace(/&amp;/giu, '&')
    .replace(/&quot;/giu, '"')
    .replace(/&#39;/giu, "'")
    .replace(/\s+/gu, ' ')
    .trim();
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/iu);
  return match ? stripHtml(match[1]) : null;
}

function extractLinks(html: string, pageUrl: string, baseOrigin: string): InternalLink[] {
  const sanitizedHtml = html
    .replace(/<script\b[\s\S]*?<\/script>/giu, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/giu, ' ');
  const links: InternalLink[] = [];
  const hrefPattern = /\shref=(["'])(.*?)\1/giu;

  for (const match of sanitizedHtml.matchAll(hrefPattern)) {
    const href = match[2]?.trim();
    if (!href || href.startsWith('#')) {
      continue;
    }

    if (
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('javascript:')
    ) {
      continue;
    }

    let resolved: URL;
    try {
      resolved = new URL(href, pageUrl);
    } catch {
      continue;
    }

    if (resolved.origin !== baseOrigin) {
      continue;
    }

    resolved.hash = '';
    const exactUrl = resolved.toString();
    const pageUrlValue = isLikelyPagePath(resolved.pathname)
      ? `${resolved.origin}${normalizePagePath(resolved.toString())}`
      : null;

    links.push({
      href,
      exactUrl,
      pageUrl: pageUrlValue,
    });
  }

  return links;
}

function extractSitemapUrls(xml: string, baseOrigin: string): string[] {
  const urls = new Set<string>();

  for (const match of xml.matchAll(/<loc>([\s\S]*?)<\/loc>/giu)) {
    const rawUrl = match[1]?.trim();
    if (!rawUrl) {
      continue;
    }

    try {
      const resolved = new URL(rawUrl);
      if (resolved.origin === baseOrigin) {
        urls.add(resolved.toString());
      }
    } catch {
      // Ignore malformed sitemap entries.
    }
  }

  return Array.from(urls).sort((left, right) => left.localeCompare(right));
}

function parseNumberToken(rawValue: string): number | null {
  const normalized = rawValue.replace(/\./gu, '').replace(/,/gu, '.');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

function extractNumberAfterLabel(text: string, label: string): number | null {
  const pattern = new RegExp(`${escapeRegExp(label)}\\s+([+\\-]?[\\d.,]+)`, 'iu');
  const match = text.match(pattern);
  return match?.[1] ? parseNumberToken(match[1]) : null;
}

function pathMatchesAny(pathname: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(pathname));
}

async function walkFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function routeFromAppFile(appDirectory: string, filePath: string): string | null {
  const relativePath = path.relative(appDirectory, filePath);
  const segments = relativePath.split(path.sep);
  const fileName = segments.pop();
  if (!fileName) {
    return null;
  }

  if (fileName === 'page.tsx' || fileName === 'page.ts') {
    const routeSegments = segments.filter(
      (segment) => !segment.startsWith('(') && !segment.startsWith('@')
    );
    return routeSegments.length > 0 ? `/${routeSegments.join('/')}` : '/';
  }

  if (fileName === 'route.tsx' || fileName === 'route.ts') {
    const routeSegments = segments.filter(
      (segment) => !segment.startsWith('(') && !segment.startsWith('@')
    );
    return routeSegments.length > 0 ? `/${routeSegments.join('/')}` : '/';
  }

  if (fileName === 'robots.ts' || fileName === 'robots.tsx') {
    return '/robots.txt';
  }

  if (fileName === 'sitemap.ts' || fileName === 'sitemap.tsx') {
    return '/sitemap.xml';
  }

  return null;
}

async function discoverAppRoutes(rootDirectory: string): Promise<{
  pagePatterns: Set<string>;
  apiPatterns: Set<string>;
}> {
  const appDirectory = path.join(rootDirectory, 'src', 'app');
  const files = await walkFiles(appDirectory);
  const pagePatterns = new Set<string>();
  const apiPatterns = new Set<string>();

  for (const filePath of files) {
    const route = routeFromAppFile(appDirectory, filePath);
    if (!route) {
      continue;
    }

    if (route.startsWith('/api/')) {
      apiPatterns.add(route);
      continue;
    }

    pagePatterns.add(route);
  }

  return { pagePatterns, apiPatterns };
}

async function readExportedStringArray(
  filePath: string,
  exportName: string,
  fallback: string[]
): Promise<string[]> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const pattern = new RegExp(
      `export const ${escapeRegExp(exportName)} = \\[(.*?)\\] as const;`,
      'su'
    );
    const match = content.match(pattern);
    if (!match?.[1]) {
      return fallback;
    }

    const values = Array.from(
      match[1].matchAll(/['"]([^'"]+)['"]/gu),
      (result) => result[1]
    );
    return values.length > 0 ? values : fallback;
  } catch {
    return fallback;
  }
}

function expandRoutePattern(
  pattern: string,
  replacements: {
    cities: string[];
    modes: string[];
  }
): string[] {
  let routes = [pattern];

  if (pattern.includes('[ciudad]')) {
    routes = routes.flatMap((route) =>
      replacements.cities.map((city) => route.replace(/\[ciudad\]/gu, city))
    );
  }

  if (pattern.includes('[mode]')) {
    routes = routes.flatMap((route) =>
      replacements.modes.map((mode) => route.replace(/\[mode\]/gu, mode))
    );
  }

  return routes.filter((route) => !/\[[^\]]+\]/u.test(route));
}

async function checkUrl(url: string): Promise<UrlCheck> {
  let currentUrl = url;
  const redirects: RedirectHop[] = [];

  for (let attempt = 0; attempt <= MAX_REDIRECTS; attempt += 1) {
    try {
      const response = await fetch(currentUrl, {
        redirect: 'manual',
        headers: {
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7',
        },
      });
      const location = response.headers.get('location');

      if (
        response.status >= 300 &&
        response.status < 400 &&
        location &&
        attempt < MAX_REDIRECTS
      ) {
        const nextUrl = new URL(location, currentUrl).toString();
        redirects.push({
          url: currentUrl,
          status: response.status,
          location: nextUrl,
        });
        currentUrl = nextUrl;
        continue;
      }

      const contentType = response.headers.get('content-type');
      const body = isTextContentType(contentType) ? await response.text() : null;

      return {
        requestedUrl: url,
        finalUrl: currentUrl,
        status: response.status,
        contentType,
        redirects,
        body,
        error: null,
      };
    } catch (error) {
      return {
        requestedUrl: url,
        finalUrl: currentUrl,
        status: 0,
        contentType: null,
        redirects,
        body: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return {
    requestedUrl: url,
    finalUrl: currentUrl,
    status: 0,
    contentType: null,
    redirects,
    body: null,
    error: `Too many redirects after ${MAX_REDIRECTS} hops.`,
  };
}

function getCityFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  return firstSegment && firstSegment in CITY_LABELS ? firstSegment : null;
}

function collectPageReasonsWithoutData(page: CrawledPage): string[] {
  const reasons = new Set<string>();

  for (const pattern of NO_DATA_PATTERNS) {
    if (pattern.test(page.text)) {
      reasons.add(`Coincide con el patron "${pattern.source}".`);
    }
  }

  if (/\/dashboard\/status$/u.test(page.url)) {
    const stationCount = extractNumberAfterLabel(page.text, 'Estaciones en snapshot actual');
    if (stationCount === 0) {
      reasons.add('La pagina de estado muestra 0 estaciones en el snapshot actual.');
    }
  }

  if (/\/informes$/u.test(page.url)) {
    const monthCount = extractNumberAfterLabel(page.text, 'Meses publicados');
    if (monthCount === 0) {
      reasons.add('El archivo mensual muestra 0 meses publicados.');
    }
  }

  return Array.from(reasons);
}

function buildSummary<T>(items: T[]): T[] {
  return items.sort((left, right) =>
    JSON.stringify(left).localeCompare(JSON.stringify(right), 'es')
  );
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rootDirectory = process.cwd();
  const baseUrl = normalizeBaseUrl(args.baseUrl);
  const baseOrigin = new URL(baseUrl).origin;
  const outputPath = path.resolve(rootDirectory, args.outputPath);
  const routeInfo = await discoverAppRoutes(rootDirectory);
  const [cities, modes, seoPageSlugs] = await Promise.all([
    readExportedStringArray(
      path.join(rootDirectory, 'src', 'lib', 'constants.ts'),
      'CITIES',
      ['zaragoza', 'madrid', 'barcelona']
    ),
    readExportedStringArray(
      path.join(rootDirectory, 'src', 'lib', 'dashboard-modes.ts'),
      'DASHBOARD_VIEW_MODES',
      ['overview', 'operations', 'research', 'data']
    ),
    readExportedStringArray(
      path.join(rootDirectory, 'src', 'lib', 'seo-pages.ts'),
      'SEO_PAGE_SLUGS',
      []
    ),
  ]);

  const staticPageCandidates = new Set<string>();
  for (const pattern of routeInfo.pagePatterns) {
    for (const route of expandRoutePattern(pattern, { cities, modes })) {
      staticPageCandidates.add(route);
    }
  }

  for (const slug of seoPageSlugs) {
    staticPageCandidates.add(`/${slug}`);
  }

  staticPageCandidates.add('/robots.txt');
  staticPageCandidates.add('/sitemap.xml');

  const exactCheckCache = new Map<string, Promise<UrlCheck>>();
  const exactUrlSources = new Map<string, Set<string>>();
  const crawledPages = new Map<string, CrawledPage>();
  const pageQueue: string[] = Array.from(staticPageCandidates, (route) =>
    normalizeRequestedUrl(baseUrl, route)
  );
  const queuedPages = new Set<string>(pageQueue);

  const rememberSource = (exactUrl: string, source: string) => {
    const sources = exactUrlSources.get(exactUrl) ?? new Set<string>();
    sources.add(source);
    exactUrlSources.set(exactUrl, sources);
  };

  const getUrlCheck = (exactUrl: string): Promise<UrlCheck> => {
    const normalizedExactUrl = normalizeRequestedUrl(baseUrl, exactUrl);
    rememberSource(normalizedExactUrl, SEED_SOURCE);
    const cached = exactCheckCache.get(normalizedExactUrl);
    if (cached) {
      return cached;
    }

    const checkPromise = checkUrl(normalizedExactUrl);
    exactCheckCache.set(normalizedExactUrl, checkPromise);
    return checkPromise;
  };

  const sitemapUrl = normalizeRequestedUrl(baseUrl, '/sitemap.xml');
  rememberSource(sitemapUrl, SITEMAP_SOURCE);
  const sitemapCheck = await getUrlCheck(sitemapUrl);
  const sitemapUrls =
    sitemapCheck.status === 200 && sitemapCheck.body
      ? extractSitemapUrls(sitemapCheck.body, baseOrigin)
      : [];

  for (const sitemapEntry of sitemapUrls) {
    rememberSource(sitemapEntry, SITEMAP_SOURCE);
    exactCheckCache.set(sitemapEntry, checkUrl(sitemapEntry));
    const normalizedPageUrl = `${baseOrigin}${normalizePagePath(sitemapEntry)}`;
    if (!queuedPages.has(normalizedPageUrl) && isLikelyPagePath(new URL(normalizedPageUrl).pathname)) {
      queuedPages.add(normalizedPageUrl);
      pageQueue.push(normalizedPageUrl);
    }
  }

  while (pageQueue.length > 0 && crawledPages.size < MAX_PAGES) {
    const nextPageUrl = pageQueue.shift();
    if (!nextPageUrl) {
      continue;
    }

    const result = await getUrlCheck(nextPageUrl);
    if (result.status !== 200 || !isHtmlContentType(result.contentType) || !result.body) {
      continue;
    }

    const normalizedFinalPageUrl = `${baseOrigin}${normalizePagePath(result.finalUrl)}`;
    if (crawledPages.has(normalizedFinalPageUrl)) {
      continue;
    }

    const links = extractLinks(result.body, result.finalUrl, baseOrigin);
    const text = stripHtml(result.body);
    const page: CrawledPage = {
      url: normalizedFinalPageUrl,
      title: extractTitle(result.body),
      text,
      links,
    };

    crawledPages.set(normalizedFinalPageUrl, page);

    for (const link of links) {
      rememberSource(link.exactUrl, normalizedFinalPageUrl);

      if (!exactCheckCache.has(link.exactUrl)) {
        exactCheckCache.set(link.exactUrl, checkUrl(link.exactUrl));
      }

      if (link.pageUrl && !queuedPages.has(link.pageUrl)) {
        queuedPages.add(link.pageUrl);
        pageQueue.push(link.pageUrl);
      }
    }
  }

  const settledChecks = new Map<string, UrlCheck>();
  for (const [exactUrl, promise] of exactCheckCache) {
    settledChecks.set(exactUrl, await promise);
  }

  const brokenLinks: BrokenLinkEntry[] = [];
  const redirects: RedirectEntry[] = [];
  const orphanPages: OrphanPageEntry[] = [];
  const inconsistentDataPages: InconsistentDataEntry[] = [];
  const stalePages: StalePageEntry[] = [];
  const pagesWithNoData: NoDataPageEntry[] = [];
  const apiVsFrontendDiff: ApiVsFrontendDiffEntry[] = [];
  const apiErrors: ApiErrorEntry[] = [];
  const inboundPageLinks = new Map<string, Set<string>>();
  const sitemapSet = new Set(sitemapUrls.map((url) => normalizePagePath(url)));

  for (const page of crawledPages.values()) {
    for (const link of page.links) {
      if (!link.pageUrl) {
        continue;
      }

      const normalizedTargetPage = normalizePagePath(link.pageUrl);
      const inbound = inboundPageLinks.get(normalizedTargetPage) ?? new Set<string>();
      inbound.add(page.url);
      inboundPageLinks.set(normalizedTargetPage, inbound);

      const linkCheck = settledChecks.get(link.exactUrl);
      if (!linkCheck) {
        continue;
      }

      if (linkCheck.error || linkCheck.status >= 400 || linkCheck.status === 0) {
        brokenLinks.push({
          source: page.url,
          href: link.href,
          target: link.exactUrl,
          finalUrl: linkCheck.finalUrl,
          status: linkCheck.status,
          redirects: linkCheck.redirects,
          reason: linkCheck.error ?? `HTTP ${linkCheck.status}`,
        });
      }
    }
  }

  for (const [exactUrl, result] of settledChecks) {
    if (result.redirects.length === 0) {
      continue;
    }

    redirects.push({
      url: exactUrl,
      finalUrl: result.finalUrl,
      finalStatus: result.status,
      redirects: result.redirects,
      sources: Array.from(exactUrlSources.get(exactUrl) ?? []).sort((left, right) =>
        left.localeCompare(right, 'es')
      ),
    });
  }

  for (const page of crawledPages.values()) {
    if (page.url === `${baseOrigin}/`) {
      continue;
    }

    const path = normalizePagePath(page.url);
    const inbound = inboundPageLinks.get(path);
    if (!inbound || inbound.size === 0) {
      orphanPages.push({
        url: page.url,
        reason: 'La pagina no recibe enlaces internos desde otras paginas HTML rastreadas.',
      });
    }

    for (const reason of collectPageReasonsWithoutData(page)) {
      pagesWithNoData.push({
        page: page.url,
        reason,
      });
    }

    const cityFromPath = getCityFromPath(path);
    if (cityFromPath) {
      const expectedCityLabel = CITY_LABELS[cityFromPath];
      const expectedOccurrences = page.text.match(new RegExp(expectedCityLabel, 'giu'))?.length ?? 0;

      for (const [cityKey, cityLabel] of Object.entries(CITY_LABELS)) {
        if (cityKey === cityFromPath) {
          continue;
        }

        const unexpectedOccurrences =
          page.text.match(new RegExp(cityLabel, 'giu'))?.length ?? 0;

        if (unexpectedOccurrences >= 2 && expectedOccurrences === 0) {
          inconsistentDataPages.push({
            page: page.url,
            issue: 'La ciudad mostrada no coincide con la ciudad de la URL',
            details: `La URL usa "${cityFromPath}" pero la pagina menciona "${cityLabel}" ${unexpectedOccurrences} veces y no menciona "${expectedCityLabel}".`,
          });
        }
      }
    }

    if (/\/informes$/u.test(path)) {
      const publishedMonths = extractNumberAfterLabel(page.text, 'Meses publicados');
      const reportLinks = new Set(
        page.links
          .map((link) => link.pageUrl)
          .filter((link): link is string => Boolean(link))
          .map((link) => normalizePagePath(link))
          .filter((link) =>
            /^\/(?:(?:zaragoza|madrid|barcelona)\/)?informes\/\d{4}-\d{2}$/u.test(link)
          )
      );

      if (
        publishedMonths !== null &&
        reportLinks.size > 0 &&
        Number(publishedMonths) !== reportLinks.size
      ) {
        inconsistentDataPages.push({
          page: page.url,
          issue: 'El contador de informes no coincide con los enlaces renderizados',
          details: `La pagina muestra ${publishedMonths} meses publicados, pero renderiza ${reportLinks.size} enlaces a informes.`,
        });
      }
    }
  }

  const statusApiUrl = normalizeRequestedUrl(baseUrl, '/api/status');
  const stationsApiUrl = normalizeRequestedUrl(baseUrl, '/api/stations');
  const statusPageCandidates = Array.from(crawledPages.values()).filter((page) =>
    /\/dashboard\/status$/u.test(normalizePagePath(page.url))
  );
  const statusApiCheck = await checkUrl(statusApiUrl);
  const stationsApiCheck = await checkUrl(stationsApiUrl);

  const statusApiPayload =
    statusApiCheck.status === 200 && statusApiCheck.body
      ? (safeJsonParse(statusApiCheck.body) as {
          quality?: { freshness?: { isFresh?: boolean; lastUpdated?: string | null }; volume?: { averageStationsPerPoll?: number } };
        })
      : null;
  const stationsApiPayload =
    stationsApiCheck.status === 200 && stationsApiCheck.body
      ? (safeJsonParse(stationsApiCheck.body) as { stations?: Array<unknown> })
      : null;

  const apiCheckResults = await Promise.all(
    CRITICAL_API_CHECKS.map(async (definition) => ({
      endpoint: normalizeRequestedUrl(baseUrl, definition.endpoint),
      validate: definition.validate,
      result: await checkUrl(normalizeRequestedUrl(baseUrl, definition.endpoint)),
    }))
  );

  for (const apiCheck of apiCheckResults) {
    const payload = apiCheck.result.body ? safeJsonParse(apiCheck.result.body) : null;
    const dataState =
      payload && typeof payload === 'object' && 'dataState' in payload
        ? (payload as { dataState?: unknown }).dataState
        : null;

    if (apiCheck.result.error || apiCheck.result.status !== 200) {
      apiErrors.push({
        endpoint: apiCheck.endpoint,
        status: apiCheck.result.status,
        reason: apiCheck.result.error ?? `HTTP ${apiCheck.result.status}`,
      });
      continue;
    }

    if (dataState === 'error') {
      apiErrors.push({
        endpoint: apiCheck.endpoint,
        status: apiCheck.result.status,
        reason: 'El endpoint responde con dataState=error.',
      });
      continue;
    }

    if (!apiCheck.validate(payload)) {
      apiErrors.push({
        endpoint: apiCheck.endpoint,
        status: apiCheck.result.status,
        reason: 'La respuesta no cumple el contrato minimo esperado.',
      });
    }
  }

  for (const page of statusPageCandidates) {
    const frontendStationCount = extractNumberAfterLabel(
      page.text,
      'Estaciones en snapshot actual'
    );
    const frontendAverageStationsPerPoll = extractNumberAfterLabel(
      page.text,
      'Media por sondeo'
    );
    const apiStationCount = Array.isArray(stationsApiPayload?.stations)
      ? stationsApiPayload.stations.length
      : null;
    const apiAverageStationsPerPoll =
      statusApiPayload?.quality?.volume?.averageStationsPerPoll ?? null;

    if (
      frontendStationCount !== null &&
      apiStationCount !== null &&
      frontendStationCount !== apiStationCount
    ) {
      const details = `El frontend muestra ${frontendStationCount} estaciones y /api/stations devuelve ${apiStationCount}.`;
      apiVsFrontendDiff.push({
        page: page.url,
        metric: 'stations_snapshot',
        frontend: frontendStationCount,
        api: apiStationCount,
        details,
      });
      inconsistentDataPages.push({
        page: page.url,
        issue: 'El numero de estaciones no coincide con /api/stations',
        details,
      });
    }

    if (
      frontendAverageStationsPerPoll !== null &&
      apiAverageStationsPerPoll !== null &&
      Math.round(frontendAverageStationsPerPoll) !== Math.round(apiAverageStationsPerPoll)
    ) {
      const details = `El frontend muestra ${frontendAverageStationsPerPoll} de media por sondeo y /api/status devuelve ${apiAverageStationsPerPoll}.`;
      apiVsFrontendDiff.push({
        page: page.url,
        metric: 'average_stations_per_poll',
        frontend: frontendAverageStationsPerPoll,
        api: apiAverageStationsPerPoll,
        details,
      });
      inconsistentDataPages.push({
        page: page.url,
        issue: 'La media por sondeo no coincide con /api/status',
        details,
      });
    }
  }

  const freshness = statusApiPayload?.quality?.freshness;
  const freshnessTimestamp = freshness?.lastUpdated ?? null;
  const freshnessDate =
    freshnessTimestamp && !Number.isNaN(new Date(freshnessTimestamp).getTime())
      ? new Date(freshnessTimestamp)
      : null;
  const hoursSinceUpdate =
    freshnessDate !== null ? (Date.now() - freshnessDate.getTime()) / (1000 * 60 * 60) : null;
  const isStale =
    statusApiCheck.status !== 200 ||
    freshness?.isFresh === false ||
    freshnessDate === null ||
    (hoursSinceUpdate !== null && hoursSinceUpdate > 24);

  if (isStale) {
    const staleReason =
      statusApiCheck.status !== 200
        ? `/api/status devuelve ${statusApiCheck.status || 'error'}`
        : freshness?.isFresh === false
          ? 'La API marca los datos como no frescos'
          : freshnessDate === null
            ? 'No hay fecha valida de ultima actualizacion'
            : `La ultima actualizacion tiene ${hoursSinceUpdate?.toFixed(1)} horas`;

    for (const page of crawledPages.values()) {
      const path = normalizePagePath(page.url);
      if (!pathMatchesAny(path, DATA_DRIVEN_PAGE_PATTERNS)) {
        continue;
      }

      stalePages.push({
        page: page.url,
        reason: staleReason,
        lastUpdated: freshnessTimestamp,
      });
    }
  }

  const sitemapBrokenEntries: SitemapMismatchEntry[] = [];
  const sitemapRedirectedEntries: SitemapMismatchEntry[] = [];
  for (const sitemapEntry of sitemapUrls) {
    const check = settledChecks.get(sitemapEntry);
    if (!check) {
      continue;
    }

    if (check.error || check.status >= 400 || check.status === 0) {
      sitemapBrokenEntries.push({
        url: sitemapEntry,
        reason: check.error ?? `HTTP ${check.status}`,
      });
    }

    if (check.redirects.length > 0) {
      sitemapRedirectedEntries.push({
        url: sitemapEntry,
        reason: `Redirige a ${check.finalUrl} con ${check.redirects.length} salto(s).`,
      });
    }
  }

  const missingFromSitemap: SitemapMismatchEntry[] = [];
  for (const page of crawledPages.values()) {
    const path = normalizePagePath(page.url);
    if (path === '/robots.txt' || path === '/sitemap.xml') {
      continue;
    }

    if (!sitemapSet.has(path)) {
      missingFromSitemap.push({
        url: page.url,
        reason: 'La ruta responde con HTML 200, pero no aparece en el sitemap.',
      });
    }
  }

  const report: AuditReport = {
    generated_at: new Date().toISOString(),
    base_url: baseUrl,
    summary: {
      crawled_pages: crawledPages.size,
      checked_urls: settledChecks.size,
      sitemap_entries: sitemapUrls.length,
    },
    broken_links: buildSummary(brokenLinks),
    redirects: buildSummary(redirects),
    orphan_pages: buildSummary(orphanPages),
    sitemap_mismatch: {
      broken_entries: buildSummary(sitemapBrokenEntries),
      redirected_entries: buildSummary(sitemapRedirectedEntries),
      missing_from_sitemap: buildSummary(missingFromSitemap),
    },
    inconsistent_data_pages: buildSummary(inconsistentDataPages),
    stale_pages: buildSummary(stalePages),
    pages_with_no_data: buildSummary(pagesWithNoData),
    api_vs_frontend_diff: buildSummary(apiVsFrontendDiff),
    api_errors: buildSummary(apiErrors),
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(
    JSON.stringify(
      {
        output: outputPath,
        summary: report.summary,
        counts: {
          broken_links: report.broken_links.length,
          redirects: report.redirects.length,
          orphan_pages: report.orphan_pages.length,
          sitemap_broken_entries: report.sitemap_mismatch.broken_entries.length,
          sitemap_redirected_entries: report.sitemap_mismatch.redirected_entries.length,
          sitemap_missing_from_sitemap: report.sitemap_mismatch.missing_from_sitemap.length,
          inconsistent_data_pages: report.inconsistent_data_pages.length,
          stale_pages: report.stale_pages.length,
          pages_with_no_data: report.pages_with_no_data.length,
          api_vs_frontend_diff: report.api_vs_frontend_diff.length,
          api_errors: report.api_errors?.length ?? 0,
        },
      },
      null,
      2
    )
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
