# DatosBizi como observatorio de movilidad

## Decisión de producto

DatosBizi es un observatorio público y una capa de inteligencia para comprender la salud, el equilibrio, la evolución y la calidad de los datos de Bizi Zaragoza. Su propósito es aportar contexto verificable sobre la red, no sustituir una aplicación de consulta inmediata.

BiciRadar es el producto de consulta individual y proximidad. Es donde una persona encuentra bicicletas o anclajes cerca, consulta su posición actual y gestiona su uso cotidiano. Debe conservar su ruta propia y su lenguaje de producto.

## Límites de interpretación

- La demanda, los flujos O-D (origen-destino), los corredores y las predicciones son **estimaciones** calculadas a partir de datos disponibles. No representan viajes oficiales individuales ni instrucciones logísticas.
- El **estado de los datos** describe frescura, cobertura, ingestión y errores del pipeline.
- La **salud o equilibrio de la red** describe disponibilidad, estaciones vacías o llenas, tensión y fricción para las personas usuarias.
- Un pipeline puede estar sano y, al mismo tiempo, la red puede estar desequilibrada. Ambos conceptos se mostrarán y explicarán por separado.

## Contrato de rutas públicas

Las siguientes rutas son públicas y no se pueden eliminar, renombrar ni hacer que fallen. Los cambios de presentación deben preservar sus URLs, parámetros relevantes, enlaces existentes, SEO y marcadores.

- Inicio: `/`.
- Resumen de la red: `/dashboard` y sus vistas públicas enlazadas.
- Comparador: `/comparar`.
- Informes y archivo mensual: `/informes` y `/informes/:month`.
- Estado de los datos: `/estado`.
- Metodología: `/metodologia`.
- Datos y API: `/developers`.
- BiciRadar: `/biciradar`.
- Fichas de estaciones: `/estadisticas/estaciones`, `/estadisticas/estaciones/:stationId` y `/estaciones/:stationId` cuando corresponda al enlace histórico.
- Fichas de barrios: `/estadisticas/barrios` y `/estadisticas/barrios/:districtSlug`.

No se modificarán contratos de `/api/*`, no se harán migraciones de base de datos y no se moverá ni reescribirá la lógica de BiciRadar durante este programa.

## Informe mensual `/informes/:month`

El informe mensual se compone en el servidor (`src/lib/monthly-report.ts`) y se sirve como payload serializable. Se mantienen las URLs, el `robots` condicional (`index, follow` solo si el mes tiene informe publicado) y el JSON-LD de tipo `Article` con migas de pan.

- Resumen ejecutivo: balance frente al mes anterior en lenguaje claro, titulares (movimiento estimado, ocupación media, estaciones activas, días analizados, hora punta y picos anómalos) y nota de método.
- Evolución temporal: serie mensual, curva diaria del mes, perfil horario y mapa de calor de la red por día de la semana y hora.
- Estacionalidad: comparación del mes con el mismo mes calendario de años anteriores de la serie; si no hay años previos, con la media de toda la serie.
- Zonas y barrios: rankings de barrios más dinámicos, menos usados y con más horas de fricción (estaciones vacías o sin huecos).
- Problemas recurrentes: estaciones que más fallan, dónde cuesta más encontrar bici o hueco por la mañana (07:00–10:00) y rachas continuas más largas sin servicio.
- Eficacia de la redistribución: la base de datos no registra los movimientos de los operarios, así que se mide por su efecto. Se señalan las estaciones con rotación por encima de la mediana que siguen acumulando horas sin servicio.
- Conclusiones concretas del mes: la franja día-hora de mayor ocupación, el barrio con más tensión y el día más atípico, redactadas en lenguaje natural.
- Picos anómalos: detección estadística robusta por día de la semana (`src/lib/service-anomalies.ts`). Un día se marca si su z-score robusto alcanza o supera `2.5` o, cuando la dispersión es cero, si se desvía al menos un `35 %`. Un día marcado no implica una causa confirmada.
- Calendario curado: `src/lib/service-calendar.ts` adjunta festivos nacionales, Semana Santa, la ventana de Fiestas del Pilar y una lista editable de eventos (huelgas, obras, meteo adversa). Esa lista (`CURATED_SERVICE_EVENTS`) la mantiene el equipo cuando se confirma un evento.

Las consultas por día de la semana y hora convierten `bucketStart` (guardado en UTC) a la zona `Europe/Madrid` en SQL (`AT TIME ZONE`), igual que hacen los rollups del dashboard con `getLocalBucket`. Así la franja de mañana y el mapa de calor coinciden con el resto del producto.

La ventana de meses del informe y del índice es de `36` meses (`REPORT_MONTHS_WINDOW`), la misma que usa el sitemap para que ningún mes indexable quede marcado como `noindex`.

La caché usa `reports:monthly:v1:<mes>`. El mes en curso se recalcula cada `10 min` (TTL corto) para reflejar la cobertura parcial. Un mes cerrado se **sella** una sola vez: se persiste sin caducidad y las visitas posteriores son lectura pura, sin reconsultar la base de datos. El job `src/jobs/monthly-report-seal.ts` (diario, `05:00 UTC`) precalcula **toda la ventana publicada** (`REPORT_MONTHS_WINDOW`, `36` meses), así que ningún mes del archivo queda sin sellar y se recupera un run perdido; renueva el lock entre meses y aborta si lo pierde. Tras el primer run el coste es solo de lectura. Si falla la serie mensual no se cachea el resultado: se devuelve un estado de error y se reintenta en la siguiente petición, para no fijar un `noindex` falso.

Un mes sellado es una fotografía: refleja el contexto de la serie en el momento de sellarlo (estacionalidad, ventana de `36` meses y comparativa con el mes anterior) y también cualquier fuente que hubiera degradado a vacío en ese momento (barrios, episodios o heatmap). Tras un backfill, un cambio de retención o una fuente que falló justo al sellar hay que invalidarlo con `invalidateMonthlyReport(mes)`, que borra la clave y fuerza el siguiente sellado. Para invalidar todos los meses de golpe se sube `REPORT_CACHE_VERSION` en `src/lib/monthly-report.ts`. Con `v1` como clave, esa subida también evita servir informes sellados con una forma de payload anterior.

## Exportación `/api/reports`

Endpoint público (documentado en OpenAPI) que devuelve el informe de un mes:

- `GET /api/reports?month=YYYY-MM` → payload JSON del informe.
- `GET /api/reports?month=YYYY-MM&format=csv` → un único CSV con todas las tablas del informe, separadas por bloques titulados.
- `GET /api/reports?month=YYYY-MM&format=csv&section=<id>` → una sola tabla (p. ej. `barrios`, `anomalias`, `redistribucion`, `tendencias-diarias`).
- `GET /api/reports?month=YYYY-MM&format=pdf` → PDF del informe generado en el servidor.

El módulo `src/lib/monthly-report-export.ts` mapea el payload a secciones planas (cabeceras y filas) de forma pura; el escapado de CSV y la respuesta HTTP viven en el seam `src/lib/csv.ts` (`csvSectionsResponse`), incluida la neutralización de inyección de fórmulas. La descarga usa el mismo informe cacheado, así que no recalcula nada.

`src/lib/monthly-report-pdf.ts` compone el PDF a partir de ese mismo payload (resumen ejecutivo y titulares, luego las secciones de texto como prosa y las de datos como tablas paginadas) con `jsPDF` + `jspdf-autotable`, **sin binario de navegador**. Es un informe de datos: la tipografía y el diseño de la página web solo se reproducen con «Imprimir / PDF».

En `/informes/:month` la tarjeta «Exportar informe» ofrece la descarga PDF, CSV y JSON del mes, la exportación por sección y la impresión del documento completo (vía hoja de estilos `@media print`, que oculta la navegación global y las acciones).

## Línea base — 2 de septiembre de 2026

La línea base funcional antes del rediseño fue `119` archivos y `476` pruebas unitarias correctas. Las rutas principales tienen una prueba E2E de URL canónica y ausencia de página de error; BiciRadar se comprueba por separado para evitar que derive al dashboard.

Textos y navegación relevantes registrados antes de los cambios de interfaz:

- Inicio abre con «Bizi Zaragoza ahora mismo».
- El modo inicial de `/dashboard` se identifica como «Resumen operativo».
- `/comparar` presenta «Elige dos lados y comparalos manualmente».
- `/informes` se presenta como «Archivo mensual» e «Informes mensuales de Bizi Zaragoza».
- BiciRadar mantiene el encabezado «Bici Radar» y se enlaza desde la navegación pública a `/biciradar`, distinto de `/dashboard`.
- La navegación pública actual agrupa Inicio, «Explora ahora», Estaciones, Informes, Explorar y Estado; BiciRadar se encuentra en el menú de más opciones.

Hay referencias visuales locales previas en `tests/visual-snapshots/` para el dashboard. La captura visual completa de Inicio, Dashboard, Comparar, Informes, Estado y BiciRadar en escritorio y móvil debe repetirse en un entorno con PostgreSQL disponible: la ejecución local de Playwright de esta línea base no pudo terminar porque la conexión de Prisma al servicio de base de datos fue rechazada (`ECONNREFUSED`).

## Control SEO tras cada despliegue

- Comprobar que `/robots.txt` responde `200`, permite rastrear las páginas públicas y enlaza a `https://datosbizi.com/sitemap.xml`.
- Comprobar que `/sitemap.xml` devuelve XML no vacío, contiene solo URLs canónicas y no incluye rutas que redirigen.
- Ejecutar `bun run qa:audit` en CI y revisar `sitemap_entries`, `sitemap_redirected_entries` y `sitemap_missing_from_sitemap`.
- Validar en Search Console el sitemap y solicitar rastreo solo de páginas nuevas o corregidas.
- Tras publicar, revisar una muestra de páginas indexables para confirmar `title`, `description`, canonical, robots y JSON-LD.
