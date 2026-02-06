FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm config set store-dir /app/.pnpm-store && pnpm install --frozen-lockfile

FROM node:24-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.pnpm-store ./.pnpm-store
COPY . .
RUN corepack enable
RUN pnpm prisma generate
RUN DATABASE_URL=file:/app/bootstrap.db pnpm prisma migrate deploy --schema prisma/schema.prisma
RUN pnpm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL=file:/data/dev.db
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /data
COPY --from=builder /app/bootstrap.db /data/dev.db
COPY --from=builder /app/.pnpm-store ./.pnpm-store
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
VOLUME ["/data"]
EXPOSE 3000
CMD ["node", "server.js"]
