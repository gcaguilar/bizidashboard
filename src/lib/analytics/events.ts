import type { DashboardViewMode } from '@/lib/dashboard-modes';

/**
 * Central event dictionary for Bizi product analytics.
 *
 * Every event has a single stable snake_case name, a documented set of allowed
 * properties, a product question and a target dashboard. Builders are the only
 * supported way to create payloads, and `sanitizeAnalyticsPayload` is the final
 * validation barrier. Free text, entity IDs, emails and URL parameters are
 * never valid property values.
 */

export type AnalyticsEventValue = string | number | boolean | null | undefined;
export type AnalyticsSurface = 'public' | 'dashboard';
export type AnalyticsEntityType = 'station' | 'district' | 'report' | 'api' | 'help';
export type AnalyticsQueryLengthBucket = '0' | '1_2' | '3_5' | '6_plus';
export type AnalyticsResultCountBucket = '0' | '1' | '2_5' | '6_20' | '21_plus';
export type AnalyticsNavigationRole = 'home' | 'entry_seo' | 'hub' | 'detail' | 'dashboard' | 'utility';
export type AnalyticsEventCategory =
  | 'discovery'
  | 'navigation'
  | 'exploration'
  | 'content'
  | 'actions'
  | 'workflows'
  | 'quality';
export type AnalyticsDashboard =
  | 'product_overview'
  | 'search_discovery'
  | 'feature_adoption'
  | 'navigation_engagement'
  | 'ux_friction'
  | 'conversion_workflows';

export type AnalyticsTrackedEventName =
  | 'public_page_view'
  | 'dashboard_page_view'
  | 'navigation_click'
  | 'cta_click'
  | 'search_submit'
  | 'search_results_view'
  | 'search_no_results'
  | 'search_result_select'
  | 'search_clear'
  | 'dashboard_mode_change'
  | 'filter_change'
  | 'filter_apply'
  | 'filter_clear'
  | 'sort_change'
  | 'view_mode_change'
  | 'entity_select'
  | 'entity_detail_view'
  | 'entity_related_view'
  | 'entity_favorite_add'
  | 'entity_favorite_remove'
  | 'panel_open'
  | 'panel_close'
  | 'tab_change'
  | 'breadcrumb_click'
  | 'export_click'
  | 'export_success'
  | 'export_error'
  | 'share_action'
  | 'copy_action'
  | 'workflow_start'
  | 'workflow_step_complete'
  | 'workflow_complete'
  | 'workflow_abandon'
  | 'operation_error'
  | 'form_validation_error'
  | 'data_load_error'
  | 'empty_state_view'
  | 'feature_unavailable'
  | 'observatory_brief_viewed'
  | 'observatory_evidence_opened'
  | 'comparison_validated_viewed'
  | 'report_opened'
  | 'api_docs_opened'
  | 'biciradar_handoff_clicked'
  | 'feedback_rating';

export type LegacyAnalyticsInteractionName =
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
  | 'results_count'
  | 'has_results'
  | 'search_type'
  | 'section'
  | 'feature'
  | 'action'
  | 'filter_category'
  | 'filter_action'
  | 'sort_key'
  | 'view_mode'
  | 'tab'
  | 'panel'
  | 'channel'
  | 'export_format'
  | 'result'
  | 'error_category'
  | 'error_code'
  | 'operation'
  | 'workflow_name'
  | 'step_name'
  | 'step_number'
  | 'is_external'
  | 'source_role'
  | 'destination_role'
  | 'transition_kind'
  | 'rating';

export type AnalyticsEventPayload = Partial<Record<AllowedPayloadKey, AnalyticsEventValue>>;

export type AnalyticsTrackedEvent = {
  name: AnalyticsTrackedEventName;
  payload?: AnalyticsEventPayload;
};

export type AnalyticsEventDefinition = {
  name: AnalyticsTrackedEventName;
  description: string;
  category: AnalyticsEventCategory;
  components: readonly string[];
  allowedProperties: readonly AllowedPayloadKey[];
  requiredProperties: readonly AllowedPayloadKey[];
  productQuestion: string;
  dashboard: AnalyticsDashboard;
  /** Anonymous aggregate data only: never a person, account or device identity. */
  privacy: 'anonymous_aggregate';
};

function defineEvents<T extends Record<AnalyticsTrackedEventName, AnalyticsEventDefinition>>(
  catalog: T
): T {
  return catalog;
}

/**
 * Single source of truth. A property is only sent when its name appears in an
 * event's `allowedProperties` list, so no component can emit arbitrary fields.
 */
export const ANALYTICS_EVENT_CATALOG = defineEvents({
  public_page_view: {
    name: 'public_page_view',
    description: 'Custom view of a public page, with page type and template.',
    category: 'navigation',
    components: ['PublicPageViewTracker'],
    allowedProperties: ['surface', 'route_key', 'page_type', 'template'],
    requiredProperties: ['surface', 'route_key'],
    productQuestion: 'Which public page types are visited?',
    dashboard: 'navigation_engagement',
    privacy: 'anonymous_aggregate',
  },
  dashboard_page_view: {
    name: 'dashboard_page_view',
    description: 'Custom view of a dashboard section, with mode when present.',
    category: 'navigation',
    components: ['DashboardPageViewTracker'],
    allowedProperties: ['surface', 'route_key', 'page_type', 'template', 'mode'],
    requiredProperties: ['surface', 'route_key'],
    productQuestion: 'Which dashboard sections are used?',
    dashboard: 'navigation_engagement',
    privacy: 'anonymous_aggregate',
  },
  navigation_click: {
    name: 'navigation_click',
    description: 'Functional internal navigation between sections or tools.',
    category: 'navigation',
    components: ['TrackedLink', 'TrackedAnchor'],
    allowedProperties: [
      'surface', 'route_key', 'source', 'destination', 'module',
      'source_role', 'destination_role', 'transition_kind',
    ],
    requiredProperties: ['surface', 'route_key', 'source', 'destination'],
    productQuestion: 'Which areas of the product are used and in what order?',
    dashboard: 'navigation_engagement',
    privacy: 'anonymous_aggregate',
  },
  cta_click: {
    name: 'cta_click',
    description: 'A call to action was used.',
    category: 'actions',
    components: ['TrackedLink', 'TrackedAnchor', 'FeedbackCta', 'BetaBanner'],
    allowedProperties: [
      'surface', 'route_key', 'source', 'destination', 'module', 'cta_id',
      'entity_type', 'month_present', 'is_external', 'source_role',
      'destination_role', 'transition_kind',
    ],
    requiredProperties: ['surface', 'route_key', 'source', 'cta_id'],
    productQuestion: 'Which calls to action actually drive usage?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  search_submit: {
    name: 'search_submit',
    description: 'A search was submitted; only query length is bucketed.',
    category: 'discovery',
    components: ['PublicSearchForm'],
    allowedProperties: [
      'surface', 'route_key', 'source', 'query_present', 'query_length_bucket',
      'result_count_bucket', 'search_type',
    ],
    requiredProperties: ['surface', 'route_key', 'source'],
    productQuestion: 'Do users search, and how long are their queries?',
    dashboard: 'search_discovery',
    privacy: 'anonymous_aggregate',
  },
  search_results_view: {
    name: 'search_results_view',
    description: 'Search results were displayed, with a count bucket.',
    category: 'discovery',
    components: ['ExplorePage', 'HelpCenterClient'],
    allowedProperties: [
      'surface', 'route_key', 'source', 'search_type', 'results_count',
      'has_results', 'result_count_bucket', 'section',
    ],
    requiredProperties: ['surface', 'route_key', 'source', 'has_results'],
    productQuestion: 'Do searches return usable results?',
    dashboard: 'search_discovery',
    privacy: 'anonymous_aggregate',
  },
  search_no_results: {
    name: 'search_no_results',
    description: 'A search returned no results.',
    category: 'discovery',
    components: ['ExplorePage', 'HelpCenterClient'],
    allowedProperties: [
      'surface', 'route_key', 'source', 'search_type', 'query_length_bucket', 'section',
    ],
    requiredProperties: ['surface', 'route_key', 'source'],
    productQuestion: 'Where do searches fail to find anything?',
    dashboard: 'search_discovery',
    privacy: 'anonymous_aggregate',
  },
  search_result_select: {
    name: 'search_result_select',
    description: 'A result from a search was selected.',
    category: 'discovery',
    components: ['ExplorePage'],
    allowedProperties: [
      'surface', 'route_key', 'source', 'search_type', 'entity_type', 'section', 'action',
    ],
    requiredProperties: ['surface', 'route_key', 'source'],
    productQuestion: 'Do users pick the results they are shown?',
    dashboard: 'search_discovery',
    privacy: 'anonymous_aggregate',
  },
  search_clear: {
    name: 'search_clear',
    description: 'The active search was cleared.',
    category: 'discovery',
    components: ['HelpCenterClient'],
    allowedProperties: ['surface', 'route_key', 'source', 'search_type', 'section'],
    requiredProperties: ['surface', 'route_key', 'source'],
    productQuestion: 'Do users need to restart their search?',
    dashboard: 'search_discovery',
    privacy: 'anonymous_aggregate',
  },
  dashboard_mode_change: {
    name: 'dashboard_mode_change',
    description: 'Legacy dashboard view mode change (kept for continuity).',
    category: 'exploration',
    components: ['DashboardClient'],
    allowedProperties: ['surface', 'route_key', 'mode', 'source'],
    requiredProperties: ['route_key', 'mode'],
    productQuestion: 'Which dashboard modes are preferred?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  filter_change: {
    name: 'filter_change',
    description: 'A filter value changed.',
    category: 'exploration',
    components: ['MonthFilter', 'DashboardClient', 'StationsDirectory', 'RedistribucionClient'],
    allowedProperties: [
      'surface', 'route_key', 'module', 'source', 'destination', 'month_present',
      'period', 'time_window', 'result_count_bucket', 'filter_category', 'filter_action',
    ],
    requiredProperties: ['surface', 'route_key', 'module'],
    productQuestion: 'How do users explore and narrow information?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  filter_apply: {
    name: 'filter_apply',
    description: 'A set of filters was explicitly applied.',
    category: 'exploration',
    components: ['AlertsHistoryClient'],
    allowedProperties: [
      'surface', 'route_key', 'module', 'source', 'filter_category', 'filter_action',
      'results_count', 'section',
    ],
    requiredProperties: ['surface', 'route_key', 'source'],
    productQuestion: 'Do users apply filters deliberately?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  filter_clear: {
    name: 'filter_clear',
    description: 'All active filters were cleared.',
    category: 'exploration',
    components: ['AlertsHistoryClient'],
    allowedProperties: ['surface', 'route_key', 'module', 'source', 'filter_category', 'section'],
    requiredProperties: ['surface', 'route_key', 'source'],
    productQuestion: 'Are filters too complex to keep?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  sort_change: {
    name: 'sort_change',
    description: 'List ordering changed.',
    category: 'exploration',
    components: ['StationsDirectory'],
    allowedProperties: [
      'surface', 'route_key', 'module', 'source', 'sort_key', 'section', 'feature',
    ],
    requiredProperties: ['surface', 'route_key', 'source'],
    productQuestion: 'Which orderings do users prefer?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  view_mode_change: {
    name: 'view_mode_change',
    description: 'The visualization mode changed.',
    category: 'exploration',
    components: ['DashboardClient'],
    allowedProperties: ['surface', 'route_key', 'module', 'source', 'view_mode', 'section'],
    requiredProperties: ['surface', 'route_key', 'source'],
    productQuestion: 'Which visualizations are useful?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  entity_select: {
    name: 'entity_select',
    description: 'An entity was selected without exposing its identifier.',
    category: 'content',
    components: ['DashboardClient', 'TrackedLink', 'TrackedAnchor'],
    allowedProperties: ['surface', 'route_key', 'entity_type', 'source', 'module'],
    requiredProperties: ['surface', 'route_key', 'entity_type', 'source'],
    productQuestion: 'Which content types attract interest?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  entity_detail_view: {
    name: 'entity_detail_view',
    description: 'An entity detail view was opened.',
    category: 'content',
    components: ['StationDetailPanel', 'MonthlyReport'],
    allowedProperties: ['surface', 'route_key', 'entity_type', 'source', 'section'],
    requiredProperties: ['surface', 'route_key', 'entity_type'],
    productQuestion: 'Which details do users inspect?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  entity_related_view: {
    name: 'entity_related_view',
    description: 'Related content was opened from an entity.',
    category: 'content',
    components: ['StationDetailPanel'],
    allowedProperties: ['surface', 'route_key', 'entity_type', 'source', 'action'],
    requiredProperties: ['surface', 'route_key', 'source'],
    productQuestion: 'Do users follow related content paths?',
    dashboard: 'navigation_engagement',
    privacy: 'anonymous_aggregate',
  },
  entity_favorite_add: {
    name: 'entity_favorite_add',
    description: 'An entity was added to local favorites.',
    category: 'content',
    components: ['StationFavoriteButton', 'MapEngine', 'InteractiveComparePanel'],
    allowedProperties: ['surface', 'route_key', 'entity_type', 'source', 'module'],
    requiredProperties: ['surface', 'route_key', 'entity_type'],
    productQuestion: 'Which content do users want to keep?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  entity_favorite_remove: {
    name: 'entity_favorite_remove',
    description: 'An entity was removed from local favorites.',
    category: 'content',
    components: ['StationFavoriteButton', 'MapEngine', 'InteractiveComparePanel'],
    allowedProperties: ['surface', 'route_key', 'entity_type', 'source', 'module'],
    requiredProperties: ['surface', 'route_key', 'entity_type'],
    productQuestion: 'Which favorites lose relevance?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  panel_open: {
    name: 'panel_open',
    description: 'A panel, modal or accordion section was opened.',
    category: 'navigation',
    components: ['BetaBanner', 'ApiCatalogCard', 'HelpCenterClient'],
    allowedProperties: ['surface', 'route_key', 'module', 'source', 'destination', 'panel'],
    requiredProperties: ['surface', 'route_key', 'source'],
    productQuestion: 'Which secondary panels are discovered?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  panel_close: {
    name: 'panel_close',
    description: 'A panel, modal or accordion section was closed.',
    category: 'navigation',
    components: ['BetaBanner', 'FeedbackDialog'],
    allowedProperties: ['surface', 'route_key', 'module', 'source', 'action', 'panel'],
    requiredProperties: ['surface', 'route_key', 'source'],
    productQuestion: 'Are panels closed deliberately or abandoned?',
    dashboard: 'ux_friction',
    privacy: 'anonymous_aggregate',
  },
  tab_change: {
    name: 'tab_change',
    description: 'A functional tab changed.',
    category: 'navigation',
    components: ['RedistribucionClient'],
    allowedProperties: ['surface', 'route_key', 'module', 'source', 'tab', 'action'],
    requiredProperties: ['surface', 'route_key', 'source'],
    productQuestion: 'Which tabs get used after landing on a page?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  breadcrumb_click: {
    name: 'breadcrumb_click',
    description: 'Contextual breadcrumb navigation was used.',
    category: 'navigation',
    components: ['SiteBreadcrumbs'],
    allowedProperties: ['surface', 'route_key', 'source', 'destination', 'section'],
    requiredProperties: ['surface', 'route_key', 'source'],
    productQuestion: 'Do users rely on contextual navigation?',
    dashboard: 'navigation_engagement',
    privacy: 'anonymous_aggregate',
  },
  export_click: {
    name: 'export_click',
    description: 'An export was started.',
    category: 'actions',
    components: ['DataModeCard', 'ReportExportBar', 'RedistribucionClient', 'HelpCenterClient'],
    allowedProperties: [
      'surface', 'route_key', 'source', 'cta_id', 'module', 'entity_type',
      'export_format', 'destination',
    ],
    requiredProperties: ['surface', 'route_key', 'source', 'cta_id'],
    productQuestion: 'Which data do users want to take away?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  export_success: {
    name: 'export_success',
    description: 'A client-generated export completed successfully.',
    category: 'actions',
    components: ['ReportExportBar', 'RebalancingTable'],
    allowedProperties: [
      'surface', 'route_key', 'source', 'cta_id', 'module', 'entity_type', 'export_format', 'result',
    ],
    requiredProperties: ['surface', 'route_key', 'source'],
    productQuestion: 'Do exports finish successfully?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  export_error: {
    name: 'export_error',
    description: 'An export failed.',
    category: 'quality',
    components: ['ReportExportBar'],
    allowedProperties: [
      'surface', 'route_key', 'source', 'cta_id', 'module', 'export_format',
      'error_category', 'result',
    ],
    requiredProperties: ['surface', 'route_key', 'source'],
    productQuestion: 'Where do exports fail?',
    dashboard: 'ux_friction',
    privacy: 'anonymous_aggregate',
  },
  share_action: {
    name: 'share_action',
    description: 'Content was shared through a channel.',
    category: 'actions',
    components: ['ShareButton', 'WhatsAppShareLink', 'InteractiveComparePanel'],
    allowedProperties: [
      'surface', 'route_key', 'source', 'module', 'channel', 'result', 'entity_type',
    ],
    requiredProperties: ['surface', 'route_key', 'source', 'channel'],
    productQuestion: 'Which content is worth sharing?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  copy_action: {
    name: 'copy_action',
    description: 'Content was copied to the clipboard.',
    category: 'actions',
    components: ['ShareButton', 'AlertsHistoryClient', 'RebalancingTable', 'McpInstallGuide', 'DeveloperApiRegistration'],
    allowedProperties: ['surface', 'route_key', 'source', 'module', 'cta_id', 'result'],
    requiredProperties: ['surface', 'route_key', 'source'],
    productQuestion: 'Which data do users copy for their own use?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  workflow_start: {
    name: 'workflow_start',
    description: 'A relevant multi-step workflow started.',
    category: 'workflows',
    components: ['FeedbackDialog', 'DeveloperApiRegistration', 'PlanificarPage'],
    allowedProperties: ['surface', 'route_key', 'source', 'workflow_name', 'section'],
    requiredProperties: ['surface', 'route_key', 'workflow_name'],
    productQuestion: 'Which tasks do users attempt?',
    dashboard: 'conversion_workflows',
    privacy: 'anonymous_aggregate',
  },
  workflow_step_complete: {
    name: 'workflow_step_complete',
    description: 'A workflow step was completed.',
    category: 'workflows',
    components: ['FeedbackDialog', 'DeveloperApiRegistration'],
    allowedProperties: [
      'surface', 'route_key', 'source', 'workflow_name', 'step_name', 'step_number', 'result',
    ],
    requiredProperties: ['surface', 'route_key', 'workflow_name', 'step_name'],
    productQuestion: 'At which step do users progress?',
    dashboard: 'conversion_workflows',
    privacy: 'anonymous_aggregate',
  },
  workflow_complete: {
    name: 'workflow_complete',
    description: 'A workflow finished successfully.',
    category: 'workflows',
    components: ['DeveloperApiRegistration'],
    allowedProperties: ['surface', 'route_key', 'source', 'workflow_name', 'result'],
    requiredProperties: ['surface', 'route_key', 'workflow_name'],
    productQuestion: 'Which tasks do users finish?',
    dashboard: 'conversion_workflows',
    privacy: 'anonymous_aggregate',
  },
  workflow_abandon: {
    name: 'workflow_abandon',
    description: 'A workflow was abandoned before completion.',
    category: 'workflows',
    components: ['FeedbackDialog', 'BetaBanner'],
    allowedProperties: [
      'surface', 'route_key', 'source', 'workflow_name', 'step_name', 'result',
    ],
    requiredProperties: ['surface', 'route_key', 'workflow_name'],
    productQuestion: 'Where do users abandon tasks?',
    dashboard: 'conversion_workflows',
    privacy: 'anonymous_aggregate',
  },
  operation_error: {
    name: 'operation_error',
    description: 'An operation failed with an error category, without error text.',
    category: 'quality',
    components: ['DeveloperApiRegistration', 'PlanificarPage'],
    allowedProperties: [
      'surface', 'route_key', 'source', 'feature', 'section', 'operation',
      'error_category', 'error_code', 'result',
    ],
    requiredProperties: ['surface', 'route_key', 'operation', 'error_category'],
    productQuestion: 'Which operations fail in practice?',
    dashboard: 'ux_friction',
    privacy: 'anonymous_aggregate',
  },
  form_validation_error: {
    name: 'form_validation_error',
    description: 'A form failed local validation, without any field content.',
    category: 'quality',
    components: ['DeveloperApiRegistration', 'PlanificarPage'],
    allowedProperties: [
      'surface', 'route_key', 'source', 'feature', 'section', 'operation',
      'error_category', 'result',
    ],
    requiredProperties: ['surface', 'route_key', 'error_category'],
    productQuestion: 'Where do forms block users?',
    dashboard: 'ux_friction',
    privacy: 'anonymous_aggregate',
  },
  data_load_error: {
    name: 'data_load_error',
    description: 'A data query failed to load.',
    category: 'quality',
    components: ['AlertsHistoryClient', 'RedistribucionClient', 'DashboardClient'],
    allowedProperties: [
      'surface', 'route_key', 'module', 'source', 'feature', 'operation',
      'error_category', 'result',
    ],
    requiredProperties: ['surface', 'route_key', 'source'],
    productQuestion: 'Which data views fail to load?',
    dashboard: 'ux_friction',
    privacy: 'anonymous_aggregate',
  },
  empty_state_view: {
    name: 'empty_state_view',
    description: 'An empty state was displayed to the user.',
    category: 'quality',
    components: ['StationsDirectory', 'AlertsHistoryClient', 'HelpCenterClient'],
    allowedProperties: ['surface', 'route_key', 'module', 'source', 'feature', 'section'],
    requiredProperties: ['surface', 'route_key', 'source'],
    productQuestion: 'Where do users hit dead ends?',
    dashboard: 'ux_friction',
    privacy: 'anonymous_aggregate',
  },
  feature_unavailable: {
    name: 'feature_unavailable',
    description: 'A feature could not be used in this deployment or session.',
    category: 'quality',
    components: ['DeveloperApiRegistration', 'RedistribucionClient'],
    allowedProperties: ['surface', 'route_key', 'source', 'feature', 'section', 'result'],
    requiredProperties: ['surface', 'route_key', 'source', 'feature'],
    productQuestion: 'Which capabilities are blocked for users?',
    dashboard: 'ux_friction',
    privacy: 'anonymous_aggregate',
  },
  observatory_brief_viewed: {
    name: 'observatory_brief_viewed',
    description: 'A network briefing was viewed.',
    category: 'content',
    components: ['NetworkBriefingViewTracker'],
    allowedProperties: ['surface', 'route_key', 'source'],
    requiredProperties: ['surface', 'route_key'],
    productQuestion: 'Do users read the network briefing?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  observatory_evidence_opened: {
    name: 'observatory_evidence_opened',
    description: 'Supporting evidence for a briefing was opened.',
    category: 'content',
    components: ['ObservatoryEventTracker'],
    allowedProperties: ['surface', 'route_key', 'source'],
    requiredProperties: ['surface', 'route_key'],
    productQuestion: 'Do users inspect the evidence behind a claim?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  comparison_validated_viewed: {
    name: 'comparison_validated_viewed',
    description: 'A validated comparison was viewed.',
    category: 'content',
    components: ['ObservatoryEventTracker'],
    allowedProperties: ['surface', 'route_key', 'source'],
    requiredProperties: ['surface', 'route_key'],
    productQuestion: 'Which comparisons are consulted?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  report_opened: {
    name: 'report_opened',
    description: 'A monthly report was opened.',
    category: 'content',
    components: ['ObservatoryEventTracker'],
    allowedProperties: ['surface', 'route_key', 'source'],
    requiredProperties: ['surface', 'route_key'],
    productQuestion: 'Are monthly reports read?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  api_docs_opened: {
    name: 'api_docs_opened',
    description: 'API documentation was opened.',
    category: 'content',
    components: ['ObservatoryEventTracker'],
    allowedProperties: ['surface', 'route_key', 'source'],
    requiredProperties: ['surface', 'route_key'],
    productQuestion: 'Is the public API discovered?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  biciradar_handoff_clicked: {
    name: 'biciradar_handoff_clicked',
    description: 'A handoff to BiciRadar was used.',
    category: 'actions',
    components: ['BetaBanner'],
    allowedProperties: ['surface', 'route_key', 'source'],
    requiredProperties: ['surface', 'route_key'],
    productQuestion: 'Does the BiciRadar handoff work?',
    dashboard: 'feature_adoption',
    privacy: 'anonymous_aggregate',
  },
  feedback_rating: {
    name: 'feedback_rating',
    description: 'A one-click satisfaction rating was submitted.',
    category: 'actions',
    components: ['FeedbackDialog'],
    allowedProperties: ['surface', 'route_key', 'source', 'module', 'rating'],
    requiredProperties: ['surface', 'route_key', 'rating'],
    productQuestion: 'How do users perceive the product?',
    dashboard: 'ux_friction',
    privacy: 'anonymous_aggregate',
  },
});

export type AnalyticsEventDefinitionByName = typeof ANALYTICS_EVENT_CATALOG[AnalyticsTrackedEventName];

const ALL_ALLOWED_PAYLOAD_KEYS = Object.values(ANALYTICS_EVENT_CATALOG).flatMap(
  (definition) => definition.allowedProperties
) as AllowedPayloadKey[];

const ALL_ALLOWED_PAYLOAD_KEY_SET = new Set<string>(ALL_ALLOWED_PAYLOAD_KEYS);
/** Unanchored on purpose: an email embedded in a longer value is still PII. */
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const MAX_STRING_LENGTH = 160;
/** Identifiers are short, single tokens; free text, paths and URLs never match. */
const SAFE_TOKEN_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}_.:-]{0,63}$/u;
const PURE_DIGITS_PATTERN = /^\d+$/;
const LONG_DIGITS_PATTERN = /\d{8,}/;
const SUSPICIOUS_STRING_PATTERN = /[\s?&#=%@/\\<>|`"'\p{Cc}]/u;
const TOKEN_PREFIX_PATTERN = /^(phc|phx|sk|pk|rk|ghp|gho|github_pat|bearer)[_-]/i;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Closed value sets used by the builders; anything else is discarded. */
const ENUM_PROPERTY_VALUES: Partial<Record<AllowedPayloadKey, ReadonlySet<string>>> = {
  surface: new Set(['public', 'dashboard']),
  mode: new Set(['overview', 'operations', 'research', 'data']),
  entity_type: new Set(['station', 'district', 'report', 'api', 'help']),
  query_length_bucket: new Set(['0', '1_2', '3_5', '6_plus']),
  result_count_bucket: new Set(['0', '1', '2_5', '6_20', '21_plus']),
  source_role: new Set(['home', 'entry_seo', 'hub', 'detail', 'dashboard', 'utility']),
  destination_role: new Set(['home', 'entry_seo', 'hub', 'detail', 'dashboard', 'utility']),
  export_format: new Set(['pdf', 'csv', 'json', 'png']),
  result: new Set(['success', 'fallback', 'error', 'cancel', 'abandon', 'unavailable', 'empty']),
  error_category: new Set(['network', 'render', 'validation', 'permission', 'unknown']),
  channel: new Set(['web_share', 'whatsapp', 'link']),
  rating: new Set(['positive', 'negative']),
};

/** Numeric properties are bounded so a runaway count cannot become an identifier. */
const NUMERIC_PROPERTY_RANGES: Partial<Record<AllowedPayloadKey, readonly [number, number]>> = {
  results_count: [0, 1_000_000],
  step_number: [1, 1000],
};

export function getAnalyticsEventDefinition(
  name: AnalyticsTrackedEventName
): AnalyticsEventDefinition {
  return ANALYTICS_EVENT_CATALOG[name];
}

function basePayload(surface: AnalyticsSurface, routeKey: string): AnalyticsEventPayload {
  return {
    surface,
    route_key: routeKey,
  };
}

function readString(
  payload: Record<string, AnalyticsEventValue> | undefined,
  key: string
): string | undefined {
  const value = payload?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

/** Guarantees a required token is present without ever inventing free text. */
function requiredToken(value: string | undefined, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function readBoolean(
  payload: Record<string, AnalyticsEventValue> | undefined,
  key: string
): boolean | undefined {
  const value = payload?.[key];
  return typeof value === 'boolean' ? value : undefined;
}

function surfaceFromPathname(pathname: string | null | undefined): AnalyticsSurface {
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

export function getQueryLengthBucket(length: number): AnalyticsQueryLengthBucket {
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

export function getResultCountBucket(count: number): AnalyticsResultCountBucket {
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

/**
 * Validates and sanitizes a payload. When `eventName` is supplied, only the
 * properties declared for that event in the catalog are accepted.
 */
export function sanitizeAnalyticsPayload(
  payload: Record<string, AnalyticsEventValue> | undefined,
  eventName?: AnalyticsTrackedEventName
): AnalyticsEventPayload | undefined {
  if (!payload) {
    return undefined;
  }

  const allowedKeys = eventName
    ? new Set<string>(ANALYTICS_EVENT_CATALOG[eventName]?.allowedProperties ?? [])
    : ALL_ALLOWED_PAYLOAD_KEY_SET;

  const sanitizedEntries = Object.entries(payload).filter(([key, value]) => {
    if (!allowedKeys.has(key) || value === undefined || value === null) {
      return false;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length === 0 || trimmed.length > MAX_STRING_LENGTH) {
        return false;
      }

      // Free text, emails, URLs, query strings, tokens and identifiers are
      // never valid analytics values, whatever the key is.
      if (
        EMAIL_PATTERN.test(trimmed) ||
        SUSPICIOUS_STRING_PATTERN.test(trimmed) ||
        TOKEN_PREFIX_PATTERN.test(trimmed) ||
        UUID_PATTERN.test(trimmed) ||
        LONG_DIGITS_PATTERN.test(trimmed)
      ) {
        return false;
      }

      const enumValues = ENUM_PROPERTY_VALUES[key as AllowedPayloadKey];
      if (enumValues) {
        return enumValues.has(trimmed);
      }

      // Identifier-like keys also reject bare numeric IDs ("401", station or
      // entity identifiers) and anything that is not a single safe token.
      return !PURE_DIGITS_PATTERN.test(trimmed) && SAFE_TOKEN_PATTERN.test(trimmed);
    }

    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        return false;
      }
      const range = NUMERIC_PROPERTY_RANGES[key as AllowedPayloadKey];
      return !range || (Number.isInteger(value) && value >= range[0] && value <= range[1]);
    }

    // Booleans are the only other primitive accepted in an analytics payload;
    // arrays, objects, functions, symbols and bigints are all rejected.
    return typeof value === 'boolean';
  });

  if (sanitizedEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(
    sanitizedEntries.map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
  );
}

function buildEvent(
  name: AnalyticsTrackedEventName,
  payload: AnalyticsEventPayload | undefined
): AnalyticsTrackedEvent {
  return { name, payload: sanitizeAnalyticsPayload(payload, name) };
}

export function buildObservatoryEvent(
  name: Extract<
    AnalyticsTrackedEventName,
    | 'observatory_brief_viewed'
    | 'observatory_evidence_opened'
    | 'comparison_validated_viewed'
    | 'report_opened'
    | 'api_docs_opened'
    | 'biciradar_handoff_clicked'
  >,
  input: { surface: AnalyticsSurface; routeKey: string; source: string }
): AnalyticsTrackedEvent {
  return buildEvent(name, { ...basePayload(input.surface, input.routeKey), source: input.source });
}

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
  surface: AnalyticsSurface;
  routeKey: string;
  source: string;
  queryLength: number;
  resultCount?: number | null;
  searchType?: string;
};

export type SearchResultsViewInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  source: string;
  resultsCount: number;
  searchType?: string;
  section?: string;
};

export type SearchNoResultsInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  source: string;
  queryLength?: number;
  searchType?: string;
  section?: string;
};

export type SearchResultSelectInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  source: string;
  searchType?: string;
  entityType?: AnalyticsEntityType;
  section?: string;
  action?: string;
};

export type SearchClearInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  source: string;
  searchType?: string;
  section?: string;
};

export type NavigationClickInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  source: string;
  destination: string;
  module?: string;
  sourceRole?: AnalyticsNavigationRole;
  destinationRole?: AnalyticsNavigationRole;
  transitionKind?: string;
};

export type CtaClickInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  source: string;
  ctaId: string;
  destination?: string;
  module?: string;
  entityType?: AnalyticsEntityType;
  monthPresent?: boolean;
  isExternal?: boolean;
  sourceRole?: AnalyticsNavigationRole;
  destinationRole?: AnalyticsNavigationRole;
  transitionKind?: string;
};

export type EntitySelectInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  entityType: AnalyticsEntityType;
  source: string;
  module?: string;
};

type DashboardModeChangeInput = {
  routeKey: string;
  mode: DashboardViewMode;
  source?: string;
};

type FilterChangeInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  module: string;
  source?: string;
  destination?: string;
  monthPresent?: boolean;
  period?: string;
  timeWindow?: string;
  resultCount?: number | null;
  filterCategory?: string;
  filterAction?: string;
};

export type FilterApplyInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  source: string;
  module?: string;
  filterCategory?: string;
  filterAction?: string;
  resultsCount?: number;
  section?: string;
};

type PanelOpenInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  module: string;
  source?: string;
  destination?: string;
  panel?: string;
};

export type PanelCloseInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  source: string;
  module?: string;
  action?: string;
  panel?: string;
};

export type TabChangeInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  source: string;
  tab: string;
  module?: string;
  action?: string;
};

export type BreadcrumbClickInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  source: string;
  destination: string;
  section?: string;
};

export type SortChangeInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  source: string;
  sortKey: string;
  module?: string;
  section?: string;
};

export type ViewModeChangeInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  source: string;
  viewMode: string;
  module?: string;
  section?: string;
};

export type EntityDetailViewInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  entityType: AnalyticsEntityType;
  source?: string;
  section?: string;
};

export type EntityRelatedViewInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  source: string;
  entityType?: AnalyticsEntityType;
  action?: string;
};

export type EntityFavoriteInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  entityType: AnalyticsEntityType;
  source?: string;
  module?: string;
};

export type ExportResultInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  source: string;
  ctaId?: string;
  module?: string;
  entityType?: AnalyticsEntityType;
  exportFormat?: 'pdf' | 'csv' | 'json' | 'png';
  result?: 'success' | 'fallback';
  errorCategory?: 'network' | 'render' | 'validation' | 'unknown';
};

export type ShareActionInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  source: string;
  channel: 'web_share' | 'whatsapp' | 'link';
  module?: string;
  entityType?: AnalyticsEntityType;
  result?: 'success' | 'cancel' | 'error';
};

export type CopyActionInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  source: string;
  module?: string;
  ctaId?: string;
  result?: 'success' | 'error';
};

export type WorkflowEventInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  source?: string;
  workflowName: string;
  stepName?: string;
  stepNumber?: number;
  result?: 'success' | 'error' | 'abandon';
  section?: string;
};

export type QualityEventInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  source: string;
  feature?: string;
  section?: string;
  operation?: string;
  module?: string;
  errorCategory?: 'network' | 'validation' | 'render' | 'permission' | 'unknown';
  errorCode?: string;
  result?: 'error' | 'unavailable' | 'empty';
};

type ExportClickInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  source: string;
  ctaId: string;
  entityType?: AnalyticsEntityType;
  module?: string;
  exportFormat?: 'pdf' | 'csv' | 'json' | 'png';
};

type LegacyAnalyticsInteractionInput = {
  eventName: LegacyAnalyticsInteractionName;
  pathname?: string | null;
  eventData?: Record<string, AnalyticsEventValue>;
};

export function buildPublicPageViewEvent({
  routeKey,
  pageType,
  template,
}: PublicPageViewInput): AnalyticsTrackedEvent {
  return buildEvent('public_page_view', {
    ...basePayload('public', routeKey),
    page_type: pageType,
    template,
  });
}

export function buildDashboardPageViewEvent({
  routeKey,
  pageType,
  template,
  mode,
}: DashboardPageViewInput): AnalyticsTrackedEvent {
  return buildEvent('dashboard_page_view', {
    ...basePayload('dashboard', routeKey),
    page_type: pageType,
    template,
    mode,
  });
}

export function buildSearchSubmitEvent({
  surface,
  routeKey,
  source,
  queryLength,
  resultCount,
  searchType,
}: SearchSubmitInput): AnalyticsTrackedEvent {
  return buildEvent('search_submit', {
    ...basePayload(surface, routeKey),
    source,
    query_present: queryLength > 0,
    query_length_bucket: getQueryLengthBucket(queryLength),
    result_count_bucket:
      typeof resultCount === 'number' ? getResultCountBucket(resultCount) : undefined,
    search_type: searchType,
  });
}

export function buildSearchResultsViewEvent({
  surface,
  routeKey,
  source,
  resultsCount,
  searchType,
  section,
}: SearchResultsViewInput): AnalyticsTrackedEvent {
  return buildEvent('search_results_view', {
    ...basePayload(surface, routeKey),
    source,
    results_count: resultsCount,
    has_results: resultsCount > 0,
    result_count_bucket: getResultCountBucket(resultsCount),
    search_type: searchType,
    section,
  });
}

export function buildSearchNoResultsEvent({
  surface,
  routeKey,
  source,
  queryLength,
  searchType,
  section,
}: SearchNoResultsInput): AnalyticsTrackedEvent {
  return buildEvent('search_no_results', {
    ...basePayload(surface, routeKey),
    source,
    query_length_bucket: typeof queryLength === 'number' ? getQueryLengthBucket(queryLength) : undefined,
    search_type: searchType,
    section,
  });
}

export function buildSearchResultSelectEvent({
  surface,
  routeKey,
  source,
  searchType,
  entityType,
  section,
  action,
}: SearchResultSelectInput): AnalyticsTrackedEvent {
  return buildEvent('search_result_select', {
    ...basePayload(surface, routeKey),
    source,
    search_type: searchType,
    entity_type: entityType,
    section,
    action,
  });
}

export function buildSearchClearEvent({
  surface,
  routeKey,
  source,
  searchType,
  section,
}: SearchClearInput): AnalyticsTrackedEvent {
  return buildEvent('search_clear', {
    ...basePayload(surface, routeKey),
    source,
    search_type: searchType,
    section,
  });
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
}: NavigationClickInput): AnalyticsTrackedEvent {
  return buildEvent('navigation_click', {
    ...basePayload(surface, routeKey),
    source,
    destination,
    module,
    source_role: sourceRole,
    destination_role: destinationRole,
    transition_kind: transitionKind,
  });
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
}: CtaClickInput): AnalyticsTrackedEvent {
  return buildEvent('cta_click', {
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
  });
}

export type FeedbackRatingInput = {
  surface: AnalyticsSurface;
  routeKey: string;
  source: string;
  rating: 'positive' | 'negative';
  module?: string;
};

export function buildFeedbackRatingEvent({
  surface,
  routeKey,
  source,
  rating,
  module,
}: FeedbackRatingInput): AnalyticsTrackedEvent {
  return buildEvent('feedback_rating', {
    ...basePayload(surface, routeKey),
    source,
    module,
    rating,
  });
}

export function buildDashboardModeChangeEvent({
  routeKey,
  mode,
  source,
}: DashboardModeChangeInput): AnalyticsTrackedEvent {
  return buildEvent('dashboard_mode_change', {
    ...basePayload('dashboard', routeKey),
    mode,
    source,
  });
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
  filterCategory,
  filterAction,
}: FilterChangeInput): AnalyticsTrackedEvent {
  return buildEvent('filter_change', {
    ...basePayload(surface, routeKey),
    module,
    source,
    destination,
    month_present: monthPresent,
    period,
    time_window: timeWindow,
    result_count_bucket:
      typeof resultCount === 'number' ? getResultCountBucket(resultCount) : undefined,
    filter_category: filterCategory,
    filter_action: filterAction,
  });
}

export function buildFilterApplyEvent({
  surface,
  routeKey,
  source,
  module,
  filterCategory,
  filterAction,
  resultsCount,
  section,
}: FilterApplyInput): AnalyticsTrackedEvent {
  return buildEvent('filter_apply', {
    ...basePayload(surface, routeKey),
    source,
    module,
    filter_category: filterCategory,
    filter_action: filterAction,
    results_count: resultsCount,
    section,
  });
}

export function buildFilterClearEvent({
  surface,
  routeKey,
  source,
  module,
  filterCategory,
  section,
}: Omit<FilterApplyInput, 'filterAction' | 'resultsCount'>): AnalyticsTrackedEvent {
  return buildEvent('filter_clear', {
    ...basePayload(surface, routeKey),
    source,
    module,
    filter_category: filterCategory,
    section,
  });
}

export function buildSortChangeEvent({
  surface,
  routeKey,
  source,
  sortKey,
  module,
  section,
}: SortChangeInput): AnalyticsTrackedEvent {
  return buildEvent('sort_change', {
    ...basePayload(surface, routeKey),
    source,
    sort_key: sortKey,
    module,
    section,
  });
}

export function buildViewModeChangeEvent({
  surface,
  routeKey,
  source,
  viewMode,
  module,
  section,
}: ViewModeChangeInput): AnalyticsTrackedEvent {
  return buildEvent('view_mode_change', {
    ...basePayload(surface, routeKey),
    source,
    view_mode: viewMode,
    module,
    section,
  });
}

export function buildEntitySelectEvent({
  surface,
  routeKey,
  entityType,
  source,
  module,
}: EntitySelectInput): AnalyticsTrackedEvent {
  return buildEvent('entity_select', {
    ...basePayload(surface, routeKey),
    entity_type: entityType,
    source,
    module,
  });
}

export function buildEntityDetailViewEvent({
  surface,
  routeKey,
  entityType,
  source,
  section,
}: EntityDetailViewInput): AnalyticsTrackedEvent {
  return buildEvent('entity_detail_view', {
    ...basePayload(surface, routeKey),
    entity_type: entityType,
    source,
    section,
  });
}

export function buildEntityRelatedViewEvent({
  surface,
  routeKey,
  source,
  entityType,
  action,
}: EntityRelatedViewInput): AnalyticsTrackedEvent {
  return buildEvent('entity_related_view', {
    ...basePayload(surface, routeKey),
    source,
    entity_type: entityType,
    action,
  });
}

export function buildEntityFavoriteEvent(
  eventName: 'entity_favorite_add' | 'entity_favorite_remove',
  { surface, routeKey, entityType, source, module }: EntityFavoriteInput
): AnalyticsTrackedEvent {
  return buildEvent(eventName, {
    ...basePayload(surface, routeKey),
    entity_type: entityType,
    source,
    module,
  });
}

export function buildPanelOpenEvent({
  surface,
  routeKey,
  module,
  source,
  destination,
  panel,
}: PanelOpenInput): AnalyticsTrackedEvent {
  return buildEvent('panel_open', {
    ...basePayload(surface, routeKey),
    module,
    source: requiredToken(source, 'unknown'),
    destination,
    panel,
  });
}

export function buildPanelCloseEvent({
  surface,
  routeKey,
  source,
  module,
  action,
  panel,
}: PanelCloseInput): AnalyticsTrackedEvent {
  return buildEvent('panel_close', {
    ...basePayload(surface, routeKey),
    source,
    module,
    action,
    panel,
  });
}

export function buildTabChangeEvent({
  surface,
  routeKey,
  source,
  tab,
  module,
  action,
}: TabChangeInput): AnalyticsTrackedEvent {
  return buildEvent('tab_change', {
    ...basePayload(surface, routeKey),
    source,
    tab,
    module,
    action,
  });
}

export function buildBreadcrumbClickEvent({
  surface,
  routeKey,
  source,
  destination,
  section,
}: BreadcrumbClickInput): AnalyticsTrackedEvent {
  return buildEvent('breadcrumb_click', {
    ...basePayload(surface, routeKey),
    source,
    destination,
    section,
  });
}

export function buildExportClickEvent({
  surface,
  routeKey,
  source,
  ctaId,
  entityType,
  module,
  exportFormat,
}: ExportClickInput): AnalyticsTrackedEvent {
  return buildEvent('export_click', {
    ...basePayload(surface, routeKey),
    source,
    cta_id: ctaId,
    entity_type: entityType,
    module,
    export_format: exportFormat,
  });
}

export function buildExportResultEvent(
  eventName: 'export_success' | 'export_error',
  {
    surface,
    routeKey,
    source,
    ctaId,
    module,
    entityType,
    exportFormat,
    result,
    errorCategory,
  }: ExportResultInput
): AnalyticsTrackedEvent {
  const payload: AnalyticsEventPayload =
    eventName === 'export_success'
      ? {
          ...basePayload(surface, routeKey), source, cta_id: ctaId, module,
          entity_type: entityType, export_format: exportFormat, result,
        }
      : {
          ...basePayload(surface, routeKey), source, cta_id: ctaId, module,
          export_format: exportFormat, error_category: requiredToken(errorCategory, 'unknown'), result: 'error',
        };

  return buildEvent(eventName, payload);
}

export function buildShareActionEvent({
  surface,
  routeKey,
  source,
  channel,
  module,
  entityType,
  result,
}: ShareActionInput): AnalyticsTrackedEvent {
  return buildEvent('share_action', {
    ...basePayload(surface, routeKey),
    source,
    channel,
    module,
    entity_type: entityType,
    result,
  });
}

export function buildCopyActionEvent({
  surface,
  routeKey,
  source,
  module,
  ctaId,
  result,
}: CopyActionInput): AnalyticsTrackedEvent {
  return buildEvent('copy_action', {
    ...basePayload(surface, routeKey),
    source,
    module,
    cta_id: ctaId,
    result,
  });
}

export function buildWorkflowEvent(
  eventName: 'workflow_start' | 'workflow_step_complete' | 'workflow_complete' | 'workflow_abandon',
  {
    surface,
    routeKey,
    source,
    workflowName,
    stepName,
    stepNumber,
    result,
    section,
  }: WorkflowEventInput
): AnalyticsTrackedEvent {
  const stepNameForEvent =
    eventName === 'workflow_start'
      ? undefined
      : eventName === 'workflow_step_complete'
        ? requiredToken(stepName, 'unknown')
        : stepName;

  return buildEvent(eventName, {
    ...basePayload(surface, routeKey),
    source,
    workflow_name: workflowName,
    step_name: stepNameForEvent,
    step_number: eventName === 'workflow_step_complete' ? stepNumber : undefined,
    // `result` is not part of workflow_start's allowed properties.
    result: eventName === 'workflow_start' ? undefined : result,
    section: eventName === 'workflow_start' ? section : undefined,
  });
}

export function buildQualityEvent(
  eventName:
    | 'operation_error'
    | 'form_validation_error'
    | 'data_load_error'
    | 'empty_state_view'
    | 'feature_unavailable',
  {
    surface,
    routeKey,
    source,
    feature,
    section,
    operation,
    module,
    errorCategory,
    errorCode,
    result,
  }: QualityEventInput
): AnalyticsTrackedEvent {
  const base: AnalyticsEventPayload = { ...basePayload(surface, routeKey), source };
  let payload: AnalyticsEventPayload;

  // Each quality event has a different allowlist: build only its own keys so
  // no field can survive by relying on the final sanitizer alone.
  switch (eventName) {
    case 'operation_error':
      payload = {
        ...base,
        feature,
        section,
        operation: requiredToken(operation, 'unknown'),
        error_category: requiredToken(errorCategory, 'unknown'),
        error_code: errorCode,
        result,
      };
      break;
    case 'form_validation_error':
      payload = {
        ...base,
        feature,
        section,
        operation,
        error_category: requiredToken(errorCategory, 'unknown'),
        result,
      };
      break;
    case 'data_load_error':
      payload = { ...base, module, feature, operation, error_category: errorCategory, result };
      break;
    case 'empty_state_view':
      payload = { ...base, module, feature, section };
      break;
    case 'feature_unavailable':
      payload = {
        ...base,
        feature: requiredToken(feature, 'unknown'),
        section,
        result,
      };
      break;
  }

  return buildEvent(eventName, payload);
}

export function buildLegacyInteractionEvent({
  eventName,
  pathname,
  eventData,
}: LegacyAnalyticsInteractionInput): AnalyticsTrackedEvent {
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
