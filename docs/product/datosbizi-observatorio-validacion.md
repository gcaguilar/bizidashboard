# Validación de cierre del observatorio

## Matriz ejecutada

| Área | Rutas comprobadas | Evidencia |
| --- | --- | --- |
| Resumen y rendimiento | `/`, `/dashboard` | Smoke HTTP 200; suite Vitest |
| Comparativas e informes | `/comparar`, `/informes` y fichas mensuales | Smoke HTTP 200; pruebas de comparabilidad |
| Estado y método | `/estado`, `/metodologia` | Smoke HTTP 200; pruebas de vocabulario |
| Datos abiertos | `/developers` | Smoke HTTP 200; contrato Umami GDPR-minimal |
| Consulta individual | `/biciradar` | Smoke HTTP 200; ruta independiente de dashboard |
| Fichas públicas | `/estadisticas/estaciones`, `/estadisticas/barrios` | Smoke HTTP 200 |

Las rutas `/api/*`, URLs públicas, datos históricos, autenticación y BiciRadar no se han eliminado ni cambiado de contrato.

## Puerta de calidad

- `bun run lint`: verde (solo advertencias preexistentes).
- `bun run test`: verde, 497 pruebas.
- `bun run build`: verde.
- Smoke HTTP contra `https://datosbizi.com`: todas las rutas anteriores devolvieron HTTP 200.

La suite Playwright se intentó ejecutar contra producción, pero el binario Chromium disponible termina con `SIGTRAP` durante el arranque, antes de abrir una página. Debe repetirse en un runner Playwright operativo antes de publicar producción.

## Despliegue

El despliegue en staging y la observación de 24 horas requieren acceso al entorno de despliegue del proyecto. No se ejecutan automáticamente desde este repositorio; el commit previo de cada PR sirve como punto de rollback.
