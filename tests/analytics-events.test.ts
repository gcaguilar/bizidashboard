import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ANALYTICS_EVENT_CATALOG,
  buildBreadcrumbClickEvent,
  buildCopyActionEvent,
  buildCtaClickEvent,
  buildEntityDetailViewEvent,
  buildEntityFavoriteEvent,
  buildEntityRelatedViewEvent,
  buildEntitySelectEvent,
  buildExportResultEvent,
  buildFilterApplyEvent,
  buildFilterClearEvent,
  buildLegacyInteractionEvent,
  buildNavigationClickEvent,
  buildPanelCloseEvent,
  buildPublicPageViewEvent,
  buildQualityEvent,
  buildSearchClearEvent,
  buildSearchNoResultsEvent,
  buildSearchResultSelectEvent,
  buildSearchResultsViewEvent,
  buildSearchSubmitEvent,
  buildObservatoryEvent,
  buildShareActionEvent,
  buildSortChangeEvent,
  buildTabChangeEvent,
  buildViewModeChangeEvent,
  buildWorkflowEvent,
  getAnalyticsEventDefinition,
  getQueryLengthBucket,
  getResultCountBucket,
  resolveRouteKeyFromPathname,
  sanitizeAnalyticsPayload,
  type AnalyticsEventPayload,
  type AnalyticsTrackedEvent,
  type AnalyticsTrackedEventName,
} from '@/lib/analytics';

describe('analytics tracking helpers', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('sanitizes payloads using the GDPR allowlist', () => {
    const payload = sanitizeAnalyticsPayload({
      surface: 'public',
      route_key: 'home',
      source: 'hero',
      query_length_bucket: '3_5',
      source_role: 'hub',
      destination_role: 'dashboard',
      transition_kind: 'to_dashboard',
      path: '/should-not-leak',
      station_id: '123',
      empty: '',
      nullable: null,
    } as never);

    expect(payload).toEqual({
      surface: 'public',
      route_key: 'home',
      source: 'hero',
      query_length_bucket: '3_5',
      source_role: 'hub',
      destination_role: 'dashboard',
      transition_kind: 'to_dashboard',
    });
  });

  it('builds named observatory events without identifiers, location or URL parameters', () => {
    expect(buildObservatoryEvent('biciradar_handoff_clicked', { surface: 'public', routeKey: 'home', source: 'home_biciradar_handoff' })).toEqual({
      name: 'biciradar_handoff_clicked',
      payload: { surface: 'public', route_key: 'home', source: 'home_biciradar_handoff' },
    });
  });

  it('supports comparison and API observatory events', () => {
    expect(buildObservatoryEvent('comparison_validated_viewed', { surface: 'public', routeKey: 'compare', source: 'comparison_hub' }).name).toBe('comparison_validated_viewed');
    expect(buildObservatoryEvent('api_docs_opened', { surface: 'public', routeKey: 'developers', source: 'developers_hub' }).name).toBe('api_docs_opened');
  });

  it('builds public page views without raw path or slug fields', () => {
    expect(
      buildPublicPageViewEvent({
        routeKey: 'monthly_report',
        pageType: 'report',
        template: 'monthly_report',
      })
    ).toEqual({
      name: 'public_page_view',
      payload: {
        surface: 'public',
        route_key: 'monthly_report',
        page_type: 'report',
        template: 'monthly_report',
      },
    });
  });

  it('buckets search submissions without including the search text', () => {
    expect(getQueryLengthBucket(0)).toBe('0');
    expect(getQueryLengthBucket(2)).toBe('1_2');
    expect(getQueryLengthBucket(4)).toBe('3_5');
    expect(getQueryLengthBucket(9)).toBe('6_plus');
    expect(getResultCountBucket(0)).toBe('0');
    expect(getResultCountBucket(1)).toBe('1');
    expect(getResultCountBucket(4)).toBe('2_5');
    expect(getResultCountBucket(12)).toBe('6_20');
    expect(getResultCountBucket(30)).toBe('21_plus');

    expect(
      buildSearchSubmitEvent({
        surface: 'public',
        routeKey: 'explore',
        source: 'public_search',
        queryLength: 4,
        resultCount: 12,
      })
    ).toEqual({
      name: 'search_submit',
      payload: {
        surface: 'public',
        route_key: 'explore',
        source: 'public_search',
        query_present: true,
        query_length_bucket: '3_5',
        result_count_bucket: '6_20',
      },
    });
  });

  it('maps legacy station clicks to anonymous entity selection events', () => {
    const event = buildLegacyInteractionEvent({
      eventName: 'station_card_click',
      pathname: '/estadisticas-bizi-zaragoza',
      eventData: {
        source: 'insights_featured_stations',
        station_id: '401',
      },
    });

    expect(event).toEqual({
      name: 'entity_select',
      payload: {
        surface: 'public',
        route_key: 'insights_landing',
        entity_type: 'station',
        source: 'insights_featured_stations',
      },
    });
  });

  it('builds explicit entity selection events without leaking identifiers', () => {
    expect(
      buildEntitySelectEvent({
        surface: 'public',
        routeKey: 'monthly_report',
        entityType: 'station',
        source: 'monthly_report_top_stations',
      })
    ).toEqual({
      name: 'entity_select',
      payload: {
        surface: 'public',
        route_key: 'monthly_report',
        entity_type: 'station',
        source: 'monthly_report_top_stations',
      },
    });
  });

  it('resolves dashboard route keys for static and dynamic pages', () => {
    expect(resolveRouteKeyFromPathname('/dashboard')).toBe('dashboard_home');
    expect(resolveRouteKeyFromPathname('/dashboard/flujo')).toBe('dashboard_flow');
    expect(resolveRouteKeyFromPathname('/dashboard/estaciones/123')).toBe(
      'dashboard_station_detail'
    );
    expect(resolveRouteKeyFromPathname('/informes/2026-03')).toBe('monthly_report');
  });

  it('keeps navigation and CTA role metadata additive', () => {
    expect(
      buildNavigationClickEvent({
        surface: 'public',
        routeKey: 'explore',
        source: 'public_section_nav',
        destination: 'dashboard',
        module: 'public_nav_primary',
        sourceRole: 'hub',
        destinationRole: 'dashboard',
        transitionKind: 'to_dashboard',
      })
    ).toEqual({
      name: 'navigation_click',
      payload: {
        surface: 'public',
        route_key: 'explore',
        source: 'public_section_nav',
        destination: 'dashboard',
        module: 'public_nav_primary',
        source_role: 'hub',
        destination_role: 'dashboard',
        transition_kind: 'to_dashboard',
      },
    });

    expect(
      buildCtaClickEvent({
        surface: 'public',
        routeKey: 'utility_landing',
        source: 'utility_landing_hero',
        ctaId: 'utility_primary',
        destination: 'dashboard_overview',
        sourceRole: 'entry_seo',
        destinationRole: 'dashboard',
        transitionKind: 'to_dashboard',
      })
    ).toEqual({
      name: 'cta_click',
      payload: {
        surface: 'public',
        route_key: 'utility_landing',
        source: 'utility_landing_hero',
        destination: 'dashboard_overview',
        cta_id: 'utility_primary',
        source_role: 'entry_seo',
        destination_role: 'dashboard',
        transition_kind: 'to_dashboard',
      },
    });
  });
});

/**
 * Bloque G audit lockdown for the extended event catalog. Builders are the
 * only supported entry point, so every new event is checked against its own
 * catalog definition: allowed keys, required keys, and zero PII leakage.
 */
describe('extended analytics event catalog', () => {
  const ALL_TRACKED_NAMES: AnalyticsTrackedEventName[] = [
    'public_page_view',
    'dashboard_page_view',
    'navigation_click',
    'cta_click',
    'search_submit',
    'search_results_view',
    'search_no_results',
    'search_result_select',
    'search_clear',
    'dashboard_mode_change',
    'filter_change',
    'filter_apply',
    'filter_clear',
    'sort_change',
    'view_mode_change',
    'entity_select',
    'entity_detail_view',
    'entity_related_view',
    'entity_favorite_add',
    'entity_favorite_remove',
    'panel_open',
    'panel_close',
    'tab_change',
    'breadcrumb_click',
    'export_click',
    'export_success',
    'export_error',
    'share_action',
    'copy_action',
    'workflow_start',
    'workflow_step_complete',
    'workflow_complete',
    'workflow_abandon',
    'operation_error',
    'form_validation_error',
    'data_load_error',
    'empty_state_view',
    'feature_unavailable',
    'observatory_brief_viewed',
    'observatory_evidence_opened',
    'comparison_validated_viewed',
    'report_opened',
    'api_docs_opened',
    'biciradar_handoff_clicked',
    'feedback_rating',
  ];

  const CATEGORIES = [
    'discovery', 'navigation', 'exploration', 'content', 'actions', 'workflows', 'quality',
  ];
  const DASHBOARDS = [
    'product_overview',
    'search_discovery',
    'feature_adoption',
    'navigation_engagement',
    'ux_friction',
    'conversion_workflows',
  ];
  const FORBIDDEN_PROPERTY_NAMES = [
    'email', 'e-mail', 'name', 'first_name', 'last_name', 'phone', 'mobile',
    'query', 'search_text', 'text', 'input', 'value', 'free_text', 'token',
    'secret', 'password', 'api_key', 'address', 'station_id', 'entity_id',
    'user_id', 'path', 'url', '$set', '$set_once', '$ip',
  ];
  const HOSTILE_VALUES = [
    'alice@example.com',
    'Alice Example',
    '600000000',
    'phc_secret_token',
    'vecino particular',
    '401',
    '/dashboard/estaciones/401?edit=1',
  ];

  it('keeps catalog metadata consistent, complete and privacy-safe', () => {
    const definitions = Object.entries(ANALYTICS_EVENT_CATALOG);

    expect(definitions.length).toBeGreaterThanOrEqual(40);
    for (const name of ALL_TRACKED_NAMES) {
      expect(ANALYTICS_EVENT_CATALOG[name], `missing catalog entry: ${name}`).toBeDefined();
    }

    for (const [key, definition] of definitions) {
      expect(definition.name, `${key}: name`).toBe(key);
      expect(CATEGORIES, `${key}: category`).toContain(definition.category);
      expect(DASHBOARDS, `${key}: dashboard`).toContain(definition.dashboard);
      expect(definition.privacy, `${key}: privacy`).toBe('anonymous_aggregate');
      expect(definition.description.length, `${key}: description`).toBeGreaterThan(10);
      expect(definition.productQuestion.length, `${key}: productQuestion`).toBeGreaterThan(10);
      expect(definition.components.length, `${key}: components`).toBeGreaterThan(0);
      expect(new Set(definition.allowedProperties).size, `${key}: duplicate allowed properties`).toBe(
        definition.allowedProperties.length
      );
      expect(new Set(definition.requiredProperties).size, `${key}: duplicate required properties`).toBe(
        definition.requiredProperties.length
      );
      for (const required of definition.requiredProperties) {
        expect(definition.allowedProperties, `${key}: required ${required}`).toContain(required);
      }
      for (const forbidden of FORBIDDEN_PROPERTY_NAMES) {
        expect(definition.allowedProperties, `${key}: forbidden ${forbidden}`).not.toContain(forbidden);
      }
    }
  });

  it('exposes catalog definitions through getAnalyticsEventDefinition', () => {
    for (const name of ALL_TRACKED_NAMES) {
      expect(getAnalyticsEventDefinition(name)).toBe(ANALYTICS_EVENT_CATALOG[name]);
    }
  });

  type BuilderCase = {
    name: AnalyticsTrackedEventName;
    build: (input: never) => AnalyticsTrackedEvent;
    input: Record<string, unknown>;
    expected: AnalyticsEventPayload;
  };

  const BUILDER_CASES: BuilderCase[] = [
    {
      name: 'search_results_view',
      build: buildSearchResultsViewEvent,
      input: {
        surface: 'public', routeKey: 'explore', source: 'explore_hits',
        resultsCount: 12, searchType: 'bikes', section: 'results',
      },
      expected: {
        surface: 'public', route_key: 'explore', source: 'explore_hits',
        results_count: 12, has_results: true, result_count_bucket: '6_20',
        search_type: 'bikes', section: 'results',
      },
    },
    {
      name: 'search_no_results',
      build: buildSearchNoResultsEvent,
      input: {
        surface: 'dashboard', routeKey: 'dashboard_help', source: 'help_faq',
        queryLength: 0, searchType: 'help', section: 'faq',
      },
      expected: {
        surface: 'dashboard', route_key: 'dashboard_help', source: 'help_faq',
        query_length_bucket: '0', search_type: 'help', section: 'faq',
      },
    },
    {
      name: 'search_result_select',
      build: buildSearchResultSelectEvent,
      input: {
        surface: 'public', routeKey: 'explore', source: 'results_list',
        searchType: 'bikes', entityType: 'station', section: 'results', action: 'open',
      },
      expected: {
        surface: 'public', route_key: 'explore', source: 'results_list',
        search_type: 'bikes', entity_type: 'station', section: 'results', action: 'open',
      },
    },
    {
      name: 'search_clear',
      build: buildSearchClearEvent,
      input: {
        surface: 'dashboard', routeKey: 'dashboard_help', source: 'help_faq',
        searchType: 'help', section: 'faq',
      },
      expected: {
        surface: 'dashboard', route_key: 'dashboard_help', source: 'help_faq',
        search_type: 'help', section: 'faq',
      },
    },
    {
      name: 'filter_apply',
      build: buildFilterApplyEvent,
      input: {
        surface: 'dashboard', routeKey: 'dashboard_alerts', source: 'alerts_filter',
        module: 'history', filterCategory: 'severity', filterAction: 'apply',
        resultsCount: 7, section: 'list',
      },
      expected: {
        surface: 'dashboard', route_key: 'dashboard_alerts', source: 'alerts_filter',
        module: 'history', filter_category: 'severity', filter_action: 'apply',
        results_count: 7, section: 'list',
      },
    },
    {
      name: 'filter_clear',
      build: buildFilterClearEvent,
      input: {
        surface: 'dashboard', routeKey: 'dashboard_alerts', source: 'alerts_filter',
        module: 'history', filterCategory: 'severity', section: 'list',
      },
      expected: {
        surface: 'dashboard', route_key: 'dashboard_alerts', source: 'alerts_filter',
        module: 'history', filter_category: 'severity', section: 'list',
      },
    },
    {
      name: 'sort_change',
      build: buildSortChangeEvent,
      input: {
        surface: 'dashboard', routeKey: 'dashboard_stations', source: 'stations_table',
        sortKey: 'distance', module: 'table', section: 'list',
      },
      expected: {
        surface: 'dashboard', route_key: 'dashboard_stations', source: 'stations_table',
        sort_key: 'distance', module: 'table', section: 'list',
      },
    },
    {
      name: 'view_mode_change',
      build: buildViewModeChangeEvent,
      input: {
        surface: 'dashboard', routeKey: 'dashboard_flow', source: 'flow_toolbar',
        viewMode: 'chart', module: 'flow', section: 'viz',
      },
      expected: {
        surface: 'dashboard', route_key: 'dashboard_flow', source: 'flow_toolbar',
        view_mode: 'chart', module: 'flow', section: 'viz',
      },
    },
    {
      name: 'tab_change',
      build: buildTabChangeEvent,
      input: {
        surface: 'dashboard', routeKey: 'dashboard_redistribucion', source: 'rebalancing_tabs',
        tab: 'summary', module: 'tabs', action: 'select',
      },
      expected: {
        surface: 'dashboard', route_key: 'dashboard_redistribucion', source: 'rebalancing_tabs',
        tab: 'summary', module: 'tabs', action: 'select',
      },
    },
    {
      name: 'breadcrumb_click',
      build: buildBreadcrumbClickEvent,
      input: {
        surface: 'public', routeKey: 'monthly_report', source: 'report_breadcrumb',
        destination: 'report_archive', section: 'header',
      },
      expected: {
        surface: 'public', route_key: 'monthly_report', source: 'report_breadcrumb',
        destination: 'report_archive', section: 'header',
      },
    },
    {
      name: 'panel_close',
      build: buildPanelCloseEvent,
      input: {
        surface: 'dashboard', routeKey: 'dashboard_help', source: 'help_panel',
        module: 'faq', action: 'dismiss', panel: 'details',
      },
      expected: {
        surface: 'dashboard', route_key: 'dashboard_help', source: 'help_panel',
        module: 'faq', action: 'dismiss', panel: 'details',
      },
    },
    {
      name: 'entity_detail_view',
      build: buildEntityDetailViewEvent,
      input: {
        surface: 'public', routeKey: 'station_detail', entityType: 'station',
        source: 'station_card', section: 'details',
      },
      expected: {
        surface: 'public', route_key: 'station_detail', entity_type: 'station',
        source: 'station_card', section: 'details',
      },
    },
    {
      name: 'entity_related_view',
      build: buildEntityRelatedViewEvent,
      input: {
        surface: 'public', routeKey: 'station_detail', source: 'related_panel',
        entityType: 'district', action: 'open',
      },
      expected: {
        surface: 'public', route_key: 'station_detail', source: 'related_panel',
        entity_type: 'district', action: 'open',
      },
    },
    {
      name: 'entity_favorite_add',
      build: (input: never) => buildEntityFavoriteEvent('entity_favorite_add', input),
      input: {
        surface: 'dashboard', routeKey: 'dashboard_stations', entityType: 'station',
        source: 'favorite_button', module: 'list',
      },
      expected: {
        surface: 'dashboard', route_key: 'dashboard_stations', entity_type: 'station',
        source: 'favorite_button', module: 'list',
      },
    },
    {
      name: 'entity_favorite_remove',
      build: (input: never) => buildEntityFavoriteEvent('entity_favorite_remove', input),
      input: {
        surface: 'dashboard', routeKey: 'dashboard_stations', entityType: 'station',
        source: 'favorite_button', module: 'list',
      },
      expected: {
        surface: 'dashboard', route_key: 'dashboard_stations', entity_type: 'station',
        source: 'favorite_button', module: 'list',
      },
    },
    {
      name: 'export_success',
      build: (input: never) => buildExportResultEvent('export_success', input),
      input: {
        surface: 'dashboard', routeKey: 'monthly_report', source: 'export_bar',
        ctaId: 'download', module: 'reports', entityType: 'report',
        exportFormat: 'pdf', result: 'success',
      },
      expected: {
        surface: 'dashboard', route_key: 'monthly_report', source: 'export_bar',
        cta_id: 'download', module: 'reports', entity_type: 'report',
        export_format: 'pdf', result: 'success',
      },
    },
    {
      name: 'export_error',
      build: (input: never) => buildExportResultEvent('export_error', input),
      input: {
        surface: 'dashboard', routeKey: 'monthly_report', source: 'export_bar',
        ctaId: 'download', module: 'reports', entityType: 'report',
        exportFormat: 'csv', errorCategory: 'network',
      },
      expected: {
        surface: 'dashboard', route_key: 'monthly_report', source: 'export_bar',
        cta_id: 'download', module: 'reports',
        export_format: 'csv', error_category: 'network', result: 'error',
      },
    },
    {
      name: 'share_action',
      build: buildShareActionEvent,
      input: {
        surface: 'dashboard', routeKey: 'dashboard_help', source: 'share_button',
        channel: 'link', module: 'share', entityType: 'report', result: 'success',
      },
      expected: {
        surface: 'dashboard', route_key: 'dashboard_help', source: 'share_button',
        channel: 'link', module: 'share', entity_type: 'report', result: 'success',
      },
    },
    {
      name: 'copy_action',
      build: buildCopyActionEvent,
      input: {
        surface: 'dashboard', routeKey: 'dashboard_alerts', source: 'copy_button',
        module: 'table', ctaId: 'copy', result: 'success',
      },
      expected: {
        surface: 'dashboard', route_key: 'dashboard_alerts', source: 'copy_button',
        module: 'table', cta_id: 'copy', result: 'success',
      },
    },
    {
      name: 'workflow_start',
      build: (input: never) => buildWorkflowEvent('workflow_start', input),
      input: {
        surface: 'public', routeKey: 'planificar', source: 'plan_form',
        workflowName: 'planner', section: 'start', stepName: 'ignored_step',
      },
      expected: {
        surface: 'public', route_key: 'planificar', source: 'plan_form',
        workflow_name: 'planner', section: 'start',
      },
    },
    {
      name: 'workflow_step_complete',
      build: (input: never) => buildWorkflowEvent('workflow_step_complete', input),
      input: {
        surface: 'public', routeKey: 'planificar', source: 'plan_form',
        workflowName: 'planner', stepName: 'dates', stepNumber: 2,
        result: 'success', section: 'ignored_section',
      },
      expected: {
        surface: 'public', route_key: 'planificar', source: 'plan_form',
        workflow_name: 'planner', step_name: 'dates', step_number: 2, result: 'success',
      },
    },
    {
      name: 'workflow_complete',
      build: (input: never) => buildWorkflowEvent('workflow_complete', input),
      input: {
        surface: 'public', routeKey: 'planificar', source: 'plan_form',
        workflowName: 'planner', stepName: 'ignored_step', result: 'success',
      },
      expected: {
        surface: 'public', route_key: 'planificar', source: 'plan_form',
        workflow_name: 'planner', result: 'success',
      },
    },
    {
      name: 'workflow_abandon',
      build: (input: never) => buildWorkflowEvent('workflow_abandon', input),
      input: {
        surface: 'public', routeKey: 'planificar', source: 'plan_form',
        workflowName: 'planner', stepName: 'dates', result: 'abandon', section: 'ignored_section',
      },
      expected: {
        surface: 'public', route_key: 'planificar', source: 'plan_form',
        workflow_name: 'planner', step_name: 'dates', result: 'abandon',
      },
    },
    {
      name: 'operation_error',
      build: (input: never) => buildQualityEvent('operation_error', input),
      input: {
        surface: 'dashboard', routeKey: 'developers', source: 'registration',
        feature: 'api_key', section: 'form', operation: 'register', module: 'api',
        errorCategory: 'network', errorCode: 'NET_1', result: 'error',
      },
      expected: {
        surface: 'dashboard', route_key: 'developers', source: 'registration',
        feature: 'api_key', section: 'form', operation: 'register',
        error_category: 'network', error_code: 'NET_1', result: 'error',
      },
    },
    {
      name: 'form_validation_error',
      build: (input: never) => buildQualityEvent('form_validation_error', input),
      input: {
        surface: 'dashboard', routeKey: 'developers', source: 'registration',
        feature: 'api_key', section: 'form', operation: 'register',
        errorCategory: 'validation', errorCode: 'FORM_1', result: 'error',
      },
      expected: {
        surface: 'dashboard', route_key: 'developers', source: 'registration',
        feature: 'api_key', section: 'form', operation: 'register',
        error_category: 'validation', result: 'error',
      },
    },
    {
      name: 'data_load_error',
      build: (input: never) => buildQualityEvent('data_load_error', input),
      input: {
        surface: 'dashboard', routeKey: 'dashboard_alerts', source: 'alerts_view',
        module: 'table', feature: 'history', operation: 'load',
        errorCategory: 'network', result: 'error', section: 'ignored_section',
      },
      expected: {
        surface: 'dashboard', route_key: 'dashboard_alerts', source: 'alerts_view',
        module: 'table', feature: 'history', operation: 'load',
        error_category: 'network', result: 'error',
      },
    },
    {
      name: 'empty_state_view',
      build: (input: never) => buildQualityEvent('empty_state_view', input),
      input: {
        surface: 'dashboard', routeKey: 'dashboard_stations', source: 'stations_table',
        module: 'table', feature: 'directory', section: 'list', errorCategory: 'unknown',
      },
      expected: {
        surface: 'dashboard', route_key: 'dashboard_stations', source: 'stations_table',
        module: 'table', feature: 'directory', section: 'list',
      },
    },
    {
      name: 'feature_unavailable',
      build: (input: never) => buildQualityEvent('feature_unavailable', input),
      input: {
        surface: 'dashboard', routeKey: 'dashboard_redistribucion', source: 'rebalancing',
        feature: 'export', section: 'toolbar', result: 'unavailable',
        operation: 'ignored_operation', errorCategory: 'unknown', errorCode: 'X',
      },
      expected: {
        surface: 'dashboard', route_key: 'dashboard_redistribucion', source: 'rebalancing',
        feature: 'export', section: 'toolbar', result: 'unavailable',
      },
    },
  ];

  for (const testCase of BUILDER_CASES) {
    it(`${testCase.name}: emits only allowed properties with all required properties and no leaks`, () => {
      const definition = getAnalyticsEventDefinition(testCase.name);
      const hostileInput = {
        ...testCase.input,
        email: 'alice@example.com',
        name: 'Alice Example',
        phone: '600000000',
        token: 'phc_secret_token',
        query: 'vecino particular',
        station_id: '401',
        path: '/dashboard/estaciones/401?edit=1',
        url: 'https://example.com/?q=secret',
      };
      const event = testCase.build(hostileInput as never);
      const payload = event.payload ?? {};

      expect(event.name).toBe(testCase.name);
      expect(payload).toEqual(testCase.expected);

      for (const key of Object.keys(payload)) {
        expect(definition.allowedProperties, `${testCase.name}: ${key}`).toContain(key);
      }
      for (const required of definition.requiredProperties) {
        expect(payload, `${testCase.name}: missing ${required}`).toHaveProperty(required);
        expect((payload as Record<string, unknown>)[required]).toBeDefined();
      }

      const serialized = JSON.stringify(payload);
      for (const hostile of HOSTILE_VALUES) {
        expect(serialized, `${testCase.name}: leaked ${hostile}`).not.toContain(hostile);
      }
    });
  }

  it('drops unknown keys per event and email-shaped values from allowed keys', () => {
    const hostile = {
      surface: 'public',
      route_key: 'home',
      cta_id: 'home_primary',
      email: 'alice@example.com',
      query: 'vecino particular',
      token: 'phc_secret_token',
      station_id: '401',
      path: '/dashboard/estaciones/401?edit=1',
      $set: { email: 'alice@example.com' },
    };

    for (const name of ALL_TRACKED_NAMES) {
      const definition = getAnalyticsEventDefinition(name);
      const sanitized = sanitizeAnalyticsPayload(hostile as never, name) ?? {};
      const keys = Object.keys(sanitized);

      for (const key of keys) {
        expect(definition.allowedProperties, `${name}: ${key}`).toContain(key);
      }
      expect(keys).not.toContain('email');
      expect(keys).not.toContain('query');
      expect(keys).not.toContain('token');
      expect(keys).not.toContain('station_id');
      expect(keys).not.toContain('path');
      expect(keys).not.toContain('$set');

      const serialized = JSON.stringify(sanitized);
      for (const hostileValue of HOSTILE_VALUES) {
        expect(serialized, `${name}: leaked ${hostileValue}`).not.toContain(hostileValue);
      }
    }

    // `source` is allowed for search_submit, but its value is still PII-checked.
    expect(
      sanitizeAnalyticsPayload({ surface: 'public', source: 'alice@example.com' }, 'search_submit')
    ).toEqual({ surface: 'public' });
    // `cta_id` is allowed elsewhere, but not on search_submit.
    expect(
      sanitizeAnalyticsPayload({ route_key: 'home', cta_id: 'home_primary' }, 'search_submit')
    ).toEqual({ route_key: 'home' });
  });
});
