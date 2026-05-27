import { appRoutes } from '@/lib/routes';

export type RedirectHop = {
  url: string;
  status: number;
  location: string;
};

export type BrokenLinkEntry = {
  source: string;
  href: string;
  target: string;
  finalUrl: string;
  status: number;
  redirects: RedirectHop[];
  reason: string;
};

export type RedirectEntry = {
  url: string;
  finalUrl: string;
  finalStatus: number;
  redirects: RedirectHop[];
  sources: string[];
};

export type OrphanPageEntry = {
  url: string;
  reason: string;
};

export type SitemapMismatchEntry = {
  url: string;
  reason: string;
};

export type InconsistentDataEntry = {
  page: string;
  issue: string;
  details: string;
};

export type StalePageEntry = {
  page: string;
  reason: string;
  lastUpdated: string | null;
};

export type NoDataPageEntry = {
  page: string;
  reason: string;
};

export type ApiVsFrontendDiffEntry = {
  page: string;
  metric: string;
  frontend: number | string | null;
  api: number | string | null;
  details: string;
};

export type ApiErrorEntry = {
  endpoint: string;
  status: number;
  reason: string;
};

export type HtmlShellIssueEntry = {
  url: string;
  reason: string;
  starts_with: string;
};

export type AuditReport = {
  generated_at: string;
  base_url: string;
  summary: {
    crawled_pages: number;
    checked_urls: number;
    sitemap_entries: number;
  };
  broken_links: BrokenLinkEntry[];
  redirects: RedirectEntry[];
  orphan_pages: OrphanPageEntry[];
  sitemap_mismatch: {
    broken_entries: SitemapMismatchEntry[];
    redirected_entries: SitemapMismatchEntry[];
    missing_from_sitemap: SitemapMismatchEntry[];
  };
  inconsistent_data_pages: InconsistentDataEntry[];
  stale_pages: StalePageEntry[];
  pages_with_no_data: NoDataPageEntry[];
  api_vs_frontend_diff: ApiVsFrontendDiffEntry[];
  api_errors?: ApiErrorEntry[];
  html_shell_issues?: HtmlShellIssueEntry[];
};

export const CRITICAL_ORPHAN_ROUTE_PATHS = [
  appRoutes.home(),
  appRoutes.dashboard(),
  appRoutes.utilityLanding(),
  appRoutes.insightsLanding(),
  appRoutes.seoPage('uso-bizi-por-estacion'),
  appRoutes.districtLanding(),
  appRoutes.methodology(),
  appRoutes.reports(),
  appRoutes.developers(),
  appRoutes.status(),
  appRoutes.explore(),
  appRoutes.compare(),
  appRoutes.dashboardStations(),
  appRoutes.dashboardFlow(),
  appRoutes.dashboardConclusions(),
  appRoutes.dashboardHelp(),
] as const;

function normalizePathname(value: string): string {
  const pathname = new URL(value, 'https://datosbizi.com').pathname.replace(/\/+$/u, '');
  return pathname || '/';
}

export function getApiErrors(report: AuditReport): ApiErrorEntry[] {
  return report.api_errors ?? [];
}

export function getHtmlShellIssues(report: AuditReport): HtmlShellIssueEntry[] {
  return report.html_shell_issues ?? [];
}

export function findCriticalOrphanPages(report: AuditReport): OrphanPageEntry[] {
  const criticalRoutes = new Set<string>(CRITICAL_ORPHAN_ROUTE_PATHS);

  return report.orphan_pages.filter((entry) => criticalRoutes.has(normalizePathname(entry.url)));
}

export function summarizeAuditReport(report: AuditReport) {
  const criticalOrphanPages = findCriticalOrphanPages(report);
  const apiErrors = getApiErrors(report);
  const htmlShellIssues = getHtmlShellIssues(report);

  return {
    broken_links: report.broken_links.length,
    redirects: report.redirects.length,
    orphan_pages: report.orphan_pages.length,
    critical_orphan_pages: criticalOrphanPages.length,
    sitemap_broken_entries: report.sitemap_mismatch.broken_entries.length,
    sitemap_redirected_entries: report.sitemap_mismatch.redirected_entries.length,
    sitemap_missing_from_sitemap: report.sitemap_mismatch.missing_from_sitemap.length,
    inconsistent_data_pages: report.inconsistent_data_pages.length,
    stale_pages: report.stale_pages.length,
    pages_with_no_data: report.pages_with_no_data.length,
    api_vs_frontend_diff: report.api_vs_frontend_diff.length,
    api_errors: apiErrors.length,
    html_shell_issues: htmlShellIssues.length,
  };
}

export type SiteAuditGateResult = {
  ok: boolean;
  failures: string[];
  warnings: string[];
  counts: ReturnType<typeof summarizeAuditReport>;
  critical_orphan_pages: OrphanPageEntry[];
  api_errors: ApiErrorEntry[];
  likely_infra_outage: {
    detected: boolean;
    five_xx_broken_links: number;
    total_broken_links: number;
    five_xx_ratio: number;
    notes: string[];
  };
};

function isFiveXxStatus(status: number): boolean {
  return status >= 500 && status <= 599;
}

function buildInfraOutageDiagnosis(report: AuditReport, apiErrors: ApiErrorEntry[]) {
  const fiveXxBrokenLinks = report.broken_links.filter((entry) => isFiveXxStatus(entry.status)).length;
  const totalBrokenLinks = report.broken_links.length;
  const fiveXxRatio = totalBrokenLinks > 0 ? fiveXxBrokenLinks / totalBrokenLinks : 0;
  const apiFiveXxCount = apiErrors.filter((entry) => isFiveXxStatus(entry.status)).length;

  const detected =
    (totalBrokenLinks >= 30 && fiveXxRatio >= 0.8) ||
    (totalBrokenLinks >= 10 && fiveXxRatio >= 0.9 && apiFiveXxCount > 0);

  const notes: string[] = [];
  if (detected) {
    notes.push(
      `Predominio de 5xx en links rotos (${fiveXxBrokenLinks}/${totalBrokenLinks}, ${(fiveXxRatio * 100).toFixed(1)}%).`
    );
    if (apiFiveXxCount > 0) {
      notes.push(`${apiFiveXxCount} endpoint(s) criticos de API también devuelven 5xx.`);
    }
    notes.push(
      'Esto apunta primero a incidencia de origin/proxy/infra. Validar disponibilidad base antes de tratarlo como regresión funcional.'
    );
  }

  return {
    detected,
    five_xx_broken_links: fiveXxBrokenLinks,
    total_broken_links: totalBrokenLinks,
    five_xx_ratio: Number(fiveXxRatio.toFixed(4)),
    notes,
  };
}

export function evaluateSiteAuditReport(report: AuditReport): SiteAuditGateResult {
  const failures: string[] = [];
  const warnings: string[] = [];
  const criticalOrphanPages = findCriticalOrphanPages(report);
  const apiErrors = getApiErrors(report);
  const htmlShellIssues = getHtmlShellIssues(report);
  const infraDiagnosis = buildInfraOutageDiagnosis(report, apiErrors);

  if (report.broken_links.length > 0) {
    failures.push(`${report.broken_links.length} enlaces internos rotos.`);
  }

  if (report.inconsistent_data_pages.length > 0) {
    failures.push(`${report.inconsistent_data_pages.length} paginas con datos inconsistentes.`);
  }

  if (report.sitemap_mismatch.broken_entries.length > 0) {
    failures.push(
      `${report.sitemap_mismatch.broken_entries.length} entradas del sitemap devuelven error.`
    );
  }

  if (report.sitemap_mismatch.redirected_entries.length > 0) {
    failures.push(
      `${report.sitemap_mismatch.redirected_entries.length} entradas del sitemap redirigen en vez de resolver canonicas.`
    );
  }

  if (report.sitemap_mismatch.missing_from_sitemap.length > 0) {
    failures.push(
      `${report.sitemap_mismatch.missing_from_sitemap.length} paginas reales faltan en el sitemap.`
    );
  }

  if (criticalOrphanPages.length > 0) {
    failures.push(`${criticalOrphanPages.length} paginas huerfanas criticas.`);
  }

  if (apiErrors.length > 0) {
    failures.push(`${apiErrors.length} endpoints criticos de API fallan.`);
  }

  if (htmlShellIssues.length > 0) {
    failures.push(`${htmlShellIssues.length} paginas HTML responden sin doctype valido.`);
  }

  if (report.redirects.length > 0) {
    warnings.push(`${report.redirects.length} URLs revisadas incluyen redirecciones.`);
  }

  if (report.pages_with_no_data.length > 0) {
    warnings.push(`${report.pages_with_no_data.length} paginas muestran estados sin datos.`);
  }

  if (report.stale_pages.length > 0) {
    warnings.push(`${report.stale_pages.length} paginas usan datos antiguos o sin frescura.`);
  }

  if (report.api_vs_frontend_diff.length > 0) {
    warnings.push(
      `${report.api_vs_frontend_diff.length} diferencias API vs frontend detectadas por el auditor.`
    );
  }

  if (infraDiagnosis.detected) {
    warnings.push('Se detecta un posible outage de infraestructura (predominio de errores 5xx).');
  }

  return {
    ok: failures.length === 0,
    failures,
    warnings,
    counts: summarizeAuditReport(report),
    critical_orphan_pages: criticalOrphanPages,
    api_errors: apiErrors,
    likely_infra_outage: infraDiagnosis,
  };
}
