#!/bin/sh

set -eu

DEFAULT_DB_URL="file:/data/dev.db"
DB_URL="${DATABASE_URL:-$DEFAULT_DB_URL}"

case "$DB_URL" in
  file:./*|file:../*|file:dev.db|file:./dev.db)
    echo "[Entrypoint] DATABASE_URL relativo detectado ($DB_URL). Usando $DEFAULT_DB_URL en produccion."
    DB_URL="$DEFAULT_DB_URL"
    export DATABASE_URL="$DB_URL"
    ;;
esac

if [ "${DB_URL#file:}" != "$DB_URL" ]; then
  DB_PATH="${DB_URL#file:}"
  DB_DIR="$(dirname "$DB_PATH")"
  SHOULD_BOOTSTRAP=false

  mkdir -p "$DB_DIR"

  if [ ! -s "$DB_PATH" ]; then
    SHOULD_BOOTSTRAP=true
  elif ! ENTRYPOINT_DB_PATH="$DB_PATH" bun -e "const { DatabaseSync } = require('node:sqlite'); const db = new DatabaseSync(process.env.ENTRYPOINT_DB_PATH, { readonly: true }); const row = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' AND name='StationStatus'\").get(); db.close(); if (!row) { process.exit(1); }"; then
    SHOULD_BOOTSTRAP=true
  fi

  if [ "$SHOULD_BOOTSTRAP" = true ] && [ -f /app/bootstrap.db ]; then
    echo "[Entrypoint] Inicializando base SQLite en $DB_PATH desde /app/bootstrap.db"
    cp /app/bootstrap.db "$DB_PATH"
  fi
fi

exec bun server.js
