# ── deps: install all dependencies (dev + prod) ─────────────────────
FROM oven/bun:1.3.10 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ── builder: generate prisma client & build Next.js ──────────────────
FROM oven/bun:1.3.10 AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN bunx prisma generate
RUN bun run build

# ── prodeps: production dependencies + prisma CLI for migrations ─────
FROM oven/bun:1.3.10 AS prodeps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --production
# Prisma CLI is a devDependency — copy it for `prisma migrate deploy`
COPY --from=deps /app/node_modules/prisma ./node_modules/prisma
# Generated prisma client from builder stage
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# ── runner: minimal production image ─────────────────────────────────
FROM oven/bun:1.3.10-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y --no-install-recommends wget openssl libpq5 && rm -rf /var/lib/apt/lists/*

# Next.js standalone output (includes its own bundled node_modules)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Production node_modules (pg, @prisma/client, prisma CLI, etc.)
COPY --from=prodeps /app/node_modules ./node_modules

# Prisma schema, migrations & config (for migrate deploy)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Entrypoint & ops scripts
COPY ops/docker-entrypoint.sh /app/docker-entrypoint.sh
COPY ops/create-schema.ts /app/ops/create-schema.ts
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD wget --spider -q http://127.0.0.1:3000/api/health/live || exit 1
CMD ["/app/docker-entrypoint.sh"]
