# Mapa de instrumentación

Matriz de funcionalidades reales de Bizi y los eventos del catálogo que las cubren. **Estado final verificado el 21 de noviembre de 2026** contra el árbol de código, `tsc`, lint y la suite completa de tests.

Leyenda: **Instrumentado** = el builder del catálogo se usa en el punto real de la acción. **Pendiente** = el evento existe en el diccionario pero todavía no hay ningún componente que lo emita (no se dibuja en los dashboards hasta instrumentarse). **No aplicable** = la funcionalidad no existe o no aporta una pregunta de producto.

## Superficie pública

| Funcionalidad | Componente(s) | Eventos | Estado |
|---|---|---|---|
| Vista de página pública | `PublicPageViewTracker` | `public_page_view`, `$pageview` (SDK) | Instrumentado |
| Búsqueda (sugerencias, explorar, ayuda, cabecera) | `PublicSearchForm`, `HeaderSearch`, `ExplorePage`, `HelpCenterClient` | `search_submit`, `search_results_view`, `search_no_results`, `search_result_select`, `search_clear` | Instrumentado |
| Migas de pan | `SiteBreadcrumbs` | `breadcrumb_click` | Instrumentado |
| Navegación y CTA internos | `TrackedLink`, `TrackedAnchor`, `FeedbackCta` | `navigation_click`, `cta_click` | Instrumentado |
| Filtros y ordenación de listados | `StationsDirectory` | `filter_change`, `filter_clear`, `sort_change`, `empty_state_view` | Instrumentado |
| Selección de estación / entidad | `StationCard`, fichas de barrio, informes, `DashboardClient` | `entity_select` | Instrumentado |
| Detalle de estación y contenido relacionado | `StationDetailPanel`, fichas | `entity_detail_view`, `entity_related_view` | Pendiente |
| Favoritos locales | `StationFavoriteButton`, `InteractiveComparePanel` | `entity_favorite_add`, `entity_favorite_remove` | Instrumentado |
| Favoritos en popup del mapa | `MapEngine` | `entity_favorite_add`, `entity_favorite_remove` | Pendiente (el toggle crudo no pasa por el builder) |
| Exportación de informes | `ReportExportBar`, `DataModeCard`, `RebalancingTable` | `export_click`, `export_success`, `export_error` | Instrumentado |
| Compartir y copiar enlace/datos | `ShareButton`, `WhatsAppShareLink`, `InteractiveComparePanel`, `McpInstallGuide`, `DeveloperApiRegistration` | `share_action`, `copy_action` | Instrumentado |
| Resumen de red / observatorio | `NetworkBriefingViewTracker`, `ObservatoryEventTracker` | `observatory_brief_viewed`, `observatory_evidence_opened`, `comparison_validated_viewed`, `report_opened`, `api_docs_opened` | Instrumentado |
| Traspaso a BiciRadar | `BetaBanner` | `biciradar_handoff_clicked` | Instrumentado |
| Planificador de viaje | `PlanificarPage` | `workflow_*`, `operation_error`, `form_validation_error` | Pendiente |
| Valoración de feedback | `FeedbackDialog`, `FeedbackCta`, `BetaBanner` | `feedback_rating`, `workflow_start`, `workflow_step_complete`, `workflow_abandon`, `panel_open`, `panel_close` | Instrumentado |

## Superficie de dashboard

| Funcionalidad | Componente(s) | Eventos | Estado |
|---|---|---|---|
| Vista de sección del dashboard | `DashboardPageViewTracker` | `dashboard_page_view`, `$pageview` (SDK) | Instrumentado |
| Cambio de modo | `DashboardClient` | `dashboard_mode_change` | Instrumentado |
| Cambio de vista (`view_mode_change`) | `DashboardClient` | `view_mode_change` | Pendiente (se conserva `dashboard_mode_change` para no duplicar) |
| Filtro de mes | `MonthFilter` | `filter_change` | Instrumentado |
| Filtros de alertas | `AlertsHistoryClient` | `filter_clear`, `data_load_error`, `empty_state_view` | Instrumentado |
| Aplicación explícita de filtros | `AlertsHistoryClient` | `filter_apply` | Pendiente |
| Pestañas de redistribución | `RedistribucionClient` | `tab_change`, `data_load_error` | Instrumentado |
| Paneles y modales de ayuda | `HelpCenterClient`, `ApiCatalogCard`, `BetaBanner`, `FeedbackDialog` | `panel_open`, `panel_close`, `search_*`, `empty_state_view` | Instrumentado |
| Copia y exportación en tablas | `RebalancingTable`, `AlertsHistoryClient` | `copy_action`, `export_click`, `export_success`, `export_error` | Instrumentado |
| Registro de API de desarrollador | `DeveloperApiRegistration` | `workflow_start`, `workflow_step_complete`, `workflow_complete`, `operation_error`, `form_validation_error`, `copy_action` | Instrumentado |
| Funcionalidad no disponible | `DeveloperApiRegistration`, `RedistribucionClient` | `feature_unavailable` | Pendiente (no se emite todavía; no construir gráficos con este evento) |
| Carga de datos y estados vacíos | `AlertsHistoryClient`, `RedistribucionClient`, `StationsDirectory`, `HelpCenterClient` | `data_load_error`, `empty_state_view` | Instrumentado |

## Resumen

- **Instrumentado y con datos reales que llegan a PostHog**: descubrimiento (`search_*`), navegación (`breadcrumb_click`, `tab_change`, `panel_close`), exploración (`sort_change`, `filter_clear`), favoritos, acciones (`export_success`, `export_error`, `share_action`, `copy_action`), flujos de feedback y API key, y calidad (`operation_error`, `form_validation_error`, `data_load_error`, `empty_state_view`).
- **Pendiente (definido pero sin emisores)**: `entity_detail_view`, `entity_related_view`, `view_mode_change`, `filter_apply`, `feature_unavailable` y el flujo del planificador. Ningún dashboard los usa todavía.
- Los eventos heredados (`LegacyAnalyticsInteractionName`) se traducen al catálogo mediante `buildLegacyInteractionEvent`.

## Cómo mantener esta tabla

Cuando se instrumente un evento pendiente:

1. Cambia su estado a **Instrumentado** y añade el componente real si no figuraba.
2. Verifica que el builder usado es el del catálogo y que el payload pasa los tests de [maintenance.md](./maintenance.md).
3. Actualiza el dashboard correspondiente en [dashboards.md](./dashboards.md) si la métrica estaba vacía.
