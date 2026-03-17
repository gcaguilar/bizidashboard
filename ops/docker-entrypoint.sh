#!/bin/sh

set -eu

if [ -z "$DATABASE_URL" ]; then
  echo "[Entrypoint] DATABASE_URL is required"
  exit 1
fi

CITY="${CITY:-zaragoza}"
DB_NAME="${DATABASE_URL##*/}"

echo "[Entrypoint] City: $CITY (database: $DB_NAME)..."

# First, create the schema
echo "[Entrypoint] Creating schema $CITY..."
bun run /app/ops/create-schema.ts

# Then run Prisma db push (prisma.config.ts handles schema)
echo "[Entrypoint] Running Prisma db push..."
bunx prisma db push

echo "[Entrypoint] Starting application for $CITY..."
exec bun server.js
