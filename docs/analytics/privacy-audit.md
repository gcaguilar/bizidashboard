# Auditoría de privacidad de la analítica

Fecha de la revisión: 21 de noviembre de 2026. Alcance: `src/lib/analytics/*`, instrumentación asociada y política de privacidad (`src/app/privacidad.tsx`). Esta auditoría es la evaluación documentada que pide la fase 6 del plan.

## 1. Inventario de datos

| Dato | Origen | ¿Se envía a PostHog? | Detalle |
|---|---|---|---|
| Decisión de consentimiento | Usuario (banner / preferencias) | No como evento | Se guarda en `localStorage` (`bizidashboard:analytics-consent:v1`); el SDK guarda además su propia clave `__ph_opt_in_out_<token>`. |
| `distinct_id` | SDK (`posthog-js`) | Sí, automáticamente | Identificador **seudónimo** persistente. Necesario para visitantes/sesiones. No vinculado a persona alguna por Bizi. |
| `$device_id` | SDK | Sí, automáticamente | Seudónimo de dispositivo del SDK. |
| `$session_id` | SDK | Sí, automáticamente | Seudónimo de sesión del SDK; base de las métricas de sesión. |
| `$insert_id` | SDK | Sí, automáticamente | Idempotencia de entrega, generado por el SDK. |
| `localStorage` de PostHog | SDK | No como evento | Persistencia `localStorage`, con `split_storage: true` en el preset `2026-08-30`. Caducidad por defecto de **365 días** para las cookies. Se limpia al revocar. |
| Ubicación aproximada (país y ciudad) | PostHog, por GeoIP de IP | Sí, como propiedad automática del servidor de PostHog | **Intencionado y documentado** en `src/app/privacidad.tsx`: «PostHog deduce a partir de la IP una ubicación aproximada (país y ciudad) para las estadísticas de audiencia; no usamos esa ubicación para identificarte». |
| IP cruda | SDK / red | **No como propiedad de evento** | `$ip` está en la denylist de `before_send`. La opción `ip` del SDK es un **NO-OP obsoleto en 1.453.0**: no se usa. No describimos la IP como «depurada»: se acepta el GeoIP aproximado por diseño. |
| Ruta de página | Navegador | Sí, normalizada | `sanitizeUrl` conserva origen + ruta, elimina query/fragmento y sustituye segmentos con ID (`:id`, `:month`, `:district`, `:topic`). `before_send` sanea también `$pathname`. |
| Propiedades del catálogo | Componentes React | Sí | Solo tokens cortos, enums y buckets; ver [event-dictionary.md](./event-dictionary.md). |

Nota sobre terminología: `distinct_id`, `$device_id`, `$session_id` e `$insert_id` son **seudónimos**, no «anónimos» en sentido estricto. Son persistentes (365 días por defecto) y son necesarios para Web Analytics. No contienen correos, nombres ni identificadores de cuenta, y se rotan/eliminan al revocar el consentimiento (`reset(true)` + limpieza de persistencia). La política de privacidad los describe como «un identificador anónimo y tu decisión en el almacenamiento local del navegador», en el sentido de que no identifican a la persona para Bizi.

## 2. Lo que se recoge intencionadamente

- Eventos de producto del catálogo, con propiedades agregadas y enuméricas.
- `$pageview` / `$pageleave` del SDK para Web Analytics.
- Identificadores seudónimos de SDK necesarios para visitantes y sesiones.
- GeoIP aproximado (país y ciudad) que PostHog calcula en su infraestructura, tal como explica la política de privacidad.
- La decisión de consentimiento, para no volver a preguntar en cada carga.

## 3. Lo que NO se recoge (explícitamente)

| Categoría | Mecanismo de exclusión |
|---|---|
| `identify()` / `alias()` / perfiles de persona | No hay ninguna llamada en `src/`. `person_profiles: 'never'` y `$process_person_profile: false` antes de `before_send`. |
| Grabación de sesiones | `disable_session_recording: true`. |
| Mapas de calor | `capture_heatmaps: false`. |
| Autocapture, clics muertos, rabia, excepciones, logs de consola, encuestas, flags, rendimiento | Todos desactivados explícitamente en la configuración. |
| Contenido de formularios y campos | Los builders solo aceptan tokens/enums; `sanitizeAnalyticsPayload` rechaza texto libre. |
| Texto de búsqueda | Solo `query_present`, `query_length_bucket` y `result_count_bucket`. |
| Correos, nombres, teléfonos u otros datos personales | `EMAIL_PATTERN`, `SUSPICIOUS_STRING_PATTERN`, `TOKEN_PREFIX_PATTERN`, `UUID_PATTERN` y `LONG_DIGITS_PATTERN` en `sanitizeAnalyticsPayload`. |
| IDs de estación, entidad, distrito o informe | Nunca aparecen en el catálogo; las rutas se normalizan en `sanitizeUrl`. |
| Parámetros de URL sensibles (query strings, fragmentos, `userinfo`) | `sanitizeUrl` y redacción de `$current_url` / `$referrer` / `$pathname` en `before_send`. |
| UTM / `gclid` / `fbclid` / referrer persistente | `save_campaign_params: false`, `save_referrer: false`. |
| `$set`, `$set_once`, `$initial_person_info`, `$ip` | Denylist en `before_send`. |
| Mensajes de error, trazas, tokens, secretos | Solo `error_category` / `error_code` internos y cortos. |

El token del proyecto (`properties.token`) se conserva a propósito en `before_send`: PostHog lo exige para aceptar el evento. Es una clave pública de proyecto, no un dato del visitante.

## 4. Revisión de propiedades automáticas del SDK

| Propiedad automática | Tratamiento | Resultado |
|---|---|---|
| `$current_url` | `isUrlProperty` → `sanitizeUrl`: origen + ruta, sin query/fragmento; ID de ruta normalizado | Seguro para Web Analytics; sin parámetros sensibles |
| `$pathname` | Incluido en `isUrlProperty` por el agente del SDK; se sanea en `before_send` | Sin IDs ni query en la ruta |
| `$referrer` / `$initial_referrer*` | Mismo recorte a origen + ruta | Sin parámetros de búsqueda |
| `$set`, `$set_once`, `$initial_person_info` | Eliminados en `before_send` | Sin enriquecimiento de persona |
| `$ip` | Denylist | No se envía como propiedad de evento |
| `$process_person_profile` | `false` con `person_profiles: 'never'` | Sin perfiles |
| `distinct_id`, `$device_id`, `$session_id`, `$insert_id` | Se conservan | Seudónimos necesarios para visitantes/sesiones |
| `token` | Se conserva | Clave pública del proyecto, necesaria para la entrega |
| `$opt_in` | `captureEventName: false` en `opt_in_capturing` | No se emite; no está en el catálogo |

## 5. Resultado de la revisión de configuración

Versión instalada: **`posthog-js` 1.453.0**. `package.json` declara la dependencia como `"1"` (flotante); todas las opciones utilizadas son válidas en esta versión y `defaults: '2026-08-30'` es el preset más reciente disponible.

| Opción | Valor | Efecto verificado |
|---|---|---|
| `defaults` | `'2026-08-30'` | Preset más reciente; implica `split_storage: true`. |
| `autocapture` | `false` | Sin captura automática. |
| `capture_pageview` | `'history_change'` | `$pageview` inicial y en cambios de ruta SPA. |
| `capture_pageleave` | `'if_capture_pageview'` | `$pageleave` emparejado con `$pageview`. |
| `capture_dead_clicks`, `rageclick` | `false` | Sin clics muertos ni rabia. |
| `capture_exceptions` | `false` | Sin excepciones del SDK (Sentry es el canal propio). |
| `capture_heatmaps`, `capture_performance` | `false` | Sin mapas de calor ni rendimiento. |
| `disable_session_recording` | `true` | Sin grabación de sesión. |
| `disable_surveys` | `true` | Sin encuestas. |
| `advanced_disable_flags` | `true` | Sin flags remotos. |
| `logs.captureConsoleLogs` | `false` | Sin logs de consola. |
| `person_profiles` | `'never'` | `$process_person_profile: false` antes de `before_send`. |
| `opt_out_capturing_by_default` | `true` | Opt-out por defecto. |
| `save_campaign_params`, `save_referrer` | `false` | Sin UTM ni referrer persistente. |
| `before_send` | `sanitizeCaptureResult` | Última redacción antes de la entrega. |

**Conclusión:** la configuración cumple las 20 reglas no negociables del plan. No se ha encontrado ninguna llamada a `identify()`/`alias()` en `src/`, ni configuración que permita grabación, mapas de calor, autocapture, formularios, búsquedas en texto plano o parámetros sensibles de URL. El GeoIP aproximado queda documentado como decisión deliberada, y las opciones agresivas se declaran explícitamente para anular cualquier ajuste del proyecto en PostHog.

## 6. Limitaciones conocidas y seguimiento

1. **Cola de eventos en la revocación.** `before_send` es la última barrera de redacción, pero `RequestQueue` de `posthog-js` no ofrece `disable()`/`clear()`. Al revocar, `opt_out_capturing()` impide nuevas capturas, pero los eventos ya encolados pueden seguir enviándose; los ya transmitidos no se pueden retirar. La aplicación mitiga el riesgo con comprobaciones de consentimiento en `initAnalytics` y en la captura pendiente, y limpiando su propia persistencia. No se puede hacer más desde la aplicación.
2. **Métricas de Web Analytics dependientes de PostHog.** `$pageview`/`$pageleave`, visitantes, sesiones y rebote se calculan en el servidor de PostHog. Emitir `$pageview` no garantiza por sí solo todos los indicadores; **hay que validarlos en PostHog**. La tasa de rebote, en particular, tiene requisitos adicionales de captura.
3. **CSP (seguimiento, no defecto).** La política de seguridad de contenido permite actualmente `eu-assets.i.posthog.com` en `script-src`, aunque con grabación, mapas de calor, encuestas y flags desactivados no se necesitan scripts externos. Es una oportunidad de endurecimiento anotada para seguimiento; no bloquea la funcionalidad.
