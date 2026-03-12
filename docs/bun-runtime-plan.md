# Bun Runtime Plan

Objetivo: mantener `pnpm` como gestor de dependencias y flujo de desarrollo, pero usar `bun` solo como runtime del contenedor de produccion.

## Estado actual

- Dependencias y lockfile gestionados por `pnpm`.
- Build de Next.js y Prisma sigue ejecutandose con Node.js.
- Runtime del contenedor preparado para ejecutar `server.js` con `bun`.
- Script local disponible: `pnpm start:bun`.

## Decision tecnica

- `pnpm` sigue siendo la fuente de verdad para instalar y actualizar dependencias.
- `bun` se usa solo para arrancar el servidor standalone generado por Next.js.
- Prisma mantiene `@prisma/adapter-libsql`, necesario para el acceso SQLite en runtime.
- `@libsql/client` llega de forma transitiva por el adapter, asi que no hace falta declararlo directo en `package.json`.

## Verificaciones recomendadas

1. Construir imagen Docker y comprobar que el entrypoint inicializa `bootstrap.db` correctamente.
2. Validar `bun server.js` con `DATABASE_URL` persistente en `/data/dev.db`.
3. Revisar healthcheck y endpoint `/api/health/live` en el contenedor final.
4. Confirmar que Coolify usa la nueva imagen/runtime sin asumir `node server.js`.

## Siguiente auditoria de dependencias

- Revisar si `tsx` puede quedarse solo en desarrollo.
- Verificar si `node-cron` sigue siendo necesario cuando los jobs internos se desplieguen externamente.
- Confirmar compatibilidad de `redis` y del adapter Prisma/libSQL bajo Bun en produccion real.
