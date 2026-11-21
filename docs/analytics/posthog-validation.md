# Validación real en PostHog (Fase 10)

Fecha: 2026-11-21. Proyecto inspeccionado: `358992` ("Default project", región EU, `https://eu.posthog.com`).
Acceso: sesión del equipo, sin credenciales en el repositorio (`POSTHOG_KEY` vacío en `.env.example`).

## Resultado sobre los datos desplegados actualmente

| Comprobación | Resultado |
|---|---|
| Eventos presentes en el proyecto (todo el histórico) | `public_page_view`, `dashboard_page_view`, `cta_click`, `observatory_brief_viewed`, `api_docs_opened`, `Opt in`, `Anomaly score` (interno de PostHog) |
| `$pageview` | **Ausente** |
| `$pageleave` | **Ausente** |
| Web Analytics — visitantes | 0 |
| Web Analytics — page views | 0 |
| Web Analytics — sesiones | 0 |
| Web Analytics — duración / bounce rate | Sin datos |
| Session Recording | Desactivado (todas las filas muestran "View recording" deshabilitado) |
| Heatmaps / dead clicks / rage clicks | Sin datos; `Frustrating Pages` vacío |

### Causa raíz

Los eventos disponibles tienen `sent_at = 2026-11-20T08:28:45Z` (09:28 CET). El commit que
añadió la emisión de `$pageview` (`9be6ad52`) y el que habilitó GeoIP (`e43e750b`) son de
**09:35 CET del mismo día**, siete minutos después. El despliegue que generó esos datos es,
por tanto, anterior a ambas funcionalidades: Web Analytics no podía recibir `$pageview`.

Prueba adicional: las propiedades de esos eventos incluyen `GeoIP disabled: true`, valor que
el commit `e43e750b` eliminó. La política de privacidad ya documenta el GeoIP aproximado
actual, así que la config del repositorio y la del despliegue inspeccionado no coinciden.

## Auditoría de propiedades de un evento real (`public_page_view`)

Propiedades propias: `surface=public`, `route_key=biciradar`, `page_type=product`, `template=biciradar`.
Propiedades del SDK: `distinct_id` y `device_id` anónimos, `$session_id`, `$insert_id`,
`person profile processing flag = false`, `Is identified = false`, `Library version = 1.453.0`,
`$current_url=https://datosbizi.com/biciradar`, referrer interno, sin `utm_*`/`gclid`/`fbclid`,
sin email, nombre, teléfono ni IDs de estación.

Conclusión de privacidad sobre datos reales: **no se observa información personal**. Los
identificadores presentes son los seudónimos que PostHog necesita para Web Analytics y ya
están descritos en `src/app/privacidad.tsx`. No hay grabaciones.

## Estado de la corrección en el repositorio

Los commits de esta rama ya corrigen la causa y endurecen el resto del ciclo:

- El SDK es el único dueño de `$pageview` (`capture_pageview: 'history_change'`) y emite
  `$pageleave` con `capture_pageleave: 'if_capture_pageview'`. Se eliminó el capture manual
  duplicado.
- Un único listener de consentimiento gobierna el SDK en todas las pestañas; la retirada
  limpia la clave de consentimiento y el almacenamiento de PostHog.
- `save_campaign_params: false` y `save_referrer: false` evitan identificadores de campaña.
- Las rutas con IDs se normalizan (`/estaciones/:id`, `/informes/:month`, ...) antes del envío.
- `before_send` elimina `$set`, `$set_once`, `$ip`, secretos y parámetros de URL, conservando
  el token del proyecto.
- El catálogo tipado y el sanitizador por evento impiden propiedades arbitrarias o texto libre.

## Pendiente (no ejecutable en esta sesión)

La validación **post-despliegue** requiere publicar `main` y repetir el recorrido. Sin clave de
staging ni acceso al despliegue no se han podido generar eventos nuevos sin contaminar el
proyecto de producción. Checklist para el equipo:

1. Entrar sin aceptar analítica → verificar que no llega ningún evento al Activity en vivo.
2. Aceptar → verificar **un** `$pageview` inicial y **un** `$pageleave` al salir.
3. Navegar por 3 rutas SPA → verificar exactamente un `$pageview` por cambio de ruta (sin duplicados).
4. Ejecutar una búsqueda → `search_submit`, `search_results_view`/`search_no_results`, `search_result_select`.
5. Aplicar/limpiar filtros, cambiar pestañas y ordenar → `filter_change`, `filter_clear`, `tab_change`, `sort_change`.
6. Abrir/cerrar paneles, seleccionar entidades, exportar → eventos correspondientes y `export_success`/`export_error`.
7. Provocar un error controlado y un estado vacío → `operation_error` / `form_validation_error` / `empty_state_view`.
8. Retirar el consentimiento → dejar de recibir eventos (los ya encolados en la librería pueden flush una vez; ver `privacy-audit.md`).
9. En Web Analytics confirmar visitantes, páginas populares, fuentes, sesiones y duración.
   El bounce rate tiene requisitos adicionales de captura: no asumir que aparece solo con `$pageview`.
10. Comprobar que los seis dashboards consumen los nombres y propiedades documentados en
    `dashboards.md`, y que no aparecen `identify`, grabaciones ni propiedades sensibles.

**Criterio de cierre:** no dar por terminada la tarea hasta completar este checklist sobre el
despliegue que incluya estos commits.
