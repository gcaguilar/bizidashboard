#!/bin/sh

set -eu

if [ -z "$DATABASE_URL" ]; then
  echo "[Entrypoint] DATABASE_URL is required"
  exit 1
fi

CITY="${CITY:-zaragoza}"
DB_NAME="${DATABASE_URL##*/}"

echo "[Entrypoint] City: $CITY (database: $DB_NAME)..."

echo "[Entrypoint] Creating schema $CITY..."
bun run /app/ops/create-schema.ts

echo "[Entrypoint] Running Prisma db push..."
bunx prisma db push --skip-generate --accept-data-loss

echo "[Entrypoint] Starting application for $CITY..."
exec bun server.js
