FROM oven/bun:latest AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:latest AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl curl libpq-dev && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG JWT_SECRET=production-secret-change-me
ARG SIGNATURE_SECRET=production-secret-change-me
ENV NEXT_TELEMETRY_DISABLED=1
ENV JWT_SECRET=$JWT_SECRET
ENV SIGNATURE_SECRET=$SIGNATURE_SECRET
RUN bunx prisma generate
RUN bun run build

FROM oven/bun:latest AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y --no-install-recommends wget libpq5 && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY ops/docker-entrypoint.sh /app/docker-entrypoint.sh
COPY ops/create-schema.ts /app/ops/create-schema.ts
RUN chmod +x /app/docker-entrypoint.sh
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 CMD wget --spider -q http://127.0.0.1:3000/api/health/live || exit 1
CMD ["/app/docker-entrypoint.sh"]
