FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm config set store-dir /app/.pnpm-store && pnpm install --frozen-lockfile

FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm prisma generate
RUN DATABASE_URL=file:/app/bootstrap.db pnpm prisma migrate deploy --schema prisma/schema.prisma
RUN pnpm run build

FROM oven/bun:1.3.10-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL=file:/data/dev.db
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update && apt-get install -y --no-install-recommends curl wget openssl && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /data
COPY --from=builder /app/bootstrap.db /app/bootstrap.db
RUN cp /app/bootstrap.db /data/dev.db
COPY ops/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
COPY --from=builder /app/public ./public
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 CMD curl -fsS http://127.0.0.1:3000/api/health/live >/dev/null || exit 1
CMD ["/app/docker-entrypoint.sh"]
