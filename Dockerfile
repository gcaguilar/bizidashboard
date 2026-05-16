# ── deps: install all dependencies (dev + prod) ─────────────────────
FROM oven/bun:1.3.14 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install

# ── builder: generate prisma client & build TanStack Start ───────────
FROM oven/bun:1.3.14 AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_UMAMI_SCRIPT_SRC
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
ARG DATABASE_URL

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_UMAMI_SCRIPT_SRC=$NEXT_PUBLIC_UMAMI_SCRIPT_SRC
ENV NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID
ENV DATABASE_URL=$DATABASE_URL

RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/bizidashboard" bunx prisma generate
RUN bun run build

# ── runner: minimal production image ─────────────────────────────────
FROM oven/bun:1.3.14-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SENTRY_DSN=
ENV NEXT_PUBLIC_UMAMI_SCRIPT_SRC=
ENV NEXT_PUBLIC_UMAMI_WEBSITE_ID=

RUN apt-get update && apt-get install -y --no-install-recommends wget openssl libpq5 && rm -rf /var/lib/apt/lists/*

# TanStack Start output (repo currently builds into dist/)
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/public /app/public
# Prisma generated client (custom output in schema.prisma)
COPY --from=builder /app/src/generated /app/src/generated

# Prisma schema, migrations & config (for migrate deploy)
COPY --from=builder /app/prisma /app/prisma
COPY --from=builder /app/prisma.config.ts /app/prisma.config.ts

# Production node_modules (pg, @prisma/client, prisma CLI, etc.)
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

# Prisma client is generated to src/generated/prisma (custom output in schema.prisma)
# Copy files so @prisma/client/default.js can resolve them
RUN mkdir -p /app/node_modules/.prisma/client && \
    cp -a /app/src/generated/prisma/* /app/node_modules/.prisma/client/ && \
    echo 'module.exports = require("./client")' > /app/node_modules/.prisma/client/default.js

# Entrypoint & ops scripts
COPY ops/docker-entrypoint.sh /app/docker-entrypoint.sh
COPY ops/create-schema.ts /app/ops/create-schema.ts
COPY ops/fix-station-status-indexes.ts /app/ops/fix-station-status-indexes.ts
COPY ops/move-public-schema-to-city.ts /app/ops/move-public-schema-to-city.ts
COPY ops/start-server.mjs /app/ops/start-server.mjs
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD wget --spider -q http://127.0.0.1:3000/api/health/live || exit 1
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["bun", "run", "start"]
