import type { DataState } from '@/lib/data-state';
import { appRoutes } from '@/lib/routes';

export const SEO_BRAND_NAME = 'DatosBizi';

export type SeoPageType =
  | 'marketing'
  | 'data_hub'
  | 'district'
  | 'report'
  | 'station'
  | 'tool'
  | 'dashboard'
  | 'duplicate';

export type SeoIndexabilityThreshold = {
  label: string;
  current: number;
  minimum: number;
};

export type SeoIndexabilityInput = {
  path: string;
  canonicalPath?: string;
  pageType?: SeoPageType;
  dataState?: DataState | null;
  hasMeaningfulContent?: boolean;
  hasData?: boolean;
  requiresStrongCoverage?: boolean;
  isDuplicate?: boolean;
  thresholds?: SeoIndexabilityThreshold[];
};

export type SeoIndexabilityDecision = {
  canonicalPath: string;
  pageType: SeoPageType;
  indexable: boolean;
  includeInSitemap: boolean;
  follow: boolean;
  reason: string;
};

const TRACKING_QUERY_PARAMS = new Set([
  'fbclid',
  'gclid',
  'gbraid',
  'mc_cid',
  'mc_eid',
  'msclkid',
  'ref',
  'srsltid',
  'utm_campaign',
  'utm_content',
  'utm_id',
  'utm_medium',
  'utm_source',
  'utm_term',
  'wbraid',
]);

const DUPLICATE_CANONICAL_PATHS: Record<string, string> = {
  [appRoutes.beta()]: appRoutes.biciradar(),
  [appRoutes.seoPage('informes-mensuales-bizi-zaragoza')]: appRoutes.reports(),
};

const CANONICAL_QUERY_ALLOWLIST = [
  {
    pattern: /^\/comparar$/u,
    keys: new Set(['dimension', 'left', 'right']),
  },
  {
    pattern: /^\/explorar$/u,
    keys: new Set(['q']),
  },
] as const;

export function normalizeSeoPath(path: string): string {
  const normalized = path.trim().replace(/\/+$/u, '');
  return normalized.length > 0 ? normalized : '/';
}

export function isDashboardPath(path: string): boolean {
  return /^\/dashboard(?:\/|$)/u.test(normalizeSeoPath(path));
}

export function isToolPath(path: string): boolean {
  const normalized = normalizeSeoPath(path);
  return normalized === appRoutes.compare() || normalized === appRoutes.explore();
}

export function resolveCanonicalSeoPath(path: string): string {
  const normalized = normalizeSeoPath(path);
  return DUPLICATE_CANONICAL_PATHS[normalized] ?? normalized;
}

export function inferSeoPageType(path: string): SeoPageType {
  const normalized = normalizeSeoPath(path);

  if (resolveCanonicalSeoPath(normalized) !== normalized) {
    return 'duplicate';
  }

  if (isDashboardPath(normalized)) {
    return 'dashboard';
  }

  if (isToolPath(normalized)) {
    return 'tool';
  }

  if (/^\/estaciones\/[^/]+$/u.test(normalized)) {
    return 'station';
  }

  if (/^\/barrios\/[^/]+$/u.test(normalized)) {
    return 'district';
  }

  if (/^\/informes\/[^/]+$/u.test(normalized)) {
    return 'report';
  }

  return 'marketing';
}

function normalizeThresholds(
  thresholds: SeoIndexabilityThreshold[] | undefined
): SeoIndexabilityThreshold[] {
  return (thresholds ?? []).filter((threshold) =>
    Number.isFinite(threshold.current) && Number.isFinite(threshold.minimum)
  );
}

export function evaluatePageIndexability({
  path,
  canonicalPath,
  pageType,
  dataState,
  hasMeaningfulContent = true,
  hasData = true,
  requiresStrongCoverage = false,
  isDuplicate = false,
  thresholds,
}: SeoIndexabilityInput): SeoIndexabilityDecision {
  const normalizedPath = normalizeSeoPath(path);
  const resolvedCanonicalPath = resolveCanonicalSeoPath(
    canonicalPath ?? normalizedPath
  );
  const resolvedPageType = pageType ?? inferSeoPageType(normalizedPath);
  const thresholdList = normalizeThresholds(thresholds);
  const duplicateRoute =
    isDuplicate ||
    resolvedPageType === 'duplicate' ||
    resolvedCanonicalPath !== normalizedPath;

  if (resolvedPageType === 'dashboard') {
    return {
      canonicalPath: resolvedCanonicalPath,
      pageType: resolvedPageType,
      indexable: false,
      includeInSitemap: false,
      follow: true,
      reason: 'operational-route',
    };
  }

  if (resolvedPageType === 'tool') {
    return {
      canonicalPath: resolvedCanonicalPath,
      pageType: resolvedPageType,
      indexable: false,
      includeInSitemap: false,
      follow: true,
      reason: 'interactive-tool-route',
    };
  }

  if (duplicateRoute) {
    return {
      canonicalPath: resolvedCanonicalPath,
      pageType: 'duplicate',
      indexable: false,
      includeInSitemap: false,
      follow: true,
      reason: 'duplicate-or-legacy-route',
    };
  }

  if (!hasMeaningfulContent) {
    return {
      canonicalPath: resolvedCanonicalPath,
      pageType: resolvedPageType,
      indexable: false,
      includeInSitemap: false,
      follow: true,
      reason: 'missing-visible-context',
    };
  }

  if (dataState === 'loading' || dataState === 'error') {
    return {
      canonicalPath: resolvedCanonicalPath,
      pageType: resolvedPageType,
      indexable: false,
      includeInSitemap: false,
      follow: true,
      reason: 'metadata-source-unavailable',
    };
  }

  if (dataState === 'no_coverage') {
    return {
      canonicalPath: resolvedCanonicalPath,
      pageType: resolvedPageType,
      indexable: false,
      includeInSitemap: false,
      follow: true,
      reason: 'no-coverage',
    };
  }

  if (dataState === 'empty' || !hasData) {
    return {
      canonicalPath: resolvedCanonicalPath,
      pageType: resolvedPageType,
      indexable: false,
      includeInSitemap: false,
      follow: true,
      reason: 'empty-or-thin-content',
    };
  }

  if (requiresStrongCoverage && dataState === 'partial') {
    return {
      canonicalPath: resolvedCanonicalPath,
      pageType: resolvedPageType,
      indexable: false,
      includeInSitemap: false,
      follow: true,
      reason: 'partial-coverage',
    };
  }

  const failedThreshold = thresholdList.find(
    (threshold) => threshold.current < threshold.minimum
  );

  if (failedThreshold) {
    return {
      canonicalPath: resolvedCanonicalPath,
      pageType: resolvedPageType,
      indexable: false,
      includeInSitemap: false,
      follow: true,
      reason: `below-threshold:${failedThreshold.label}`,
    };
  }

  return {
    canonicalPath: resolvedCanonicalPath,
    pageType: resolvedPageType,
    indexable: true,
    includeInSitemap: true,
    follow: true,
    reason: 'indexable',
  };
}

export function buildSeoTitle(title: string): string {
  return `${title} | ${SEO_BRAND_NAME}`;
}

export function getCanonicalQueryAllowlist(path: string): Set<string> | null {
  const normalizedPath = normalizeSeoPath(path);

  if (normalizedPath.startsWith('/api/') || isDashboardPath(normalizedPath)) {
    return null;
  }

  const matchedRule = CANONICAL_QUERY_ALLOWLIST.find((rule) =>
    rule.pattern.test(normalizedPath)
  );

  return matchedRule ? new Set(matchedRule.keys) : new Set<string>();
}

export function cleanCanonicalSearchParams(
  path: string,
  searchParams: URLSearchParams
): URLSearchParams | null {
  const allowlist = getCanonicalQueryAllowlist(path);

  if (allowlist === null) {
    return null;
  }

  const cleaned = new URLSearchParams();
  let changed = false;

  for (const [rawKey, rawValue] of searchParams.entries()) {
    const key = rawKey.trim();
    const value = rawValue.trim();

    if (TRACKING_QUERY_PARAMS.has(key.toLowerCase())) {
      changed = true;
      continue;
    }

    if (!allowlist.has(key) || value.length === 0) {
      changed = true;
      continue;
    }

    cleaned.append(key, value);
  }

  return changed ? cleaned : null;
}
