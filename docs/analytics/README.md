# Analítica de producto en DatosBizi

Este directorio documenta el sistema de analítica de DatosBizi (PostHog Cloud EU). La analítica es **opcional**: no se carga ningún SDK ni se envía ningún evento hasta que la persona visita da su consentimiento explícito.

La documentación está dividida en:

| Documento | Contenido |
|---|---|
| [README.md](./README.md) | Arquitectura, configuración del SDK, consentimiento, privacidad y cómo emitir eventos. |
| [event-dictionary.md](./event-dictionary.md) | Diccionario completo de los 45 eventos del catálogo. |
| [dashboards.md](./dashboards.md) | Especificaciones de los seis dashboards (Web Analytics frente a Product Analytics). |
| [privacy-audit.md](./privacy-audit.md) | Inventario de datos, propiedades automáticas del SDK y resultado de la revisión de configuración. |
| [maintenance.md](./maintenance.md) | Cómo añadir eventos, convenciones y trampas habituales. |
| [instrumentation-map.md](./instrumentation-map.md) | Matriz de funcionalidades reales y eventos: instrumentado frente a en curso. |

## Arquitectura en cuatro capas

```
1. Configuración y consentimiento   src/lib/analytics/config.ts, consent.ts, use-analytics-consent.ts
2. Catálogo y constructores         src/lib/analytics/events.ts
3. Cliente y ciclo de vida del SDK  src/lib/analytics/client.ts
4. Instrumentación                  componentes React (trackers, TrackedLink, botones…)
```

### Capa 1 — Configuración y consentimiento

- `config.ts` resuelve en servidor la configuración de PostHog. En desarrollo y tests devuelve `null`: ningún entorno no productivo informa a un proyecto real. La clave del proyecto es pública (no un secreto) y solo se expone al navegador si se configura explícitamente.
- `consent.ts` guarda la decisión (`granted` / `denied`) en `localStorage` bajo `bizidashboard:analytics-consent:v1` y emite eventos DOM para sincronizar pestañas.
- `use-analytics-consent.ts` expone el estado al árbol React.

### Capa 2 — Catálogo y constructores (`events.ts`)

`ANALYTICS_EVENT_CATALOG` es la **única fuente de verdad**. Cada evento tiene un nombre `snake_case` estable, descripción, categoría, componentes, propiedades permitidas y requeridas, pregunta de producto, dashboard objetivo y clasificación de privacidad (`anonymous_aggregate`).

Los constructores (`buildSearchSubmitEvent`, `buildWorkflowEvent`, `buildQualityEvent`, etc.) son la única forma admitida de crear un payload. Ningún componente debería llamar a `trackEvent` con un objeto arbitrario. Las ayudas `getQueryLengthBucket` y `getResultCountBucket` convierten longitudes y recuentos en **buckets** antes de salir del navegador: el texto de búsqueda y los recuentos exactos sensibles nunca se envían.

### Capa 3 — Cliente y ciclo de vida del SDK (`client.ts`)

- El SDK `posthog-js` se importa de forma diferida **solo después** del consentimiento.
- `configureAnalytics()` guarda la configuración resuelta y registra un único listener de consentimiento que gira el SDK tanto en la pestaña actual como entre pestañas.
- `before_send` (`sanitizeCaptureResult`) es la última barrera de redacción: elimina `$set`, `$set_once`, `$initial_person_info`, `$ip`, datos personales y recorta las URL a su ruta.
- `trackEvent()` vuelve a comprobar el consentimiento en el momento del envío y aplica `sanitizeAnalyticsPayload(payload, name)`.
- `revokeAnalytics()` hace `opt_out_capturing()`, `reset(true)` y limpia el `localStorage`/`sessionStorage`/cookies de PostHog, incluida la clave de consentimiento del SDK.

### Capa 4 — Instrumentación

Los componentes reales usan los constructores del catálogo. Los ejemplos:

```tsx
import { buildSearchSubmitEvent, trackEvent } from '@/lib/analytics';

function onSearch(queryLength: number) {
  // Nunca se pasa `query`: solo su longitud agrupada.
  trackEvent(buildSearchSubmitEvent({
    surface: 'public',
    routeKey: 'explore',
    source: 'explore_search',
    queryLength,
  }));
}
```

```tsx
import { buildWorkflowEvent, trackEvent } from '@/lib/analytics';

trackEvent(buildWorkflowEvent('workflow_step_complete', {
  surface: 'public',
  routeKey: 'developers',
  source: 'api_registration',
  workflowName: 'api_registration',
  stepName: 'api_key_created',
  stepNumber: 2,
  result: 'success',
}));
```

`trackEvent` acepta `AnalyticsTrackedEvent` (`{ name, payload? }`), pero **todos los payloads pasan por `sanitizeAnalyticsPayload(payload, name)`**. Esa función es el único punto de validación y redacción de payloads de producto: solo conserva claves declaradas para ese evento, valores primitivos, tokens cortos sin texto libre y valores enuméricos conocidos. No cambies su firma pública `(payload, eventName?)`.

## Configuración final del SDK

Versión instalada: `posthog-js` **1.453.0** (`package.json` declara `"1"` de forma flotante; todas las opciones usadas son válidas en esta versión). `defaults: '2026-08-30'` es el preset más reciente disponible.

| Opción | Valor | Justificación |
|---|---|---|
| `api_host` / `ui_host` | `https://eu.i.posthog.com` / `https://eu.posthog.com` | Alojamiento en la UE (Frankfurt), coherente con la política de privacidad. |
| `defaults` | `'2026-08-30'` | Preset más reciente de la versión instalada; habilita `split_storage` y el comportamiento moderno del SDK. |
| `autocapture` | `false` | Evita capturas automáticas de elementos y texto que no forman parte del catálogo. |
| `capture_pageview` | `'history_change'` | El SDK es el único propietario de `$pageview` (inicial y cambios de ruta SPA). |
| `capture_pageleave` | `'if_capture_pageview'` | Empareja `$pageleave` con `$pageview` sin capturar salidas huérfanas. |
| `capture_dead_clicks`, `rageclick` | `false` | No se miden clics muertos ni rabia: no aportan al plan y amplían la superficie de datos. |
| `capture_exceptions` | `false` | Los errores técnicos ya los gestiona Sentry, con su propio consentimiento/base legal. |
| `capture_heatmaps`, `capture_performance` | `false` | Sin mapas de calor ni métricas de rendimiento; se declara explícitamente para anular cualquier ajuste del proyecto. |
| `disable_session_recording` | `true` | **Sin grabación de sesiones**, ni siquiera en modo anonimizado. |
| `disable_surveys` | `true` | Sin encuestas del SDK (el feedback usa el catálogo: `feedback_rating`). |
| `advanced_disable_flags` | `true` | Sin feature flags remotos: el comportamiento no depende del servicio de analítica. |
| `logs.captureConsoleLogs` | `false` | No se envían logs de consola. |
| `person_profiles` | `'never'` | El SDK marca `$process_person_profile: false` antes de `before_send`. No hay perfiles de persona. |
| `opt_out_capturing_by_default` | `true` | Opt-out por defecto; el SDK no captura nada hasta `opt_in_capturing`. |
| `save_campaign_params`, `save_referrer` | `false` | No se persisten UTM/`gclid`/`fbclid` ni referrers: son identificadores persistentes innecesarios. |
| `persistence` | `'localStorage'` | Necesario para `distinct_id` seudónimo y para la decisión de consentimiento. |
| `debug` | `false` | Sin logging de depuración en producción. |
| `before_send` | `sanitizeCaptureResult` | Redacción final de URLs y propiedades antes de la entrega. |

`opt_in_capturing({ captureEventName: false })` evita además el evento `$opt_in`, que no pertenece al catálogo.

## Ciclo de vida del consentimiento

| Estado | Significado | Comportamiento |
|---|---|---|
| `unknown` | Sin decisión | No se importa el SDK; no hay capturas. |
| `granted` | Consentimiento otorgado | Se inicializa el SDK (si hace falta), se aplica opt-in y se captura `$pageview`. |
| `denied` | Consentimiento rechazado o revocado | Se detiene la captura, se limpia la identidad y se borra la persistencia de PostHog. |

El listener de consentimiento es único y atiende tanto el evento personalizado del mismo documento como el evento `storage` entre pestañas. Los duplicados (misma decisión repetida) se ignoran.

**Limitación conocida:** `opt_out_capturing()` impide nuevas capturas, pero la cola interna del SDK (`RequestQueue`) no dispone de `disable()`/`clear()`. Los eventos ya encolados antes de la revocación pueden llegar a enviarse; los ya transmitidos no se pueden recuperar. La aplicación garantiza que no se encola nada nuevo tras la revocación mediante las comprobaciones de consentimiento en `initAnalytics` y en la captura pendiente.

## Principios de privacidad (reglas no negociables)

1. Sin `identify()` ni `alias()`: no se crea ni se enriquece una identidad de persona.
2. Sin grabación de sesiones (`disable_session_recording: true`).
3. Sin mapas de calor (`capture_heatmaps: false`).
4. Sin autocapture (`autocapture: false`).
5. Sin contenido de formularios: nunca se envían valores de campos.
6. Sin texto de búsqueda: solo `query_present`, `query_length_bucket` y `result_count_bucket`.
7. Sin parámetros sensibles de URL: `sanitizeUrl` conserva solo origen + ruta y normaliza segmentos con IDs.
8. Sin identificadores persistentes innecesarios: no UTM, no referrer, no propiedades de persona.
9. `person_profiles: 'never'`: `$process_person_profile: false`, sin `$set`/`$set_once`.
10. Sin correos, nombres, teléfonos ni ningún otro dato personal en propiedades: `sanitizeAnalyticsPayload` rechaza patrones de email, texto libre, URLs, query strings y tokens.
11. Los IDs de estación/entidad nunca se envían: solo `entity_type` y buckets.
12. Los errores se reportan por categoría (`error_category`), nunca por mensaje o traza.
13. El token del proyecto se conserva en `before_send` porque PostHog lo exige para aceptar el evento; no es un dato del visitante.
14. El consentimiento se comprueba antes de importar el SDK y antes de cada envío.
15. La revocación limpia la persistencia propia del SDK.
16. Desarrollo y tests nunca reportan a un proyecto real (`NODE_ENV !== 'production'` → configuración `null`).
17. El catálogo es la única fuente de nombres de evento y propiedades.
18. Los builders son la única puerta de entrada; `sanitizeAnalyticsPayload` es la última barrera.
19. Las métricas agregadas se derivan de propiedades enuméricas y buckets estables.
20. Cualquier duda sobre una nueva propiedad se resuelve **no enviándola**.

## Relación con la política de privacidad

La [política de privacidad](../../src/app/privacidad.tsx) documenta el tratamiento agregado, el uso de PostHog Cloud EU y la geolocalización aproximada (país y ciudad) que PostHog deduce de la IP. Consulta [privacy-audit.md](./privacy-audit.md) para el inventario completo y la evaluación de la configuración.

## Validación real en PostHog (pendiente)

La implementación, los tests automatizados, el typecheck, el lint y el build están verificados en el repositorio. **La validación contra un proyecto PostHog real queda pendiente** porque este entorno no dispone de un proyecto de prueba ni de credenciales. No se considera terminada la tarea hasta completarla en un entorno controlado:

1. Entrar sin decidir y confirmar que no llega ningún evento a Activity.
2. Rechazar y confirmar lo mismo; comprobar que no existen claves `ph_*` ni `__ph_opt_in_out_*` en almacenamiento.
3. Aceptar y confirmar **un único** `$pageview` inicial.
4. Navegar por rutas públicas y de dashboard (SPA) y confirmar un `$pageview` por cambio de ruta, sin duplicados y sin query strings ni IDs de entidad en `$current_url`.
5. Confirmar `$pageleave` al salir de la página.
6. Ejecutar búsquedas, filtros, paneles, selección de entidades, exportaciones, compartir/copiar y los dos flujos instrumentados; verificar nombres y propiedades contra [event-dictionary.md](./event-dictionary.md).
7. Provocar errores controlados y confirmar que solo llega `error_category`.
8. Revocar el consentimiento y confirmar que dejan de llegar eventos (con la limitación de la cola ya documentada).
9. Comprobar que los seis dashboards de [dashboards.md](./dashboards.md) consumen eventos y propiedades correctos, y que las métricas de Web Analytics (visitantes, sesiones, duración, rebote) se calculan como se espera.

Hasta completar estos pasos, los dashboards son **especificaciones** y no resultados validados.
