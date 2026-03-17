#!/bin/sh

set -eu

if [ -z "$DATABASE_URL" ]; then
  echo "[Entrypoint] DATABASE_URL is required"
  exit 1
fi

CITY="${CITY:-zaragoza}"
DB_NAME="${DATABASE_URL##*/}"

echo "[Entrypoint] Running Prisma migrations for city: $CITY (database: $DB_NAME)..."
DATABASE_URL="$DATABASE_URL" bunx prisma db push --url "$DATABASE_URL"

if [ -n "$SQLITE_SOURCE_PATH" ] && [ -f "$SQLITE_SOURCE_PATH" ]; then
  echo "[Entrypoint] Checking if data migration is needed from: $SQLITE_SOURCE_PATH"
  
  DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^/]+)/.*|\1|')
  DB_USER=$(echo "$DATABASE_URL" | sed -E 's|.*://([^:]+):.*|\1|')
  DB_PASS=$(echo "$DATABASE_URL" | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|')
  
  STATION_COUNT=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM Station;" 2>/dev/null || echo "0")
  STATION_COUNT=$(echo "$STATION_COUNT" | xargs)
  
  if [ "$STATION_COUNT" = "0" ] || [ -z "$STATION_COUNT" ]; then
    echo "[Entrypoint] PostgreSQL is empty (Station count: $STATION_COUNT), migrating data from SQLite..."
    
    SQLITE_URL="file:$SQLITE_SOURCE_PATH" DATABASE_URL="$DATABASE_URL" bun run scripts/migrate-sqlite-to-postgres.ts
    
    NEW_COUNT=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM Station;" 2>/dev/null | xargs)
    echo "[Entrypoint] Migration complete! Station count: $NEW_COUNT"
  else
    echo "[Entrypoint] PostgreSQL already has data ($STATION_COUNT stations), skipping migration"
  fi
else
  echo "[Entrypoint] No SQLite source path provided, skipping data migration"
fi

echo "[Entrypoint] Starting application for $CITY..."
exec bun server.js
