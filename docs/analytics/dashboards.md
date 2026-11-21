# Dashboards de analítica

Hay **seis dashboards** definidos en el plan y reflejados en `AnalyticsDashboard` (`src/lib/analytics/events.ts`):

`product_overview`, `search_discovery`, `feature_adoption`, `navigation_engagement`, `ux_friction`, `conversion_workflows`.

Todos los nombres de evento y de propiedad que aparecen aquí son **exactos** y están tomados del catálogo. Si un evento figura como «Pendiente» en [instrumentation-map.md](./instrumentation-map.md), la métrica correspondiente estará vacía hasta que se instrumente; no construyas ese gráfico todavía.

## Web Analytics frente a Product Analytics

Bizi publica dos tipos de señales en el mismo proyecto de PostHog. **No deben mezclarse en la misma fórmula sin entender su origen.**

| | Web Analytics | Product Analytics |
|---|---|---|
| Eventos | `$pageview`, `$pageleave` (generados por el SDK) | Los 45 eventos del catálogo (`public_page_view`, `search_submit`, `workflow_complete`, …) |
| Unidades | visitantes y sesiones seudónimos (`distinct_id`, `$session_id`) | eventos y sesiones en las que ocurre el evento |
| Qué responde | «¿cuánta gente vino y desde dónde?» | «¿qué hizo dentro del producto?» |
| Propiedades | `$current_url` / `$pathname` normalizados (sin query ni IDs de ruta), `$referrer` sin query | propiedades del catálogo: `surface`, `route_key`, `source`, buckets, enum… |
| Configuración relevante | `capture_pageview: 'history_change'`, `capture_pageleave: 'if_capture_pageview'`, `save_campaign_params: false`, `save_referrer: false` | `before_send`/`sanitizeAnalyticsPayload`, catálogo y builders |

> **Importante:** no todos los indicadores de Web Analytics están garantizados por el simple hecho de emitir `$pageview`. PostHog procesa esos eventos por su cuenta y calcula visitantes, sesiones y rebote con sus propias reglas. **Valida cada métrica en PostHog antes de darla por buena.** En particular, la tasa de rebote tiene requisitos adicionales de captura (emparejamiento de `$pageview` con `$pageleave` y la ventana de sesión); compruébala con datos reales. El proyecto no dispone de atribución de campaña (`save_campaign_params: false`) ni de referrer persistente (`save_referrer: false`), así que **no se construyen dashboards de UTM ni de procedencia por referrer**.

Fórmulas expresadas de forma conceptual: `count()` cuenta eventos, `uniq()` cuenta valores distintos, `ratio(a, b)` es un cociente, `filtro(...)` restringe la población. Tradúcelas a la sintaxis del editor de PostHog correspondiente.

---

## 1. `product_overview`

Dashboard paraguas de salud general. **No tiene eventos exclusivos**: agrega Web Analytics y métricas de los otros cinco dashboards. Se documenta aquí para que los seis nombres queden definidos de forma consistente.

| Métrica | Fuente | Fórmula / filtro |
|---|---|---|
| Visitas (páginas vistas) | Web Analytics | `count(event = $pageview)` |
| Visitantes únicos | Web Analytics | `uniq(distinct_id)` sobre `$pageview`, en el periodo |
| Sesiones | Web Analytics | `uniq($session_id)` sobre `$pageview` |
| Páginas por sesión | Web Analytics | `count($pageview) / uniq($session_id)` |
| Tasa de rebote | Web Analytics | ratio de sesiones con un solo `$pageview` — **validar en PostHog** (requisitos adicionales de `$pageleave`) |
| Superficie más usada | Product Analytics | `count(event in catálogo)` agrupado por `surface` (`public`, `dashboard`) |
| Páginas más vistas | Product Analytics | `count(public_page_view OR dashboard_page_view)` agrupado por `route_key` |
| Adopción de funcionalidad | Product Analytics | `uniq(surface, route_key)` sobre eventos de `feature_adoption` |
| Salud de calidad | Product Analytics | `count(event in {operation_error, form_validation_error, data_load_error, export_error})` |

Filtro común: periodo; opcionalmente `surface`. No filtrar por UTM (`save_campaign_params: false`).

---

## 2. `search_discovery`

Preguntas: ¿se busca?, ¿encuentra resultados?, ¿se seleccionan?

| Métrica | Eventos exactos | Propiedades usadas | Fórmula / filtro |
|---|---|---|---|
| Búsquedas enviadas | `search_submit` | `query_present`, `query_length_bucket`, `search_type` | `count(search_submit)`, opcionalmente filtrar `query_present = true` |
| Longitud de consulta | `search_submit` | `query_length_bucket` | `count(search_submit)` agrupado por `query_length_bucket` (`0`, `1_2`, `3_5`, `6_plus`) — **nunca se agrupa por texto** |
| Resultados mostrados | `search_results_view` | `has_results`, `result_count_bucket`, `results_count` | `count(search_results_view)`; agrupado por `result_count_bucket` (`0`, `1`, `2_5`, `6_20`, `21_plus`) |
| Tasa de búsquedas sin resultados | `search_no_results`, `search_submit` | `source`, `search_type` | `count(search_no_results) / count(search_submit)` |
| Selección de resultados | `search_result_select` | `entity_type`, `section`, `action` | `count(search_result_select)` agrupado por `entity_type` |
| CTR de resultados | `search_result_select`, `search_results_view` | `surface`, `route_key`, `source`, `search_type` | `count(search_result_select) / count(search_results_view)` (misma superficie y periodo) |
| Abandono de búsqueda | `search_clear` | `search_type`, `section` | `count(search_clear) / count(search_submit)` |

Filtros disponibles: `surface`, `route_key`, `source`, `search_type`, `section`. **Ningún filtro de texto libre**; `query_length_bucket` y `result_count_bucket` son los únicos desgloses de consulta permitidos.

---

## 3. `feature_adoption`

Pregunta: ¿qué funcionalidades se usan y con qué profundidad?

| Métrica | Eventos exactos | Propiedades usadas | Fórmula / filtro |
|---|---|---|---|
| Uso de CTA | `cta_click` | `cta_id`, `destination`, `is_external`, `source_role`, `destination_role`, `transition_kind` | `count(cta_click)` agrupado por `cta_id` |
| Navegación funcional | `navigation_click`, `breadcrumb_click` | `source`, `destination`, `module`, `source_role`, `destination_role`, `transition_kind` | `count(navigation_click OR breadcrumb_click)` agrupado por `destination` |
| Modos y vistas | `dashboard_mode_change`, `view_mode_change` | `mode`, `view_mode` | `count(...)` agrupado por `mode` / `view_mode` |
| Filtros y ordenación | `filter_change`, `filter_apply`, `filter_clear`, `sort_change` | `filter_category`, `filter_action`, `sort_key`, `result_count_bucket` | `count(...)` agrupado por `filter_category` / `sort_key` |
| Paneles y pestañas | `panel_open`, `tab_change` | `panel`, `module`, `tab` | `count(panel_open OR tab_change)` agrupado por `panel` / `tab` |
| Entidades y detalle | `entity_select`, `entity_detail_view`, `entity_related_view` | `entity_type`, `section`, `action` | `count(...)` agrupado por `entity_type` |
| Favoritos | `entity_favorite_add`, `entity_favorite_remove` | `entity_type`, `module` | `count(entity_favorite_add) - count(entity_favorite_remove)` por `entity_type` |
| Exportación | `export_click`, `export_success` | `cta_id`, `export_format`, `result` | `ratio(count(export_success), count(export_click))` por `export_format` |
| Compartir y copiar | `share_action`, `copy_action` | `channel`, `result`, `cta_id` | `count(share_action)` por `channel`; `count(copy_action)` por `cta_id` |
| Contenido del observatorio | `observatory_brief_viewed`, `observatory_evidence_opened`, `comparison_validated_viewed`, `report_opened`, `api_docs_opened` | `source` | `count(...)` agrupado por nombre de evento |
| Traspaso a BiciRadar | `biciradar_handoff_clicked` | `source` | `count(biciradar_handoff_clicked)` |

Filtros disponibles: `surface`, `route_key`, `page_type`, `template`, `module`, `source`, `entity_type`.

---

## 4. `navigation_engagement`

Pregunta: ¿cómo se recorre el producto?

| Métrica | Eventos exactos | Propiedades usadas | Fórmula / filtro |
|---|---|---|---|
| Páginas vistas (producto) | `public_page_view`, `dashboard_page_view` | `surface`, `route_key`, `page_type`, `template`, `mode` | `count(public_page_view OR dashboard_page_view)` agrupado por `route_key` |
| Rutas de navegación | `navigation_click` | `source_role`, `destination_role`, `transition_kind`, `source`, `destination` | `count(navigation_click)` agrupado por `transition_kind` y por `destination` |
| Migas de pan | `breadcrumb_click` | `source`, `destination`, `section` | `count(breadcrumb_click)` agrupado por `destination` |
| Contenido relacionado | `entity_related_view` | `entity_type`, `action`, `source` | `count(entity_related_view)` |
| Paneles abiertos | `panel_open` | `panel`, `module`, `destination` | `count(panel_open)` agrupado por `panel` |
| Profundidad de ruta (Web Analytics) | `$pageview` | `$pathname` normalizado | `uniq($pathname)` por sesión; las rutas con ID se normalizan a `:id`/`:month`/`:district` en `sanitizeUrl` |

La transición `entry_seo → dashboard` se mide con `source_role = 'entry_seo'` y `destination_role = 'dashboard'` en `navigation_click` o `cta_click`.

---

## 5. `ux_friction`

Pregunta: ¿dónde se atasca o falla la experiencia?

| Métrica | Eventos exactos | Propiedades usadas | Fórmula / filtro |
|---|---|---|---|
| Cierre de paneles | `panel_close` | `panel`, `module`, `action` | `count(panel_close) / count(panel_open)` por `panel` |
| Fallos de operación | `operation_error` | `operation`, `error_category`, `error_code`, `feature` | `count(operation_error)` agrupado por `operation` y `error_category` |
| Errores de validación | `form_validation_error` | `error_category`, `operation`, `feature` | `count(form_validation_error)` agrupado por `error_category` |
| Fallos de carga | `data_load_error` | `module`, `operation`, `error_category` | `count(data_load_error)` agrupado por `module` |
| Fallos de exportación | `export_error` | `error_category`, `export_format`, `cta_id` | `count(export_error) / count(export_click)` por `export_format` |
| Estados vacíos | `empty_state_view` | `module`, `feature`, `section` | `count(empty_state_view)` agrupado por `source` / `module` |
| Funcionalidad no disponible | `feature_unavailable` | `feature`, `section`, `result` | `count(feature_unavailable)` agrupado por `feature` |
| Valoración | `feedback_rating` | `rating`, `module` | `count(rating = positive) / count(feedback_rating)` |

`error_category` es un enum cerrado (`network`, `render`, `validation`, `permission`, `unknown`). Nunca se filtra por mensaje de error ni por `error_code` sensible; `error_code` es un token interno corto.

---

## 6. `conversion_workflows`

Pregunta: ¿qué tareas se empiezan, se completan y dónde se abandonan?

| Métrica | Eventos exactos | Propiedades usadas | Fórmula / filtro |
|---|---|---|---|
| Flujos iniciados | `workflow_start` | `workflow_name`, `section`, `source` | `count(workflow_start)` agrupado por `workflow_name` |
| Progreso por paso | `workflow_step_complete` | `workflow_name`, `step_name`, `step_number`, `result` | `count(workflow_step_complete)` agrupado por `step_name` / `step_number` |
| Flujos completados | `workflow_complete` | `workflow_name`, `result` | `count(workflow_complete)` agrupado por `workflow_name` |
| Abandonos | `workflow_abandon` | `workflow_name`, `step_name`, `result` | `count(workflow_abandon)` agrupado por `step_name` |
| Tasa de finalización | `workflow_start`, `workflow_complete` | `workflow_name` | `ratio(count(workflow_complete), count(workflow_start))` por `workflow_name` |
| Abandono por paso | `workflow_step_complete`, `workflow_abandon` | `workflow_name`, `step_name` | `count(workflow_abandon) / (count(workflow_step_complete) + count(workflow_abandon))` por `step_name` |

`workflow_name` valores previstos: `api_registration`, `feedback`, `planner`. El step se identifica por `step_name` (y su orden por `step_number`), nunca por el contenido introducido en el formulario. El evento `workflow_start` no incluye `result` ni `step_name` porque no pertenecen a sus propiedades permitidas.

## Consideraciones transversales

- `distinct_id`, `$device_id`, `$session_id` y `$insert_id` son identificadores **seudónimos** generados por el SDK. Son necesarios para visitantes/sesiones de Web Analytics y se rotan al revocar el consentimiento. No son datos personales recogidos por Bizi, pero tampoco deben describirse como «anónimos» sin cualificación (ver [privacy-audit.md](./privacy-audit.md)).
- Las rutas se conservan para Web Analytics, pero `sanitizeUrl` normaliza los segmentos con identificadores (`/estaciones/:id`, `/informes/:month`, `/barrios/:district`, `/dashboard/estaciones/:id`) y `before_send` recorta `$pathname`. Los dashboards no pueden desglosar por ID de estación.
- No hay métricas de campaña ni de referrer: es una decisión de privacidad (`save_campaign_params: false`, `save_referrer: false`), no una laguna de datos.
- Los eventos de calidad usan categorías, no mensajes. Cualquier incremento en `error_category = 'unknown'` indica que hay que ajustar la instrumentación, no que haya que enviar más detalle.
