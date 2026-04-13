# Code Review — BiziDashboard (2026-04-13)

Revisión exhaustiva del proyecto en busca de código duplicado, violaciones SOLID, bugs potenciales e inconsistencias.

---

## 1. Código Duplicado

### Severidad Crítica

| Problema | Archivos afectados | Líneas aprox. |
|---|---|---|
| `RollupResult` definida 6 veces de forma idéntica | `hourly.ts`, `daily.ts`, `rankings.ts`, `patterns.ts`, `heatmap.ts`, `alerts.ts` | ~36 |
| `checkOpsAccess` copy-paste byte-a-byte entre rutas admin | `admin/keys/route.ts`, `admin/keys/[id]/route.ts` | ~24 |
| `patterns.ts` y `heatmap.ts` son ~90% idénticos — misma query, misma acumulación, solo cambia la clave de agrupación y tabla destino | `analytics/queries/patterns.ts`, `analytics/queries/heatmap.ts` | ~200 |
| `hourly.ts` y `daily.ts` comparten la misma estructura — solo cambia `DATE_TRUNC('hour')` vs `DATE_TRUNC('day')` | `analytics/queries/hourly.ts`, `analytics/queries/daily.ts` | ~180 |
| Funciones de formateo (`formatInteger`, `formatDecimal`, `formatPercent`, `formatHourRange`, `average`) copiadas en 9+ archivos en vez de importar de `@/lib/format` | `SeoLandingPage.tsx`, `barrios/`, `estaciones/`, `estadisticas/`, `informes/`, `mapa/`, `conclusiones/`, `page.tsx` | ~500 |

### Severidad Alta

| Problema | Archivos afectados |
|---|---|
| `toCsv` reimplementado en 6 rutas API con lógica de escape inconsistente (`.replaceAll` vs `.replace(/"/g, ...)`) | `rankings`, `stations`, `status`, `history`, `rebalancing-report`, `alerts/history` |
| `parseLimit` duplicado | `rankings/route.ts`, `alerts/route.ts` |
| `ensureLockRefreshed` copy-paste entre los dos jobs | `bizi-collection.ts`, `analytics-aggregation.ts` |
| Patrón de carga de distritos repetido en 5 componentes del dashboard — cada uno con su propio `useEffect`, loading state y error handling | `StationDetailPanel`, `MobilityInsights`, `FlowPreviewPanel`, `NeighborhoodMiniMap`, `NeighborhoodLoadCard` |

### Severidad Media

| Problema | Archivos afectados |
|---|---|
| `PUBLIC_ROUTE_RATE_LIMIT` redefinido en cada ruta pública | 10+ archivos |
| Handler `OPTIONS` para CORS clonado en 4 rutas mobile | `token/refresh`, `install/register`, `geo/search`, `geo/reverse` |
| Rutas geo son prácticamente clones — solo difieren en schema y función llamada | `geo/search/route.ts`, `geo/reverse/route.ts` |
| `mergeMonthCandidates`/`resolvePublishedMonths` duplicado | `informes/[month]/page.tsx`, `informes/page.tsx` |
| `normalizeText` duplicado | `StationPicker.tsx`, `StationsDirectoryClient.tsx` |
| `StationTrend` type redefinido localmente en 6+ archivos | Componentes del dashboard |
| Header boilerplate repetido en 6 sub-rutas del dashboard | Sub-páginas de dashboard |

---

## 2. Violaciones SOLID

### Single Responsibility (SRP)

- **`read.ts` (612 líneas)** es un "god module" que sirve como capa de lectura para rankings, patterns, heatmaps, alerts, mobility, demand curves, system profiles y data availability. Debería dividirse en módulos por dominio.
- **`SeoLandingPage.tsx` (1,382 líneas)** maneja data fetching, content building para 10 tipos de página, JSON-LD, rendering y error fallbacks.
- **`DashboardClient.tsx` (1,165 líneas)** gestiona 20+ `useState`, geolocalización, auto-refresh, URL sync, favoritos, trends, distritos, search y renderiza 4 vistas distintas.
- **`alerts/history/route.ts` (433 líneas)** contiene ~130 líneas de parsing de query params y ~30 de construcción de filtros Prisma dentro del handler de ruta.
- **`bizi-collection.ts`** mezcla scheduling cron, lock management, orchestración GBFS, state tracking, observability y persistencia de collection runs.
- **Rutas API contienen lógica CSV inline** — la serialización CSV es un concern cross-cutting que no pertenece al handler.

### Open/Closed (OCP)

- **Añadir una nueva ruta pública requiere copiar ~20 líneas de boilerplate** (`enforcePublicApiAccess` + try/catch + `captureExceptionWithContext` + `logger.error`). No existe un `withPublicApiRoute(options, handler)`.
- **Añadir una ruta mobile requiere copiar ~50 líneas** de CORS/auth/rate-limit.
- **Añadir un nuevo tipo de rollup** requiere copy-paste del patrón watermark/window/accumulate/upsert. No hay abstracción "rollup step".

### Dependency Inversion (DIP)

- **`history/route.ts` usa `$queryRaw` directamente** en el handler en vez de delegar a `analytics/queries/`.
- **`alerts/history/route.ts` usa `prisma` directamente** para `stationAlert.count` y `findMany`.
- **Todos los rollups y reads importan `prisma` directamente** sin abstracción de repositorio.

---

## 3. Bugs y Problemas Potenciales

### Error Handling

| Problema | Ubicación | Impacto |
|---|---|---|
| `status/route.ts` no tiene control de acceso — ni rate limit, ni API key check | `api/status/route.ts` | Cualquier cliente puede martillear el endpoint |
| `docs/route.ts` no tiene protección alguna | `api/docs/route.ts` | Sin `withApiRequest`, sin rate limit |
| Respuestas de error inconsistentes — unos incluyen `timestamp` y `dataState: 'error'`, otros no | 10+ rutas | Los clientes no pueden asumir un contrato uniforme |
| `access.headers` no siempre se pasa en respuestas 500 — se pierden rate-limit headers | `history`, `rebalancing-report`, `alerts/history`, `status` | Rate-limit no informado al cliente en errores |
| `admin/keys/route.ts` POST usa `await request.json()` sin `.catch()` — body malformado lanza error no controlado | `admin/keys/route.ts:99` | 500 sin mensaje útil |
| `retention.ts` no tiene try/catch — una deletion fallida impide las siguientes | `analytics/retention.ts` | Estado de retención inconsistente |
| `read.ts` usa `.catch(() => [])` con solo `console.warn` — errores de DB se tragan silenciosamente | `analytics/queries/read.ts:144-164` | Datos parciales sin alerta |
| `console.warn`/`console.log` en vez de logger estructurado | `read.ts`, `retention.ts` | Logs no indexables |

### Bugs Lógicos

| Problema | Ubicación |
|---|---|
| `patterns.ts` y `heatmap.ts` usan `rankingDays` para su ventana — si necesitan un lookback diferente, es un bug latente de config | `analytics/queries/patterns.ts`, `heatmap.ts` |
| Time-band normalization puede dar valores artificialmente bajos — divide por `hoursInBand * daysInCat` en vez del conteo real de filas | `analytics/queries/rebalancing.ts:176-187` |
| `warmCache` hardcodea la cache key — si la API construye la key de forma diferente, el cache warm no sirve | `analytics-aggregation.ts:78` |
| `extractStationStatusUrl` y `extractFeedUrl` solapan funcionalidad con cadenas de locale diferentes (`??` vs loop) | `schemas/gbfs.ts` |
| Admin routes sin `export const dynamic = 'force-dynamic'` — Next.js podría intentar optimización estática en rutas con DB writes | `admin/keys/route.ts`, `admin/keys/[id]/route.ts` |
| `stations/route.ts` branch `if (!request)` duplica toda la lógica de fetching+cache del branch principal | `api/stations/route.ts:40-79` |

---

## 4. Problemas de Componentes React

### God Components

| Componente | Líneas | Problema |
|---|---|---|
| `SeoLandingPage.tsx` | 1,382 | 10 page types, data fetching, content building, JSON-LD, rendering |
| `DashboardClient.tsx` | 1,165 | 20+ useState, 4 mode views, geolocation, polling, URL sync |
| `AlertsHistoryClient.tsx` | 702 | Fetching, filtering, pagination, sorting y rendering juntos |
| `MobilityInsights.tsx` | 610 | Carga de distritos, charts, time ranges y métricas computadas |

### Prop Drilling Severo

La cadena principal:

```
DashboardClient (20+ states)
  → DashboardHeader (28 props)
  → OverviewModeView (26 props)
    → MapPanel (13 props — puro pass-through)
      → MapEngine (13 props)
    → StationDetailPanel (8+ props)
    → StationPicker (7 props)
```

Un cambio en `selectedStation` requiere tocar 6 archivos.

### Redundancia en Fetching

5 componentes del dashboard hacen fetch independiente de los mismos datos de distritos — potencialmente 5 llamadas HTTP para los mismos datos.

---

## 5. Plan de Mejoras

### P0 — Quick wins (bajo esfuerzo, alto impacto)

- [x] Mover `RollupResult` a `src/analytics/types.ts` — elimina 6 definiciones idénticas
- [x] Eliminar formatters locales — importar de `@/lib/format` en los 9+ archivos
- [x] Extraer `toCsv` a `src/lib/csv.ts` — sustituye las 6 implementaciones en rutas
- [x] Extraer `checkOpsAccess` a `src/lib/security/ops-api.ts` (o similar)
- [x] Extraer `ensureLockRefreshed` a `src/jobs/utils.ts`

### P1 — Wrappers y abstracciones (medio esfuerzo, alto impacto)

- [x] Crear `withPublicApiRoute(options, handler)` — wrapper HOF que encapsule access check + try/catch + error logging + response building. Reduce ~20 líneas de boilerplate en 10+ rutas.
- [x] Crear `withMobileApiRoute(options, handler)` — misma idea para las 4 rutas mobile (~50 líneas cada una).
- [ ] Extraer rollup genérico `runWindowRollup(config)` — parametrizar por key extractor, target table, watermark name. Reduce `patterns.ts`, `heatmap.ts`, `rankings.ts` y `alerts.ts` a wrappers finos.
- [ ] Parametrizar rollup hourly/daily — un solo módulo con `DATE_TRUNC` granularity como parámetro.
- [x] Crear `useDistrictData()` hook o context — elimina 5 fetches redundantes y ~200 líneas de lógica duplicada.
- [x] Crear `DashboardContext` — resuelve el prop drilling de 28 props y permite descomponer `DashboardClient`.

### P2 — Descomposición de god components (mayor esfuerzo)

- [x] Descomponer `DashboardClient.tsx` en hooks: `useDashboardUrlState`, `useFavorites`, `useAutoRefresh`, `useStationTrends`, `useGeolocation`.
- [ ] Dividir `read.ts` en módulos por dominio: `read-rankings.ts`, `read-patterns.ts`, `read-mobility.ts`, `read-demand.ts`.
- [ ] Dividir `SeoLandingPage.tsx` en builders por tipo de página + renderer compartido.
- [ ] Crear `DashboardPageShell` layout component para eliminar el header boilerplate en 6 sub-rutas.
- [ ] Unificar `extractStationStatusUrl` en `extractFeedUrl`.
- [ ] Usar discriminated union para `CollectionResult`: `{ status: 'success' | 'skipped' | 'failed'; ... }`.

### P3 — Inconsistencias menores

- [ ] Unificar `NextRequest` vs `Request` en las rutas API
- [x] Añadir `force-dynamic` a rutas admin
- [ ] Estandarizar respuestas de error (siempre incluir `timestamp` y `dataState`)
- [ ] Centralizar rate-limit config en vez de redefinir en cada archivo
- [x] Migrar `console.warn`/`console.log` a `logger` estructurado
- [ ] Unificar `Response.json` → `NextResponse.json`
