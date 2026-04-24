# PLAN

## Contexto actual

Linea en curso: navegacion publica de DatosBizi y contrato de telemetria basado en roles (`source_role`, `destination_role`, `transition_kind`) para separar mejor hubs publicos, entry SEO, utilidades y dashboard.

Estado ya completado en esta rama:

- Navegacion publica separada en primaria/utilidades.
- `PublicSectionNav` adaptado para desktop y movil.
- `activeItemId` corregido en paginas publicas ya migradas.
- Contrato inicial `pageRole` + `primaryCta` introducido en `src/lib/seo-pages.ts`.
- `TrackedLink` y Umami ampliados para `navigationEvent` y `ctaEvent`.
- `DashboardHeader` limpiado para no duplicar navegacion primaria.
- Landings principales migradas parcialmente al contrato nuevo:
  - home
  - `/explorar`
  - `/mapa-estaciones-bizi-zaragoza`
  - `/estadisticas-bizi-zaragoza`
  - `SeoLandingPage`
- Tests ya añadidos o ampliados:
  - `tests/public-navigation.test.tsx`
  - `tests/dashboard-route-links.test.tsx`
  - `tests/umami.test.ts`
  - `tests/canonical-metadata.test.ts`
  - `tests/seo-page-contract.test.ts`

## Pendiente inmediato

### R2. Propagar contrato role/CTA al resto de superficies publicas

Migrar enlaces que aun usan `eventName/eventData` a `navigationEvent` o `ctaEvent`, priorizando:

1. `src/app/_seo/SeoLandingPage.tsx`
   - Hero secundario y bloques relacionados.
   - Revisar si todos los `destinationRole` y `transitionKind` quedan consistentes.
2. `src/app/informes/page.tsx`
   - Hero, archivo mensual y modulos relacionados.
3. `src/app/informes/[month]/page.tsx`
   - Hero, navegacion entre meses y bloques relacionados.
4. `src/app/developers/page.tsx`
   - Hero, related modules y dataset downloads.
5. `src/app/metodologia/page.tsx`
   - Hero y modulos relacionados.
6. `src/app/estado/page.tsx`
   - Hero y accesos relacionados.
7. `src/app/estaciones/[stationId]/page.tsx`
   - Hero y bloques relacionados.
8. `src/app/barrios/[districtSlug]/page.tsx`
   - Hero y bloques relacionados.

Nota:
- `station_card_click` puede mantenerse como evento legacy mientras siga modelando `entity_select`, pero conviene revisar si algun caso pide contrato explicito adicional.
- `TrackedAnchor` sigue aceptando solo legacy tracking; revisar si merece soporte paralelo para `ctaEvent` en superficies publicas con enlaces externos.

### R4. Revisar intencion de navegacion (`activeItemId`)

Comprobar si hay mas rutas publicas que deberian marcar `explore` por intencion en vez de `dashboard` o `reports`.

Checklist:

- Landings de adquisicion.
- Hubs SEO.
- Archivo mensual vs informe mensual individual.
- Fichas publicas de estacion y barrio.

## Tests a reforzar

1. Añadir tests sobre `SeoLandingPage` para validar:
   - `pageRole` correcto.
   - CTA principal alineada con `primaryCta`.
   - transiciones `to_dashboard` vs `within_public`.
2. Añadir tests de render donde importe `activeItemId="explore"` en landings de exploracion.
3. Evaluar snapshot o assertions mas directas sobre payloads Umami en superficies migradas.

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

## Riesgos a vigilar

- No degradar semantica de eventos ya usados en Umami sin un mapeo equivalente.
- No marcar como `dashboard` rutas que siguen siendo descubrimiento publico.
- Mantener canonicidad SEO y enlazado interno estable.
- Evitar mezclar cambios de navegacion con refactors amplios de copy o layout.

