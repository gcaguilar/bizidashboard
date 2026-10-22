# syntax=docker/dockerfile:1
# ── deps: install all dependencies (dev + prod) ─────────────────────
FROM oven/bun:1.4.3 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# ── prod-deps: runtime dependencies only (no vite, vitest, typescript…) ──
FROM oven/bun:1.4.3 AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production

# ── builder: generate prisma client & build TanStack Start ───────────
FROM oven/bun:1.4.3 AS builder
WORKDIR /app
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_APP_URL
ARG VITE_SENTRY_DSN
ARG VITE_SENTRY_TRACE_SAMPLE_RATE
ARG NEXT_PUBLIC_SENTRY_DSN
ARG SENTRY_DSN
ARG DATABASE_URL
ARG GIT_SHA
ARG BUILD_DATE
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT

ENV NEXT_TELEMETRY_DISABLED=1
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_SENTRY_TRACE_SAMPLE_RATE=$VITE_SENTRY_TRACE_SAMPLE_RATE
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
# Used both by the client build (via the Vite define fallback) and available to
# the server build; the runner stage receives the real value at runtime.
ENV SENTRY_DSN=$SENTRY_DSN
ENV DATABASE_URL=$DATABASE_URL
ENV GIT_SHA=$GIT_SHA
ENV BUILD_DATE=$BUILD_DATE
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT=$SENTRY_PROJECT

RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/bizidashboard" bunx prisma generate
RUN bun run build

# ── runner: minimal production image ─────────────────────────────────
FROM oven/bun:1.4.3-slim AS runner
WORKDIR /app
ARG GIT_SHA
ARG BUILD_DATE
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SENTRY_DSN=
ENV GIT_SHA=${GIT_SHA:-dev}
ENV BUILD_DATE=${BUILD_DATE:-}

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends wget openssl libpq5 && rm -rf /var/lib/apt/lists/*

# TanStack Start output (repo currently builds into dist/)
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/public /app/public
# Prisma generated client (custom output in schema.prisma)
COPY --from=builder /app/src/generated /app/src/generated
COPY --from=builder /app/src/lib/security/csp.mjs /app/src/lib/security/csp.mjs

# Prisma schema, migrations & config (for migrate deploy)
COPY --from=builder /app/prisma /app/prisma
COPY --from=builder /app/prisma.config.ts /app/prisma.config.ts

# Production node_modules (pg, @prisma/client, prisma CLI, playwright, etc.)
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

# Chromium headless para generar el PDF del informe desde la propia pagina.
# Solo se usa cuando el PDF de un mes aun no esta guardado.
RUN bunx playwright install --with-deps chromium && rm -rf /var/lib/apt/lists/*

# Prisma client is generated to src/generated/prisma (custom output in schema.prisma)
# Copy files so @prisma/client/default.js can resolve them
RUN mkdir -p /app/node_modules/.prisma/client && \
    cp -a /app/src/generated/prisma/* /app/node_modules/.prisma/client/ && \
    echo 'module.exports = require("./client")' > /app/node_modules/.prisma/client/default.js

# Entrypoint & ops scripts
COPY ops/docker-entrypoint.sh /app/docker-entrypoint.sh
COPY ops/create-schema.ts /app/ops/create-schema.ts
COPY ops/start-server.mjs /app/ops/start-server.mjs
COPY ops/validate-env.mjs /app/ops/validate-env.mjs
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:3000/api/health/ready || exit 1
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["bun", "run", "start"]
