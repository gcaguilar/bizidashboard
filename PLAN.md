# PLAN

## Contexto actual

Linea en curso: navegacion publica de DatosBizi y contrato de telemetria basado en roles (`source_role`, `destination_role`, `transition_kind`) para separar mejor hubs publicos, entry SEO, utilidades y dashboard.

Estado ya completado en esta rama:

- Navegacion publica separada en primaria/utilidades.
- `PublicSectionNav` adaptado para desktop y movil.
- `activeItemId` corregido en paginas publicas ya migradas.
- Contrato inicial `pageRole` + `primaryCta` introducido en `src/lib/seo-pages.ts`.
- `TrackedLink` y Umami ampliados para `navigationEvent` y `ctaEvent`.
- `TrackedAnchor` ampliado para soportar tambien `navigationEvent` y `ctaEvent`.
- `DashboardHeader` limpiado para no duplicar navegacion primaria.
- Landings y superficies publicas ya migradas al contrato nuevo:
  - home
  - `/explorar`
  - `/mapa-estaciones-bizi-zaragoza`
  - `/estadisticas-bizi-zaragoza`
  - `SeoLandingPage`
  - `/informes`
  - `/informes/[month]`
  - `/developers`
  - `/metodologia`
  - `/estado`
  - `/biciradar`
  - `/estaciones/[stationId]`
  - `/barrios/[districtSlug]`
- Tests ya añadidos o ampliados:
  - `tests/public-navigation.test.tsx`
  - `tests/dashboard-route-links.test.tsx`
  - `tests/umami.test.ts`
  - `tests/canonical-metadata.test.ts`
  - `tests/seo-page-contract.test.ts`

## Pendiente inmediato

### R2. Cerrar residuos y decidir politica final para `station_card_click`

Estado actual:

- Los CTAs y la navegacion publica ya no dependen de `eventName/eventData`.
- El unico evento legacy que queda en superficies publicas es `station_card_click`.
- Ese evento sigue siendo valido porque mapea a `entity_select` sin exponer identificadores prohibidos.

Nota:

- Si se quiere homogeneidad total, valorar si `station_card_click` debe quedarse como wrapper legacy estable o si conviene introducir una API explicita tipo `entitySelectEvent` en `TrackedLink`.
- Si no hay necesidad analitica nueva, tambien es razonable dejarlo como esta y considerar cerrada la migracion.

### R4. Revisar intencion de navegacion (`activeItemId`)

Estado actual:

- `explore` ya se usa en:
  - landings de adquisicion
  - hubs SEO
  - fichas publicas de estacion
  - fichas publicas de barrio
- `reports` se mantiene en:
  - archivo mensual
  - informe mensual individual
- `api` y `help` se mantienen correctamente en developers y metodologia.

Pendiente:

- Revisar visualmente en navegador si la seleccion activa se percibe correcta en desktop y movil para estas rutas.

## Tests a reforzar

1. Añadir tests sobre `SeoLandingPage` para validar:
   - `pageRole` correcto.
   - CTA principal alineada con `primaryCta`.
   - transiciones `to_dashboard` vs `within_public`.
2. Añadir tests de render para:
   - `activeItemId="explore"` en station/district detail.
   - `activeItemId="reports"` en archivo mensual y reporte mensual.
3. Evaluar assertions mas directas sobre payloads Umami en:
   - `TrackedAnchor`
   - `SeoLandingPage`
   - superficies editoriales (`informes`, `informes/[month]`)

## Validacion recomendada al retomar

Ejecutar primero lo mas focalizado:

```bash
bun run test tests/public-navigation.test.tsx tests/umami.test.ts tests/canonical-metadata.test.ts tests/seo-page-contract.test.ts
```

Luego ampliar segun la superficie tocada:

```bash
bun run test tests/dashboard-route-links.test.tsx tests/routes-registry.test.ts tests/dashboard-modes.test.ts tests/dashboard/feedback-entrypoints.test.tsx
bun run lint
```

Si se tocan `TrackedAnchor`, `developers` o `metodologia`, conviene volver a pasar al menos:

```bash
bun run test tests/umami.test.ts tests/canonical-metadata.test.ts tests/public-navigation.test.tsx
```

## Riesgos a vigilar

- No degradar semantica de eventos ya usados en Umami sin un mapeo equivalente.
- No marcar como `dashboard` rutas que siguen siendo descubrimiento publico.
- Mantener canonicidad SEO y enlazado interno estable.
- Evitar mezclar cambios de navegacion con refactors amplios de copy o layout.
- No romper enlaces externos con `TrackedAnchor` al añadir soporte de telemetria nueva.
