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
- `TrackedLink` y `TrackedAnchor` ampliados tambien con `entitySelectEvent`.
- `DashboardHeader` limpiado para no duplicar navegacion primaria.
- `/biciradar` integrado en la navegacion publica compartida con `activeItemId="home"`.
- Home quick links de `/` ajustados para emitir `destinationRole: "utility"` en `/estado`, `/developers` y `/metodologia` desde `source: "home_quick_links"`.
- CTAs externos de Bici Radar instrumentados con `ctaEvent` y contrato de roles/transicion.
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
  - `tests/public-navigation-active-state.test.tsx`
  - `tests/dashboard-route-links.test.tsx`
  - `tests/umami.test.ts`
  - `tests/canonical-metadata.test.ts`
  - `tests/seo-page-contract.test.ts`
  - `tests/public-page-contract.test.tsx`
  - `tests/biciradar-page.test.tsx`
  - `tests/tracked-link.test.tsx`
  - `tests/tracked-anchor.test.tsx`
- Residuos publicos de `station_card_click` migrados a `entitySelectEvent`.
- `station_card_click` mantenido solo como wrapper legacy compatible hacia `entity_select`.

## Estado final

No queda trabajo objetivo abierto en este plan. La navegacion publica, el contrato de telemetria por roles, la integracion de Bici Radar y la cobertura de `TrackedLink` y `TrackedAnchor` ya estan reflejados en codigo y tests.

La comprobacion de seleccion activa en desktop y movil queda cubierta por test automatizado, sin depender de una revision manual como condicion de cierre.

## Validacion ejecutada

```bash
bun run test tests/biciradar-page.test.tsx tests/public-navigation-active-state.test.tsx tests/tracked-link.test.tsx tests/public-page-contract.test.tsx tests/public-navigation.test.tsx tests/tracked-anchor.test.tsx tests/umami.test.ts tests/canonical-metadata.test.ts tests/seo-page-contract.test.ts
bun run lint
```

Resultado:

- `9` archivos de test pasados
- `37` tests pasados
- `eslint` sin errores en esta superficie; se mantienen 2 warnings preexistentes en archivos ajenos a este trabajo
