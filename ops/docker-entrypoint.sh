#!/bin/sh

set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[Entrypoint] ERROR: DATABASE_URL is required"
  exit 1
fi

CITY="${CITY:-zaragoza}"
echo "[Entrypoint] City: $CITY"

# 1. Create the Postgres schema for this city
echo "[Entrypoint] Creating schema '$CITY'..."
bun run /app/ops/create-schema.ts

# 2. Append ?schema=<city> so Prisma targets the right schema
case "$DATABASE_URL" in
  *\?*) export DATABASE_URL="${DATABASE_URL}&schema=${CITY}" ;;
  *)    export DATABASE_URL="${DATABASE_URL}?schema=${CITY}" ;;
esac

# 3. Run pending migrations (safe, idempotent, no data loss)
echo "[Entrypoint] Running prisma migrate deploy..."
bunx prisma migrate deploy

# 4. Start the application
echo "[Entrypoint] Starting application..."
exec bun server.js
