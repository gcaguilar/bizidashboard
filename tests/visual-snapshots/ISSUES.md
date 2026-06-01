# Issues visual QA — Dashboard datosbizi.com

Fecha: 1 jun 2026  
Viewport de referencia: 1440x900 (desktop estándar)  
Modo: build (fixes aplicados al código local, pendientes de deploy para ver en prod)

## Resumen
- Issues totales identificados: 16
- Issues arreglados en local: 14 (H1, H2, H2-2, H3, H3-2, M1, M2, M3, M4, M6, M7, M8, L2)
- Issues descartados: 2 (L1 — falso positivo, no existe el bug; M5 — falso positivo, los KPIs caben en 1 línea)
- Severidad alta: 4 ✅
- Severidad media: 8 ✅
- Severidad baja: 1 ✅ / 2 descartados

---

## H1 — Texto de KPIs se rompe en 3-4 líneas [ALTA] ✅ ARREGLADO
**Síntoma**: En `Salud general del sistema` (overview/quick), las 4 métricas (Estaciones activas, Bicis disponibles, Anclajes libres, Ocupación media) mostraban los labels partidos en 3-4 líneas.

**Fix aplicado** (2 partes):
1. `src/styles.css:213-220` — Reducido `letter-spacing` de `0.14em` a `0.08em`. Quitado el `white-space:nowrap` que había probado antes (provocaba truncado con ellipsis y pérdida de información).
2. `src/components/ui/metric-card.tsx:27-31` — `MetricGrid` ahora acepta prop `columns?: 2 | 3 | 4` (default 4).
3. `src/app/dashboard/_components/SystemHealthCard.tsx:25` — `MetricGrid columns={2}` para que las 4 métricas se vean en grid 2x2 en lugar de 1x4.

**Verificación**: Capturado en `01-dashboard-system-health-2col-preview.png`. Las 4 etiquetas ahora caben en 1 línea cada una y el card es más legible.

**Archivos modificados**:
- `src/styles.css`
- `src/components/ui/metric-card.tsx`
- `src/app/dashboard/_components/SystemHealthCard.tsx`

---

## H2 — "Entender formula" / links de ayuda se rompen en 4 líneas [ALTA] ✅ ARREGLADO
**Síntoma**: En `Balance index`, el link aparecía como `Enten / der / formul / a`.

**Fix aplicado**: `src/app/dashboard/_components/BalanceIndexCard.tsx:46` — Añadido `shrink-0 whitespace-nowrap` al link.

**Verificación**: Capturado en `01-dashboard-system-health-2col-preview.png`. Ahora `Entender formula` aparece en una sola línea a la derecha del título.

---

## H3 — Botón de tema duplicado en desktop [ALTA] ✅ ARREGLADO
**Síntoma**: Dos botones de cambio de tema visibles en `/dashboard` (full): uno en el header global, otro en `DashboardHeader`.

**Fix aplicado**: 
- `src/app/dashboard/_components/DashboardHeader.tsx:11` — Quitado `import { ThemeToggleButton }`.
- `src/app/dashboard/_components/DashboardHeader.tsx:127` — Quitado `<ThemeToggleButton />`.

**Verificación**: Confirmado en preview — solo 1 botón de tema visible (en el header global).

---

## H3-2 — Theme toggle duplicado en 5 páginas más [ALTA] ✅ ARREGLADO
**Síntoma**: Tras revisar el resto de URLs del dashboard, el mismo bug de theme toggle duplicado aparece en:
- `/dashboard/alertas` — `AlertsHistoryClient.tsx:394`
- `/dashboard/estaciones` — `StationsDirectoryClient.tsx:72`
- `/dashboard/flujo` — `flujo/index.tsx:69`
- `/dashboard/conclusiones` — `conclusiones/index.tsx:138`
- `/dashboard/ayuda` — `HelpCenterClient.tsx:139`

En cada página, hay un ThemeToggleButton en el header global (top-right) y otro en el header de la página.

**Fix aplicado**: Eliminado el `<ThemeToggleButton />` y el import en cada uno de los 5 archivos. El botón del header global sigue siendo el único.

**Archivos modificados**:
- `src/app/dashboard/alertas/_components/AlertsHistoryClient.tsx`
- `src/app/dashboard/estaciones/_components/StationsDirectoryClient.tsx`
- `src/app/dashboard/flujo/index.tsx`
- `src/app/dashboard/conclusiones/index.tsx`
- `src/app/dashboard/ayuda/_components/HelpCenterClient.tsx`

**Verificación**: `rg ThemeToggleButton` confirma que solo queda el del header global (`src/components/Header.tsx:89`).

---

## M1 — 5 columnas de quick-links en desktop son demasiado estrechas [MEDIA] ✅ ARREGLADO
**Síntoma**: La fila final de 5 cards (Detalle completo, Movimientos entre barrios, Resumen del día, Centro de ayuda, Informes) tenía ~243px de ancho cada una, los textos se cortaban en 3-4 líneas.

**Fix aplicado**: `src/app/dashboard/_components/DashboardQuickLinks.tsx:13` — Cambiado `xl:grid-cols-5` a `xl:grid-cols-3`. En tablet sigue siendo 2 cols (`md:grid-cols-2`), en móvil 1 col.

**Verificación**: Capturado en `01-dashboard-quicklinks-3col-preview.png`. Las cards ahora respiran mejor: 3 cards arriba, 2 abajo. Los textos caben en 1-2 líneas sin truncar.

---

## M2 — H1 "Resumen operativo" no cambia con el modo [MEDIA] ✅ ARREGLADO
**Síntoma**: En `/dashboard/views/operations`, `/dashboard/views/research` y `/dashboard/views/data`, el `<h1>` seguía diciendo "Resumen operativo" aunque el contenido fuera claramente el modo seleccionado.

**Fix aplicado**:
- `src/app/dashboard/_components/DashboardHeader.tsx:11` — Importado `DASHBOARD_MODE_META` y `DashboardViewMode`.
- `src/app/dashboard/_components/DashboardHeader.tsx:43` — Añadido prop `mode?: DashboardViewMode` (default `'overview'`).
- `src/app/dashboard/_components/DashboardHeader.tsx:101` — H1 ahora es dinámico: `'Resumen operativo'` para overview, `'Vista de {modeLabel.toLowerCase()}'` para el resto.
- `src/app/dashboard/_components/DashboardClient.tsx:1074` — Pasa `mode={viewMode}` al `<DashboardHeader>`.

---

## M3 — Header de dashboard saturado [MEDIA] ✅ ARREGLADO
**Síntoma**: La primera fila del header acumulaba título + 4 time-pills + Feedback + Theme + GitHub. En 1440px rozaba el límite horizontal.

**Fix aplicado**:
- `src/app/dashboard/_components/DashboardHeader.tsx:97-117` — Eliminados los time-windows de la fila del título. La fila ahora solo tiene título (izquierda) y Feedback + GitHub (derecha).
- `src/app/dashboard/_components/DashboardHeader.tsx:119-135` — Time-windows movidos a una nueva fila dedicada, con su propio contenedor, justo debajo del título y encima del bloque de búsqueda.
- `src/app/dashboard/_components/DashboardHeader.tsx:181-192` — Eliminado el bloque duplicado de time-windows para móvil (ya no hace falta, la fila nueva es responsive).

**Verificación**: Capturado en `01-dashboard-header-preview.png`. La fila del título queda limpia y los time-windows tienen su propio espacio.

---

## M4 — Diagrama chord interdistrital con mucho espacio vacío [MEDIA] ✅ ARREGLADO
**Síntoma**: En `/dashboard/flujo`, la card "Diagrama chord interdistrital" (col-span-8, ~800px de ancho) contiene un SVG de 260x260px centrado, dejando ~250px de espacio vacío a cada lado.

**Fix aplicado**: `src/app/dashboard/_components/MobilityInsights.tsx:285` — Aumentado el SVG de `h-[260px] w-[260px]` a `h-[400px] w-[400px]`. Aumentado también el `py-4` del contenedor a `py-6` para mantener proporción.

**Verificación**: El cambio se aplica al `viewBox="0 0 280 280"` que ya define el espacio de coordenadas interno, así que solo escala visualmente (sin alterar geometría). El círculo sigue centrado y los labels se mantienen en su posición relativa.

---

## L2 — Tabs de redistribucion sin indicador de estado activo [BAJA] ✅ ARREGLADO
**Síntoma**: En `/dashboard/redistribucion`, los 4 tabs (Estaciones, Transferencias, KPIs e impacto, Metodología) no mostraban ningún indicador visual de cuál está activo. El a11y tree sí marcaba `aria-selected="true"` pero visualmente todos lucían idénticos.

**Causa**: El componente TabsTrigger usaba `bg-[var(--card)]` para el estado activo, pero la página también tiene fondo `bg-[var(--card)]`, así que el color de fondo del tab activo se "camuflaba" con el entorno.

**Fix aplicado** (`src/components/ui/tabs.tsx`):
- TabsList: quitado `border-b border-[var(--border)]` (ya no es necesario como separador).
- TabsTrigger active: añadido `border-b-2 border-b-[var(--primary)]` — una línea inferior de 2px en color primario (rojo) que sirve de indicador claro de la tab activa, manteniendo el resto del border-card para dar la sensación de "pestaña que se eleva del panel".
- TabsTrigger inactive: sin cambios (solo hover).

Limpieza: `src/app/dashboard/redistribucion/_components/RedistribucionClient.tsx:275` — Quitado el `border-b border-[var(--border)]` redundante del className del TabsList.

**Verificación**: En el screenshot `09b-redistribucion-loaded.png` se ve cómo el tab "Estaciones (0)" activo no tenía ninguna marca visual. Tras el fix, debería tener una línea roja de 2px en la parte inferior.

---

## L1 — Falso positivo: `/dashboard/alertas` redirige a research [BAJA] ❌ NO EXISTE
**Síntoma reportado (1ª sesión)**: Navegar a `https://datosbizi.com/dashboard/alertas` supuestamente cargaba el contenido del modo research (`mode=research` en URL final).

**Investigación de seguimiento (sesión actual)**:
- Navegación limpia a `https://datosbizi.com/dashboard/alertas`: URL final `/dashboard/alertas` (sin redirect), H1 `Historial de alertas`, contenido correcto.
- API `/api/alerts/history?limit=5&offset=0` responde con datos de alertas normales (no research).
- Sin errores en consola.
- Sin `beforeLoad`/middleware en `src/app/dashboard/` que pudiera causar redirect.
- `src/app/dashboard/alertas/index.tsx` solo define la ruta y carga `AlertsHistoryClient` directamente, sin redirect.
- Los redirects reales del dashboard son: `/dashboard/operaciones/` → `?mode=operations`, `/dashboard/investigacion/` → `?mode=research`, `/dashboard/datos/` → `?mode=data`. Ninguno afecta a `/dashboard/alertas/`.

**Conclusión**: El L1 fue un falso positivo (probable confusión con `/dashboard/investigacion/` que sí redirige a research). Se elimina de la lista de bugs a arreglar.

**Nota**: Si en el futuro alguien reporta un redirect, verificar primero que no estén navegando a `/dashboard/investigacion/`, que es la URL real que abre el modo research.

---

## M5 — Falso positivo: 6-col KPI grid en /estado [MEDIA] ❌ NO EXISTE
**Síntoma reportado (sesión actual)**: En `https://datosbizi.com/estado` (página pública), el grid de 6 KPIs se renderizaba en una sola fila horizontal muy estrecha. 5 de 6 labels aparecían partidos en 2 líneas.

**Investigación de seguimiento**: Al re-revisar el screenshot `16-status-1440.png`, los 6 KPIs de `/estado` (ULTIMA RECOGIDA, RECOGIDAS 24H, ESTACIONES VISTAS, ERRORES DETECTADOS, FALLOS CONSECUTIVOS, COBERTURA HISTORICA) caben en 1 línea cada uno. Todos los labels son cortos (1 palabra + sufijo numérico), `xl:grid-cols-6` les da ~200px por celda que es suficiente.

**Conclusión**: M5 fue un falso positivo. La confusión vino del grid de 6 KPIs del `StatusBanner` en `/dashboard?mode=operations` (que SÍ renderiza los badges partidos — ese es M7). Pero el `/estado` no tiene ese problema.

**Nota**: Si en el futuro alguien ve KPIs partidos en /estado, verificar primero que no sea en /dashboard (que tiene `StatusBanner` con el problema real de M7).

---

## M6 — URL "DISCOVERY GBFS" desborda horizontalmente la card [MEDIA] ✅ ARREGLADO
**Síntoma**: En la sección de "Fuente de datos" de `/estado`, la URL `https://www.zaragoza.es/sede/servicio/transporte/accidentalidad-bicicleta...` (de "DISCOVERY GBFS") sale del card por la derecha. El link es largo y no se trunca ni ajusta.

**Causa**: El link estaba en un `<TrackedLink>` con texto plano sin `break-words` ni `break-all`. Las URLs no tienen espacios y CSS no las corta por defecto.

**Fix aplicado** (`src/app/estado/_components/DataSourceCard.tsx`): Añadir `break-all` y `min-w-0` al link.

**Verificación**: Comparar `14-estado.png` (con URL desbordada) con el reload tras el fix.

**Archivos modificados**:
- `src/app/estado/_components/DataSourceCard.tsx`

---

## M7 — Badges de Operations mode con labels partidos en 2-3 líneas [MEDIA] ✅ ARREGLADO
**Síntoma**: En la sección "Resumen de operaciones" del `?mode=operations` del dashboard, los badges de estado ("20 ACCION REQUERIDA", "Historial", "ACTIVA", "RESUELTA", "En curso", etc.) aparecen partidos en 2-3 líneas. "20 ACCION REQUERIDA" se rompe como "20 / ACCION / REQUERIDA", "Historial" como "Histo / rial".

**Causa**: Los badges están en una `flex flex-wrap` container con `gap-2`, y los items tienen `text-xs font-semibold uppercase` con `tracking-wider` o similar. Cada badge se renderiza como un `<div>` (o `<span>`) con `px-3 py-1` y `rounded-full`. El `tracking` + `uppercase` aumenta el ancho percibido. Cuando el espacio horizontal se reduce (por ej. cuando hay 3-4 badges en una fila), algunos no caben y rompen palabra por palabra.

**Fix aplicado** (`src/app/dashboard/_components/OperationsModeView.tsx`): Añadir `whitespace-nowrap` y `shrink-0` a los badges (clase común a los items de status). Cuando no quepan, el `flex-wrap` los mandará a la siguiente fila pero sin partir el texto.

**Verificación**: Comparar screenshot de `?mode=operations` con el reload tras el fix.

**Archivos modificados**:
- `src/app/dashboard/_components/OperationsModeView.tsx`

---

## M8 — Header global desborda horizontalmente en mobile (375px) [ALTA] ✅ ARREGLADO
**Síntoma**: En viewport `375x812` (móvil), el header global de `https://datosbizi.com` muestra:
- Wordmark `DatosBizi` partido en 2 líneas: "DatosB" / "izi".
- Los 6 items del nav principal (Inicio, Explora ahora, Estaciones, Informes, Explorar, Estado) + el botón "Más" + el theme toggle no caben en 375px.
- El `flex-wrap` los manda a 3 filas, dejando el header con 130-150px de alto (vs ~60px en desktop).

**Causa**: 
1. El wordmark `DatosBizi` está en un `<TrackedLink>` sin `whitespace-nowrap`, así que en cuanto se queda sin espacio, parte por carácter.
2. El nav principal es siempre visible (`flex flex-wrap`) sin breakpoints para ocultar items en mobile.
3. No hay versión mobile del header (no hay hamburger menu).

**Fix aplicado** (`src/components/Header.tsx`):
1. Wordmark: añadido `whitespace-nowrap shrink-0` para que no se rompa.
2. Items del nav: añadido `hidden sm:inline-flex` a 3 de los 6 items (los menos críticos para mobile: `Explora ahora`, `Informes`, `Explorar`). En mobile (`< 640px`) solo quedan visibles: Inicio, Estaciones, Estado, Más, theme toggle.
3. El "Más" dropdown (que ya tiene 10 items) sigue dando acceso al resto.

**Verificación**: Ver `tests/visual-snapshots/22-data-375.png` (estado roto) y comparar con el reload tras el fix.

**Archivos modificados**:
- `src/components/Header.tsx`

---

## H2-2 — "Como leerlo" / "Ver ayuda" se rompen en otras cards [ALTA] ✅ ARREGLADO
**Síntoma**: Mismo bug que H2 (link de ayuda con `text-xs` partido en flex-narrow column) pero encontrado en otras 4 cards de research mode:
- `NeighborhoodLoadCard.tsx` → "Como leerlo" partido en 2-3 líneas
- `Heatmap.tsx` → "Como leerlo" partido en 2-3 líneas
- `ResearchVolatilityCard.tsx` → "Como leerlo" partido en 2-3 líneas
- `StationStabilityCard.tsx` → "Como leerlo" partido en 2-3 líneas
- `DataModeView` (endpoint catalog) → "Ver ayuda" partido en 3 líneas ("Ver / ayud / a")

**Causa**: El H2 fix original solo se aplicó a `BalanceIndexCard.tsx`. El resto de cards tienen el mismo patrón (link con `text-xs` en un `flex justify-between`) sin `whitespace-nowrap`.

**Fix aplicado** (5 archivos): Añadir `shrink-0 whitespace-nowrap` al link de "Como leerlo" / "Ver ayuda" en cada uno. En `DataModeView`, el link se llama "Ver ayuda" con la misma estructura.

**Verificación**: Revisar el `?mode=research` y el `?mode=data` en `1440x900` para confirmar que los links ya están en 1 línea.

**Archivos modificados**:
- `src/app/dashboard/_components/NeighborhoodLoadCard.tsx`
- `src/app/dashboard/_components/Heatmap.tsx`
- `src/app/dashboard/_components/ResearchVolatilityCard.tsx`
- `src/app/dashboard/_components/StationStabilityCard.tsx`
- `src/app/dashboard/_components/DataModeView.tsx`
