# syntax=docker/dockerfile:1
# ── Imagen dedicada al agente social (Instagram vía Buffer) ──────────
# Deliberadamente separada de `jobs.Dockerfile`: el `CMD` es unico y no hay
# variable de entorno que elija el proceso. Una imagen con dos entrypoints y un
# selector (`SOCIAL_ONLY`) fallaba en silencio al desplegar: el contenedor
# arrancaba el proceso de jobs y no se veia ni una linea `social.*` en los logs.
#
# Al no usar `ops/docker-entrypoint.sh`, este contenedor no crea schemas ni
# ejecuta `prisma migrate deploy`: solo lee analitica. Las migraciones son
# responsabilidad de los contenedores web/jobs, asi que no compiten aqui.
# El schema de Postgres se selecciona en la conexion (`search_path` desde
# `CITY`), sin depender de que la URL lleve `?schema=`.

# ── deps: install all dependencies (dev + prod) ─────────────────────
FROM oven/bun:1.4.4 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# ── prod-deps: runtime dependencies only ────────────────────────────
FROM oven/bun:1.4.4 AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production

# ── builder: generate prisma client & compile the social entrypoint ──
FROM oven/bun:1.4.4 AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Generate prisma client
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/bizidashboard" bunx prisma generate

# Compile once during image build so the runtime runs JS, not TS.
RUN bun build src/jobs/social-standalone.ts --target=bun --outfile=/app/dist/jobs/social-standalone.js --packages=external

# ── runner: minimal production image ────────────────────────────────
FROM oven/bun:1.4.4-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends wget openssl libpq5 && rm -rf /var/lib/apt/lists/*

# Prisma generated client
COPY --from=builder /app/src/generated /app/src/generated

# GeoJSON de distritos (los slots leen `public/data` desde `process.cwd()`).
COPY --from=builder /app/public /app/public

# Fuentes Inter del render social (stories y carruseles).
COPY --from=builder /app/assets/og-fonts /app/assets/og-fonts

# Production node_modules
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/dist/jobs/social-standalone.js /app/dist/jobs/social-standalone.js
COPY --from=builder /app/scripts/start-social.mjs /app/scripts/start-social.mjs

# Prisma client resolution
RUN mkdir -p /app/node_modules/.prisma/client && \
    cp -a /app/src/generated/prisma/* /app/node_modules/.prisma/client/ && \
    echo 'module.exports = require("./client")' > /app/node_modules/.prisma/client/default.js

EXPOSE 3000

# Health server en PORT/3000 y, detras, los cuatro cron sociales. Sin selector.
CMD ["bun", "scripts/start-social.mjs"]
