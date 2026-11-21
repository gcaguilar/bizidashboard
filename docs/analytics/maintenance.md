# Mantenimiento del sistema de analítica

## Cómo añadir un nuevo evento

Sigue siempre este orden. Saltarse un paso es la forma habitual de filtrar datos personales o de crear un evento que nadie sabe interpretar.

### 1. Catálogo (`src/lib/analytics/events.ts`)

1. Añade el nombre a `AnalyticsTrackedEventName` (en `snake_case`, estable).
2. Añade la definición en `ANALYTICS_EVENT_CATALOG` con: `name`, `description`, `category`, `components`, `allowedProperties`, `requiredProperties`, `productQuestion`, `dashboard`, `privacy`.
3. Si necesitas una propiedad nueva, añádela primero a `AllowedPayloadKey`. `sanitizeAnalyticsPayload` solo conserva claves declaradas: una clave que no exista en ese tipo se descarta silenciosamente.
4. Comprueba que `requiredProperties ⊆ allowedProperties` y que no uses nombres prohibidos (`email`, `query`, `station_id`, `path`, `url`, `$set`, …).

```ts
new_event: {
  name: 'new_event',
  description: 'Acción funcional concreta que se quiere medir.',
  category: 'actions',
  components: ['SomeComponent'],
  allowedProperties: ['surface', 'route_key', 'source', 'cta_id'],
  requiredProperties: ['surface', 'route_key', 'source', 'cta_id'],
  productQuestion: '¿Qué pregunta de producto responde este evento?',
  dashboard: 'feature_adoption',
  privacy: 'anonymous_aggregate',
},
```

### 2. Builder

Añade un `buildNewEventEvent(input: NewEventInput): AnalyticsTrackedEvent` que devuelva `buildEvent('new_event', { ... })`.

- Construye **solo** las claves declaradas en `allowedProperties`; no te apoyes en que el sanitizador las quitará.
- Garantiza las propiedades `requiredProperties` incluso cuando el input sea opcional (usa `requiredToken(valor, 'unknown')`).
- Usa `basePayload(surface, routeKey)` para `surface` y `route_key`.
- Convierte recuentos con `getResultCountBucket()` y longitudes de consulta con `getQueryLengthBucket()`. Nunca pases el texto original.
- Usa enums estrechos en el tipo de entrada (`'pdf' | 'csv' | 'json' | 'png'`, `'success' | 'error'`, …) cuando la propiedad sea enumérica.

### 3. Test

Añade un caso en `tests/analytics-events.test.ts` con:

- payload exacto esperado (clave por clave),
- comprobación de que cada clave emitida está en `allowedProperties`,
- comprobación de que todas las `requiredProperties` aparecen,
- un `hostileInput` con `email`, `name`, `phone`, `token`, `query`, `station_id`, `path`, `url` para verificar que no hay fugas.

No modifiques el catálogo para hacer pasar un test: modifica el builder o revisa si la propiedad debe existir realmente.

### 4. Instrumentación

Llama al builder desde el componente y pasa el resultado a `trackEvent`:

```tsx
trackEvent(buildNewEventEvent({
  surface, routeKey, source: 'some_component', ctaId: 'some_action',
}));
```

Registra el componente y el evento en [instrumentation-map.md](./instrumentation-map.md), marcándolo como instrumentado solo cuando el código esté realmente integrado.

### 5. Documentación

Actualiza:

- [event-dictionary.md](./event-dictionary.md) — nueva fila de la tabla y, si hace falta, el vocabulario de propiedades.
- [dashboards.md](./dashboards.md) —Dashboard afectado, con el nombre exacto del evento y sus propiedades.
- [privacy-audit.md](./privacy-audit.md) — solo si el evento introduce una categoría de dato nueva (no debería).

## Convenciones de nombres

| Elemento | Regla | Ejemplo |
|---|---|---|
| Nombre de evento | `snake_case`, verbo en pasado o sustantivo de acción, estable en el tiempo | `workflow_step_complete`, `search_no_results` |
| Categoría | Uno de `discovery`, `navigation`, `exploration`, `content`, `actions`, `workflows`, `quality` | `quality` |
| Dashboard | Uno de `product_overview`, `search_discovery`, `feature_adoption`, `navigation_engagement`, `ux_friction`, `conversion_workflows` | `ux_friction` |
| Propiedad | `snake_case`, token corto, sin texto libre | `query_length_bucket` |
| Valor enumérico | `snake_case` (o `camelCase` solo en `operation`) | `'6_20'`, `'to_dashboard'`, `'loadAlertsHistory'` |
| `source` | Identificador del componente o superficie que origina el evento | `'alerts_history_filters'` |
| `cta_id` | Identificador estable de la llamada a la acción | `'report_pdf'` |
| `route_key` | Clave semántica de ruta, nunca la ruta cruda | `dashboard_station_detail` |
| Buckets | `getQueryLengthBucket` y `getResultCountBucket` | `'3_5'`, `'21_plus'` |

Una misma acción no debe tener dos nombres. Antes de crear un evento, busca en el diccionario si ya existe uno con la misma pregunta de producto; en ese caso reutilízalo y añade el componente a `components`.

## Trampas habituales

1. **Enviar el texto de búsqueda.** Aunque el input del componente lo tenga, el builder solo recibe `queryLength`. No añadas `query` a `allowedProperties`.
2. **Enviar IDs de estación o entidad.** Usa `entity_type` y `route_key`; los IDs se normalizan en las rutas.
3. **Llamar a `trackEvent` con un objeto literal.** Siempre pasa por un builder: es la única forma de garantizar el contrato del catálogo.
4. **Añadir una propiedad al builder sin añadirla al catálogo.** El sanitizador la descarta y el dashboard queda vacío sin avisar.
5. **Contar con que `sanitizeAnalyticsPayload` conserva valores arbitrarios.** Solo acepta primitivos, enuméricos conocidos y tokens cortos sin espacios, `@`, `?`, `&`, `=`, `/` ni prefijos de token.
6. **Usar `$set` / `$set_once` o person properties.** Está prohibido: `person_profiles: 'never'` y `before_send` los elimina.
7. **Medir contenido de formularios o mensajes de error.** Solo `error_category` / `error_code` internos.
8. **Duplicar `$pageview`.** El SDK es el único propietario de `$pageview` y `$pageleave`. Los eventos `*_page_view` del catálogo son métrica de producto, no sustitutos de Web Analytics.
9. **Asumir que una métrica de Web Analytics está garantizada.** Valídala en PostHog; el rebote tiene requisitos adicionales.
10. **Usar UTM o referrer en un dashboard.** Están desactivados por privacidad (`save_campaign_params: false`, `save_referrer: false`).
11. **Cambiar la firma de `sanitizeAnalyticsPayload`.** Es el único punto de validación/redacción y todos los call sites dependen de `(payload, eventName?)`.
12. **Desactivar una comprobación de consentimiento para «no perder eventos».** Ningún evento justifica capturar sin consentimiento.

## Comprobaciones rápidas antes de merge

- [ ] `rtk proxy npx vitest run tests/analytics-events.test.ts`
- [ ] `rtk proxy npx tsc --noEmit` (revisa que no haya errores nuevos en `src/lib/analytics/`)
- [ ] El nombre del evento aparece una sola vez en el catálogo y en la unión de tipos.
- [ ] No hay propiedades prohibidas ni valores de texto libre en el payload resultante.
- [ ] Documentación actualizada (diccionario + dashboard correspondiente).
