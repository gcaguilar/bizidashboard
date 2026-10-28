# syntax=docker/dockerfile:1
# ── deps: install all dependencies (dev + prod) ─────────────────────
FROM oven/bun:1.4.4 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# ── prod-deps: runtime dependencies only (no vite, vitest, typescript…) ──
FROM oven/bun:1.4.4 AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production

# ── builder: generate prisma client & compile jobs ───────────────────
FROM oven/bun:1.4.4 AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Generate prisma client
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/bizidashboard" bunx prisma generate

# Compile the jobs entrypoint once during image build so pm2 runs JS, not TS.
RUN bun build src/jobs/standalone.ts --target=bun --outfile=/app/dist/jobs/standalone.js --packages=external

# ── runner: minimal production image with pm2 ────────────────────────
FROM oven/bun:1.4.4-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends wget openssl libpq5 && rm -rf /var/lib/apt/lists/*

# Prisma generated client
COPY --from=builder /app/src/generated /app/src/generated

# Prisma schema & config
COPY --from=builder /app/prisma /app/prisma
COPY --from=builder /app/prisma.config.ts /app/prisma.config.ts

# Static data read by server modules (district GeoJSON). El prewarm de
# redistribucion construye el mismo informe que el servidor web, asi que
# necesita el fichero para asignar barrios.
COPY --from=builder /app/public /app/public

# Fuentes Inter del render social (stories y carruseles).
COPY --from=builder /app/assets/og-fonts /app/assets/og-fonts

# Production node_modules
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/dist/jobs /app/dist/jobs

# Entrypoint scripts create the city schema, append ?schema=<CITY>, and run migrations.
COPY --from=builder /app/ops/docker-entrypoint.sh /app/docker-entrypoint.sh
COPY --from=builder /app/ops/create-schema.ts /app/ops/create-schema.ts
COPY --from=builder /app/ops/start-jobs.mjs /app/ops/start-jobs.mjs
COPY --from=builder /app/ops/validate-env.mjs /app/ops/validate-env.mjs
RUN chmod +x /app/docker-entrypoint.sh

# Prisma client resolution
RUN mkdir -p /app/node_modules/.prisma/client && \
    cp -a /app/src/generated/prisma/* /app/node_modules/.prisma/client/ && \
    echo 'module.exports = require("./client")' > /app/node_modules/.prisma/client/default.js

EXPOSE 3000

# Docker/Coolify manages lifecycle; the process runs compiled JavaScript directly.
# El agente social tiene su propia imagen (`social.Dockerfile`) con un CMD unico:
# en esta imagen ya no hay selector de entrypoint que pueda arrancar otro proceso.
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["sh", "-c", "echo jobs.image.compiled_entrypoint && exec bun ops/start-jobs.mjs"]
