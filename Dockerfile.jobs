# ── deps: install all dependencies (dev + prod) ─────────────────────
FROM oven/bun:1.3.14 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install

# ── builder: generate prisma client ──────────────────────────────────
FROM oven/bun:1.3.14 AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Generate prisma client
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/bizidashboard" bunx prisma generate

# ── runner: minimal production image with pm2 ────────────────────────
FROM oven/bun:1.3.14-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends wget openssl libpq5 && rm -rf /var/lib/apt/lists/*

# Install pm2 globally
RUN bun install -g pm2

# Prisma generated client
COPY --from=builder /app/src/generated /app/src/generated

# Prisma schema & config
COPY --from=builder /app/prisma /app/prisma
COPY --from=builder /app/prisma.config.ts /app/prisma.config.ts

# Production node_modules
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

# Prisma client resolution
RUN mkdir -p /app/node_modules/.prisma/client && \
    cp -a /app/src/generated/prisma/* /app/node_modules/.prisma/client/ && \
    echo 'module.exports = require("./client")' > /app/node_modules/.prisma/client/default.js

# pm2 ecosystem config (embedded to avoid Coolify context issues)
RUN echo '{"apps":[{"name":"bizidashboard-jobs","script":"bun","args":"src/jobs/standalone.ts","cwd":"/app","instances":1,"autorestart":true,"watch":false,"max_memory_restart":"1G","env":{"NODE_ENV":"production"}}]}' > /app/ecosystem.config.js

EXPOSE 0

# pm2 will manage the process lifecycle (autorestart, logs, etc.)
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
