import type { DashboardViewMode } from '@/lib/dashboard-modes';

export type UmamiEventValue = string | number | boolean | null | undefined;
export type UmamiSurface = 'public' | 'dashboard';
export type UmamiEntityType = 'station' | 'district' | 'report' | 'api' | 'help';
export type UmamiQueryLengthBucket = '0' | '1_2' | '3_5' | '6_plus';
export type UmamiResultCountBucket = '0' | '1' | '2_5' | '6_20' | '21_plus';
export type UmamiNavigationRole = 'home' | 'entry_seo' | 'hub' | 'detail' | 'dashboard' | 'utility';
export type UmamiTrackedEventName =
  | 'public_page_view'
  | 'dashboard_page_view'
  | 'navigation_click'
  | 'cta_click'
  | 'search_submit'
  | 'dashboard_mode_change'
  | 'filter_change'
  | 'entity_select'
  | 'panel_open'
  | 'export_click';

export type LegacyUmamiInteractionName =
  | 'api_cta_click'
  | 'related_module_click'
  | 'report_open_click'
  | 'station_card_click'
  | 'app_external_click'
  | 'dataset_source_click'
  | 'dataset_download_click'
  | 'ad_landing_primary_click'
  | 'ad_landing_secondary_click'
  | 'home_cta_primary_click';

type AllowedPayloadKey =
  | 'surface'
  | 'route_key'
  | 'page_type'
  | 'template'
  | 'source'
  | 'destination'
  | 'module'
  | 'cta_id'
  | 'mode'
  | 'month_present'
  | 'period'
  | 'time_window'
  | 'entity_type'
  | 'query_present'
  | 'query_length_bucket'
  | 'result_count_bucket'
  | 'is_external'
  | 'source_role'
  | 'destination_role'
  | 'transition_kind';

export type UmamiEventPayload = Partial<Record<AllowedPayloadKey, UmamiEventValue>>;

export type UmamiTrackedEvent = {
  name: UmamiTrackedEventName;
  payload?: UmamiEventPayload;
};

type PublicPageViewInput = {
  routeKey: string;
  pageType: string;
  template: string;
};

type DashboardPageViewInput = {
  routeKey: string;
  pageType: string;
  template: string;
  mode?: DashboardViewMode;
};

type SearchSubmitInput = {
  surface: UmamiSurface;
  routeKey: string;
  source: string;
  queryLength: number;
  resultCount?: number | null;
};

export type NavigationClickInput = {
  surface: UmamiSurface;
  routeKey: string;
  source: string;
  destination: string;
  module?: string;
  sourceRole?: UmamiNavigationRole;
  destinationRole?: UmamiNavigationRole;
  transitionKind?: string;
};

export type CtaClickInput = {
  surface: UmamiSurface;
  routeKey: string;
  source: string;
  ctaId: string;
  destination?: string;
  module?: string;
  entityType?: UmamiEntityType;
  monthPresent?: boolean;
  isExternal?: boolean;
  sourceRole?: UmamiNavigationRole;
  destinationRole?: UmamiNavigationRole;
  transitionKind?: string;
};

type DashboardModeChangeInput = {
  routeKey: string;
  mode: DashboardViewMode;
  source?: string;
};

type FilterChangeInput = {
  surface: UmamiSurface;
  routeKey: string;
  module: string;
  source?: string;
  destination?: string;
  monthPresent?: boolean;
  period?: string;
  timeWindow?: string;
  resultCount?: number | null;
};

type EntitySelectInput = {
  surface: UmamiSurface;
  routeKey: string;
  entityType: UmamiEntityType;
  source: string;
  module?: string;
};

type PanelOpenInput = {
  surface: UmamiSurface;
  routeKey: string;
  module: string;
  source?: string;
  destination?: string;
};

type ExportClickInput = {
  surface: UmamiSurface;
  routeKey: string;
  source: string;
  ctaId: string;
  entityType?: UmamiEntityType;
  module?: string;
};

type LegacyUmamiInteractionInput = {
  eventName: LegacyUmamiInteractionName;
  pathname?: string | null;
  eventData?: Record<string, UmamiEventValue>;
};

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, payload?: UmamiEventPayload) => void;
    };
  }
}

const ALLOWED_PAYLOAD_KEYS: readonly AllowedPayloadKey[] = [
  'surface',
  'route_key',
  'page_type',
  'template',
  'source',
  'destination',
  'module',
  'cta_id',
  'mode',
  'month_present',
  'period',
  'time_window',
  'entity_type',
  'query_present',
  'query_length_bucket',
  'result_count_bucket',
  'is_external',
  'source_role',
  'destination_role',
  'transition_kind',
];

const ALLOWED_PAYLOAD_KEY_SET = new Set<string>(ALLOWED_PAYLOAD_KEYS);

function basePayload(surface: UmamiSurface, routeKey: string): UmamiEventPayload {
  return {
    surface,
    route_key: routeKey,
  };
}

function readString(
  payload: Record<string, UmamiEventValue> | undefined,
  key: string
): string | undefined {
  const value = payload?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function readBoolean(
  payload: Record<string, UmamiEventValue> | undefined,
  key: string
): boolean | undefined {
  const value = payload?.[key];
  return typeof value === 'boolean' ? value : undefined;
}

function surfaceFromPathname(pathname: string | null | undefined): UmamiSurface {
  return pathname?.startsWith('/dashboard') ? 'dashboard' : 'public';
}

function normalizeRouteKey(pathname: string): string {
  return pathname
    .replace(/^\/+/, '')
    .replace(/\/+/g, '_')
    .replace(/[^a-zA-Z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase() || 'unknown';
}

export function resolveRouteKeyFromPathname(pathname: string | null | undefined): string {
  if (!pathname || pathname === '/') {
    return 'home';
  }

  if (pathname === '/dashboard') {
    return 'dashboard_home';
  }

  if (pathname === '/dashboard/flujo') {
    return 'dashboard_flow';
  }

  if (pathname === '/dashboard/conclusiones') {
    return 'dashboard_conclusions';
  }

  if (pathname === '/dashboard/redistribucion') {
    return 'dashboard_redistribucion';
  }

  if (pathname === '/dashboard/ayuda') {
    return 'dashboard_help';
  }

  if (pathname === '/dashboard/alertas') {
    return 'dashboard_alerts';
  }

  if (pathname === '/dashboard/estaciones') {
    return 'dashboard_stations';
  }

  if (pathname.startsWith('/dashboard/estaciones/')) {
    return 'dashboard_station_detail';
  }

  if (pathname === '/developers') {
    return 'developers';
  }

  if (pathname === '/metodologia') {
    return 'methodology';
  }

  if (pathname === '/informes') {
    return 'report_archive';
  }

  if (pathname.startsWith('/informes/')) {
    return 'monthly_report';
  }

  if (pathname.startsWith('/estaciones/')) {
    return 'station_detail';
  }

  if (pathname.startsWith('/barrios/')) {
    return 'district_detail';
  }

  if (pathname === '/estado') {
    return 'status';
  }

  if (pathname === '/biciradar') {
    return 'biciradar';
  }

  if (pathname === '/explorar') {
    return 'explore';
  }

  if (pathname === '/comparar') {
    return 'compare';
  }

  if (pathname === '/mapa-estaciones-bizi-zaragoza') {
    return 'utility_landing';
  }

  if (pathname === '/estadisticas-bizi-zaragoza') {
    return 'insights_landing';
  }

  return normalizeRouteKey(pathname);
}

export function getQueryLengthBucket(length: number): UmamiQueryLengthBucket {
  if (length <= 0) {
    return '0';
  }

  if (length <= 2) {
    return '1_2';
  }

  if (length <= 5) {
    return '3_5';
  }

  return '6_plus';
}

export function getResultCountBucket(count: number): UmamiResultCountBucket {
  if (count <= 0) {
    return '0';
  }

  if (count === 1) {
    return '1';
  }

  if (count <= 5) {
    return '2_5';
  }

  if (count <= 20) {
    return '6_20';
  }

  return '21_plus';
}

export function sanitizeUmamiPayload(
  payload: Record<string, UmamiEventValue> | undefined
): UmamiEventPayload | undefined {
  if (!payload) {
    return undefined;
  }

  const sanitizedEntries = Object.entries(payload).filter(([key, value]) => {
    if (!ALLOWED_PAYLOAD_KEY_SET.has(key) || value === undefined || value === null) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    return true;
  });

  return sanitizedEntries.length > 0
    ? (Object.fromEntries(sanitizedEntries) as UmamiEventPayload)
    : undefined;
}

export function buildPublicPageViewEvent({
  routeKey,
  pageType,
  template,
}: PublicPageViewInput): UmamiTrackedEvent {
  return {
    name: 'public_page_view',
    payload: {
      ...basePayload('public', routeKey),
      page_type: pageType,
      template,
    },
  };
}

export function buildDashboardPageViewEvent({
  routeKey,
  pageType,
  template,
  mode,
}: DashboardPageViewInput): UmamiTrackedEvent {
  return {
    name: 'dashboard_page_view',
    payload: {
      ...basePayload('dashboard', routeKey),
      page_type: pageType,
      template,
      mode,
    },
  };
}

export function buildSearchSubmitEvent({
  surface,
  routeKey,
  source,
  queryLength,
  resultCount,
}: SearchSubmitInput): UmamiTrackedEvent {
  return {
    name: 'search_submit',
    payload: {
      ...basePayload(surface, routeKey),
      source,
      query_present: queryLength > 0,
      query_length_bucket: getQueryLengthBucket(queryLength),
      result_count_bucket:
        typeof resultCount === 'number' ? getResultCountBucket(resultCount) : undefined,
    },
  };
}

export function buildNavigationClickEvent({
  surface,
  routeKey,
  source,
  destination,
  module,
  sourceRole,
  destinationRole,
  transitionKind,
}: NavigationClickInput): UmamiTrackedEvent {
  return {
    name: 'navigation_click',
    payload: {
      ...basePayload(surface, routeKey),
      source,
      destination,
      module,
      source_role: sourceRole,
      destination_role: destinationRole,
      transition_kind: transitionKind,
    },
  };
}

export function buildCtaClickEvent({
  surface,
  routeKey,
  source,
  ctaId,
  destination,
  module,
  entityType,
  monthPresent,
  isExternal,
  sourceRole,
  destinationRole,
  transitionKind,
}: CtaClickInput): UmamiTrackedEvent {
  return {
    name: 'cta_click',
    payload: {
      ...basePayload(surface, routeKey),
      source,
      destination,
      module,
      cta_id: ctaId,
      entity_type: entityType,
      month_present: monthPresent,
      is_external: isExternal,
      source_role: sourceRole,
      destination_role: destinationRole,
      transition_kind: transitionKind,
    },
  };
}

export function buildDashboardModeChangeEvent({
  routeKey,
  mode,
  source,
}: DashboardModeChangeInput): UmamiTrackedEvent {
  return {
    name: 'dashboard_mode_change',
    payload: {
      ...basePayload('dashboard', routeKey),
      mode,
      source,
    },
  };
}

export function buildFilterChangeEvent({
  surface,
  routeKey,
  module,
  source,
  destination,
  monthPresent,
  period,
  timeWindow,
  resultCount,
}: FilterChangeInput): UmamiTrackedEvent {
  return {
    name: 'filter_change',
    payload: {
      ...basePayload(surface, routeKey),
      module,
      source,
      destination,
      month_present: monthPresent,
      period,
      time_window: timeWindow,
      result_count_bucket:
        typeof resultCount === 'number' ? getResultCountBucket(resultCount) : undefined,
    },
  };
}

export function buildEntitySelectEvent({
  surface,
  routeKey,
  entityType,
  source,
  module,
}: EntitySelectInput): UmamiTrackedEvent {
  return {
    name: 'entity_select',
    payload: {
      ...basePayload(surface, routeKey),
      entity_type: entityType,
      source,
      module,
    },
  };
}

export function buildPanelOpenEvent({
  surface,
  routeKey,
  module,
  source,
  destination,
}: PanelOpenInput): UmamiTrackedEvent {
  return {
    name: 'panel_open',
    payload: {
      ...basePayload(surface, routeKey),
      module,
      source,
      destination,
    },
  };
}

export function buildExportClickEvent({
  surface,
  routeKey,
  source,
  ctaId,
  entityType,
  module,
}: ExportClickInput): UmamiTrackedEvent {
  return {
    name: 'export_click',
    payload: {
      ...basePayload(surface, routeKey),
      source,
      cta_id: ctaId,
      entity_type: entityType,
      module,
    },
  };
}

export function buildLegacyInteractionEvent({
  eventName,
  pathname,
  eventData,
}: LegacyUmamiInteractionInput): UmamiTrackedEvent {
  const surface = surfaceFromPathname(pathname);
  const routeKey = resolveRouteKeyFromPathname(pathname);
  const source = readString(eventData, 'source') ?? routeKey;
  const destination = readString(eventData, 'destination');
  const monthPresent =
    readBoolean(eventData, 'month_present') ??
    Boolean(readString(eventData, 'month'));

  switch (eventName) {
    case 'related_module_click':
      return buildNavigationClickEvent({
        surface,
        routeKey,
        source,
        destination: destination ?? 'internal_module',
      });
    case 'station_card_click':
      return buildEntitySelectEvent({
        surface,
        routeKey,
        entityType: 'station',
        source,
        module: destination,
      });
    case 'api_cta_click':
      return buildCtaClickEvent({
        surface,
        routeKey,
        source,
        ctaId: 'api_open',
        destination,
        entityType: 'api',
      });
    case 'report_open_click':
      return buildCtaClickEvent({
        surface,
        routeKey,
        source,
        ctaId: 'report_open',
        destination,
        entityType: 'report',
        monthPresent,
      });
    case 'dataset_download_click':
      return buildExportClickEvent({
        surface,
        routeKey,
        source,
        ctaId: 'dataset_download',
        entityType: 'api',
        module: destination,
      });
    case 'dataset_source_click':
      return buildCtaClickEvent({
        surface,
        routeKey,
        source,
        ctaId: 'dataset_source_open',
        destination,
        isExternal: true,
      });
    case 'app_external_click':
      return buildCtaClickEvent({
        surface,
        routeKey,
        source,
        ctaId: 'app_external',
        destination,
        isExternal: true,
      });
    case 'ad_landing_primary_click':
      return buildCtaClickEvent({
        surface,
        routeKey,
        source,
        ctaId: 'landing_primary',
        destination,
      });
    case 'ad_landing_secondary_click':
      return buildCtaClickEvent({
        surface,
        routeKey,
        source,
        ctaId: 'landing_secondary',
        destination,
      });
    case 'home_cta_primary_click':
      return buildCtaClickEvent({
        surface,
        routeKey,
        source,
        ctaId: 'home_primary',
        destination,
      });
  }
}

export function trackUmamiEvent(event: UmamiTrackedEvent): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.umami?.track(event.name, sanitizeUmamiPayload(event.payload));
}
