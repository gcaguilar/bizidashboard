# 📑 Master Implementation Plan: Bizi Dashboard v2

**Objetivo:** Evolucionar el dashboard de Bizi hacia una herramienta multi-rol con métricas analíticas avanzadas, manteniendo el rendimiento y la estabilidad.

## 📍 Estado de avance (Mar 2026)

### Ya implementado

- [x] `viewMode` sincronizado con URL (`?mode=`) y rutas directas en `/dashboard/views/[mode]`
- [x] `DashboardLayout`, `WidgetSkeleton` y carga diferida de vistas por modo
- [x] Modo `overview` con resumen ejecutivo, mapa base, insights y flujo resumido
- [x] Modo `operations` con `Balance Index`, ranking de fricción, alertas y mapa con capa visual operativa
- [x] Modo `research` con patrones temporales, estabilidad, volatilidad y buffer reciente en memoria
- [x] Modo `data` con metodología, exportaciones CSV/JSON y catálogo de endpoints
- [x] Centralización de métricas en `useSystemMetrics`
- [x] Ayuda contextual, FAQs ampliadas, `FAQPage` y metadatos/JSON-LD clave
- [x] Tests de balance, frescura, URL sync, snapshots recientes y carga simulada del mapa

### Pendiente / siguiente foco recomendado

- [ ] Conectar un modelo real al endpoint `/api/predictions`
- [ ] Afinar más la diferencia visual entre modos sin penalizar rendimiento
- [ ] Medir en producción TTI/PageSpeed tras despliegue y ajustar según métricas reales
- [ ] Valorar una separación mayor de `MapEngine` si el mapa sigue creciendo

---

## 🏗 FASE 1: Infraestructura de Navegación y Estado

**Prioridad:** Crítica | **Objetivo:** Preparar el "esqueleto" del proyecto.

### [TASK-1.1] Sistema de ViewModes (Routing + State)

* **Acción:** Implementar un estado global `viewMode` (`overview` | `operations` | `research` | `data`).
* **Sincronización:** El estado debe vivir en la URL (ej: `?mode=operations`).
* **Componente:** Crear un `ModeHeader` con un `TabsControl` que permita switchar entre rutas.
* **Estructura de carpetas:** Crear `/views/[mode]` para separar la lógica de cada panel.

### [TASK-1.2] Layout Responsivo y Skeletons

* **Acción:** Definir un `DashboardLayout` que use CSS Grid para los widgets.
* **UX:** Crear `WidgetSkeleton` para evitar el layout shift mientras cargan los datos.

---

## 📊 FASE 2: Modo Overview (Visión Ejecutiva)

**Prioridad:** Alta | **Objetivo:** Resumen rápido para ciudadanos y prensa.

### [TASK-2.1] SystemHealthCard

* **Métricas:** Total estaciones, bicis disponibles, anclajes libres, % ocupación media.
* **Indicador:** `last_update` con timestamp relativo (ej: "Actualizado hace 2 min").

### [TASK-2.2] MapSimple (Capa Base)

* **Lógica:** Mapa con marcadores circulares. Color dinámico: Rojo (<10% o >90% ocupación), Verde (equilibrado).
* **Interacción:** Click en estación abre un popup minimalista.

### [TASK-2.3] CriticalStationsPanel & Insights

* **Lista:** Top 10 estaciones críticas (priorizando las que tienen 0 bicis o 0 anclajes).
* **DailyInsights:** Generador de texto rule-based (ej: "La zona centro presenta saturación alta").

---

## 🔧 FASE 3: Modo Operations (Gestión Operativa)

**Prioridad:** Alta | **Objetivo:** Herramientas para el operador del sistema.

### [TASK-3.1] Balance Index Metric

* **Implementar Fórmula:** 
$$Balance = 1 - \frac{2}{n} \sum_{i=1}^{n} | \text{occupancy}_i - 0.5 |$$


* **Visualización:** Gauge (velocímetro) que muestre el equilibrio global del sistema (0 a 1).

### [TASK-3.2] Bottleneck & Friction Ranking

* **Métrica:** `FrictionScore = (minutos_vacia + minutos_llena)`.
* **Componente:** Tabla ordenada de mayor a menor fricción en la última hora.

### [TASK-3.3] StationAlerts & OperationalMap

* **Alertas:** Lista de tarjetas con "Estación X: Vacía desde hace 20min".
* **Mapa:** Añadir capa de calor (Heatmap) basada en la demanda/fricción.

---

## 🧪 FASE 4: Modo Research (Análisis Urbano)

**Prioridad:** Media | **Objetivo:** Análisis de datos históricos para planificación.

### [TASK-4.1] Temporal Patterns (Gráficos)

* **Gráfico 1:** `UsageByHour` (Líneas). Ocupación media agregada por hora del día.
* **Gráfico 2:** `BikesInCirculation` ($Total - \sum AtStations$).

### [TASK-4.2] Station Stability & Heatmaps

* **Tabla:** Varianza de ocupación por estación.
* **Mapa Espacial:** Agregación por distritos (si el mapping está disponible) o densidad de estaciones.

### [TASK-4.3] Potential Flow Estimation

* **Algoritmo:** Identificar "corredores" donde una estación pierde bicis y otra cercana las gana en una ventana de 15-30 min.
* **Visualización:** Líneas de flujo (arcs) entre los top 5 corredores.

---

## 📂 FASE 5: Modo Data (Transparencia)

**Prioridad:** Media | **Objetivo:** Exportación y documentación.

### [TASK-5.1] Metadata & Methodology

* **Contenido:** Documentar en UI el origen de los datos (GBFS de Bizi Zaragoza).
* **Pipeline Status:** Mostrar si la última ingesta de datos fue exitosa.

### [TASK-5.2] Data Export Engine

* **Funcionalidad:** Botón "Exportar a CSV" para:
1. Estado actual de estaciones.
2. Ranking de fricción del día.
3. Métricas de balance históricas.



---

## ⚙️ FASE 6: Data Layer & Performance

**Prioridad:** Técnica | **Objetivo:** Asegurar fluidez.

### [TASK-6.1] Agregaciones de Backend/Store

* **Acción:** No calcular métricas pesadas en el render. Usar `useMemo` para el cálculo del Balance Index y Friction Score.
* **Cache:** Implementar un TTL de 60 segundos para las llamadas a la API de `station_status`.

---

## ✅ Definition of Done (Criterios de Aceptación Final)

1. **Navegación:** El usuario puede navegar por los 4 modos sin errores de consola.
2. **Performance:** El primer render (Overview) ocurre en menos de 1.5s.
3. **Matemáticas:** El `Balance Index` devuelve un valor entre 0 y 1.
4. **UI:** Consistencia en colores (Rojo = crítico, Verde = estable) en todos los modos.
5. **Exportación:** El CSV generado es válido y contiene los headers correctos.

---

## 🧪 Tests de Validación para el Agente

* `test_balance_calculation`: Validar que con todas las estaciones al 50%, el índice sea 1.0.
* `test_url_sync`: Validar que cambiar el tab actualiza el parámetro `?mode=` en la URL.
* `test_empty_states`: Validar que si no hay datos de una estación, el widget no rompe la app (optional chaining).


## 🏗 FASE 7: Refactor de Lógica y Capa de Datos (Backend/Store)

**Prioridad:** Alta | **Objetivo:** Centralizar el cálculo de métricas para evitar inconsistencias entre vistas.

### [TASK-7.1] Centralización de Métricas (Computed State)

* [x] **Acción:** Crear un selector o hook centralizado (`useSystemMetrics`) que derive:
* `friction_score`: suma de minutos en estado crítico (0 o 100%) por estación.
* `balance_index`: Aplicar la fórmula normalizada:

$$Balance = 1 - \frac{2}{n} \sum_{i=1}^{n} | \text{occupancy}_i - 0.5 |$$




* [x] **Criterio de Aceptación:** Cualquier componente que llame al hook debe recibir el mismo valor exacto de balance.

### [TASK-7.2] Histórico In-Memory para Research

* [x] **Acción:** Si no hay DB histórica, implementar un "buffer" en el cliente que guarde los últimos 20 snapshots recibidos por WebSockets/Polling para permitir gráficas de tendencia inmediata.

---

## 🎨 FASE 8: Pulido Visual y UX (Design System)

**Prioridad:** Media | **Objetivo:** Asegurar que la interfaz sea profesional y coherente.

### [TASK-8.1] Adaptación de Estilos por Modo

* [ ] **Acción:** Aplicar temas visuales ligeros:
* **Overview:** Minimalista, fuentes grandes, mucho espacio en blanco.
* **Operations:** Dark mode (opcional) o alto contraste, tablas densas, alertas con parpadeo suave.
* **Research:** Enfoque en visualización de datos, ejes de gráficos claros, leyendas interactivas.



### [TASK-8.2] Sistema de Tooltips y Ayuda Contextual

* [x] **Acción:** Añadir iconos de info (`i`) en métricas complejas (Balance, Fricción) que expliquen la fórmula al hacer hover.

---

## 🧪 FASE 9: Suite de Testing y Calidad

**Prioridad:** Media | **Objetivo:** Garantizar que el dashboard es "irrompible".

### [TASK-9.1] Tests Unitarios de Lógica

* [x] **Test:** `calculate_balance` debe retornar `1.0` si todas las estaciones están al 50%.
* [x] **Test:** `calculate_balance` debe retornar `0.0` si todas las estaciones están al 0% o 100%.
* [x] **Test:** `format_timestamp` debe manejar errores de red y mostrar "Desconectado" si los datos tienen >10 min de antigüedad.

### [TASK-9.2] Test de Carga (Simulado)

* [x] **Acción:** Validar que el mapa no se bloquea (frame drop) al renderizar 130+ estaciones con capas de calor activas en el modo **Operations**.

---

## 🚀 FASE 10: Preparación para Futuro (Roadmap Técnico)

**Prioridad:** Baja | **Objetivo:** Dejar el código listo para escalabilidad.

### [TASK-10.1] Hooks para ML (Predictivo)

* [x] **Acción:** Dejar preparada la estructura de datos para recibir un endpoint de `/predictions` que pinte la ocupación estimada en T+30min.

---

## 🏁 Definición de "Hecho" (Final DoD)

1. **Multimodalidad:** Los 4 modos (`Overview`, `Operations`, `Research`, `Data`) son funcionales y distintos.
2. **Precisión Matemática:** Las métricas de balance y fricción siguen las fórmulas especificadas.
3. **Performance:** El bundle no ha crecido excesivamente y el *Time to Interactive* es < 2s.
4. **Exportación:** El usuario puede bajar los datos en CSV/JSON desde el modo Data.
5. **Persistencia:** La URL refleja exactamente lo que el usuario está viendo (filtros, modo, zoom del mapa).

---

### 💡 Consejo para el Agente (System Prompt Add-on)

> "Cuando implementes los modos, prioriza la **componetización**. No dupliques la lógica del mapa; usa un único componente `MapEngine` que acepte `layers` como props según el `viewMode` activo."

---
