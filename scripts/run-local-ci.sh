#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTAINER_NAME="${QA_POSTGRES_CONTAINER:-bizidashboard-qa-postgres-local}"
DB_PORT="${QA_DB_PORT:-5433}"
APP_PORT="${QA_APP_PORT:-3100}"
REPORT_PATH="${QA_AUDIT_OUTPUT:-ops/site-audit-report-local-ci.json}"
LOG_PATH="${QA_SERVER_LOG:-/tmp/bizidashboard-local-ci.log}"

RUN_INSTALL=1
RUN_PLAYWRIGHT_INSTALL=1
REUSE_POSTGRES=0
KEEP_POSTGRES=0
STARTED_POSTGRES=0
SERVER_PID=""
HAS_BUN=0
USE_EXTERNAL_DB=0

print_help() {
  cat <<'EOF'
Usage: ./scripts/run-local-ci.sh [options]

Runs the same quality gate locally with a disposable Postgres container:
install, Prisma generate/migrate, seed, lint, tests, build, standalone server,
Playwright navigation E2E, crawl audit, and audit gate.

Options:
  --skip-install             Skip bun install --frozen-lockfile
  --skip-playwright-install  Skip browser installation
  --reuse-postgres           Reuse an existing local Postgres container
  --keep-postgres            Keep the Postgres container after the run
  --external-db              Use an existing DATABASE_URL instead of Docker Postgres
  --help                     Show this help

Environment overrides:
  QA_DB_PORT=5433
  QA_APP_PORT=3100
  QA_POSTGRES_CONTAINER=bizidashboard-qa-postgres-local
  QA_AUDIT_OUTPUT=ops/site-audit-report-local-ci.json
  QA_SERVER_LOG=/tmp/bizidashboard-local-ci.log
EOF
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

log_step() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$1"
}

docker_ready() {
  docker info >/dev/null 2>&1
}

run_script() {
  local script_name="$1"
  shift

  if [[ "$HAS_BUN" -eq 1 ]]; then
    bun run "$script_name" "$@"
    return
  fi

  if [[ $# -gt 0 ]]; then
    npm run "$script_name" -- "$@"
    return
  fi

  npm run "$script_name"
}

run_tool() {
  local tool_name="$1"
  shift

  if [[ "$HAS_BUN" -eq 1 ]]; then
    bunx "$tool_name" "$@"
    return
  fi

  npx "$tool_name" "$@"
}

cleanup() {
  local exit_code=$?

  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" >/dev/null 2>&1 || true
  fi

  if [[ "$KEEP_POSTGRES" -eq 0 && "$STARTED_POSTGRES" -eq 1 ]]; then
    docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
  fi

  exit "$exit_code"
}

trap cleanup EXIT

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-install)
      RUN_INSTALL=0
      ;;
    --skip-playwright-install)
      RUN_PLAYWRIGHT_INSTALL=0
      ;;
    --reuse-postgres)
      REUSE_POSTGRES=1
      ;;
    --keep-postgres)
      KEEP_POSTGRES=1
      ;;
    --external-db)
      USE_EXTERNAL_DB=1
      ;;
    --help)
      print_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      print_help
      exit 1
      ;;
  esac
  shift
done

require_command curl
require_command lsof

if command -v bun >/dev/null 2>&1; then
  HAS_BUN=1
else
  require_command npm
  require_command npx
  require_command node
  echo "bun is not installed; falling back to npm/npx and node for local QA." >&2
fi

cd "$ROOT_DIR"

if lsof -iTCP:"$APP_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $APP_PORT is already in use. Set QA_APP_PORT to another port." >&2
  exit 1
fi

if [[ "$USE_EXTERNAL_DB" -eq 1 ]]; then
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "DATABASE_URL is required when using --external-db." >&2
    exit 1
  fi
else
  require_command docker

  if ! docker_ready; then
    echo "Docker is not available. Start Docker or rerun with --external-db and DATABASE_URL set." >&2
    exit 1
  fi

  if [[ "$REUSE_POSTGRES" -eq 1 ]]; then
    if ! docker ps --format '{{.Names}}' | grep -Fx "$CONTAINER_NAME" >/dev/null 2>&1; then
      echo "Container $CONTAINER_NAME is not running, so it cannot be reused." >&2
      exit 1
    fi
  else
    if docker ps -a --format '{{.Names}}' | grep -Fx "$CONTAINER_NAME" >/dev/null 2>&1; then
      docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
    fi

    log_step "Starting local Postgres container"
    docker run -d \
      --name "$CONTAINER_NAME" \
      -e POSTGRES_DB=bizidashboard \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=postgres \
      -p "${DB_PORT}:5432" \
      postgres:16 >/dev/null
    STARTED_POSTGRES=1
  fi

  log_step "Waiting for Postgres"
  for attempt in $(seq 1 60); do
    if docker exec "$CONTAINER_NAME" pg_isready -U postgres -d bizidashboard >/dev/null 2>&1; then
      break
    fi

    if [[ "$attempt" -eq 60 ]]; then
      echo "Postgres did not become ready in time." >&2
      exit 1
    fi

    sleep 2
  done

  export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:${DB_PORT}/bizidashboard?schema=zaragoza"
fi

export CITY="zaragoza"
export APP_URL="http://127.0.0.1:${APP_PORT}"
export ROBOTS_BASE_URL="$APP_URL"
export PLAYWRIGHT_BASE_URL="$APP_URL"
export JWT_SECRET="ci-jwt-secret"
export SIGNATURE_SECRET="ci-signature-secret"
export NODE_ENV="test"
export CI="true"

if [[ "$RUN_INSTALL" -eq 1 ]]; then
  log_step "Installing dependencies"
  if [[ "$HAS_BUN" -eq 1 ]]; then
    bun install --frozen-lockfile
  else
    npm install --no-package-lock
  fi
fi

log_step "Generating Prisma Client"
run_tool prisma generate

log_step "Running Prisma migrations"
run_tool prisma migrate deploy

log_step "Seeding QA database"
run_script qa:seed

log_step "Running lint"
run_script lint

log_step "Running unit tests"
run_script test

log_step "Building standalone app"
run_script build

if [[ "$RUN_PLAYWRIGHT_INSTALL" -eq 1 ]]; then
  log_step "Installing Playwright browser"
  case "$(uname -s)" in
    Linux)
      run_tool playwright install --with-deps chromium
      ;;
    *)
      run_tool playwright install chromium
      ;;
  esac
fi

log_step "Starting standalone server"
if [[ "$HAS_BUN" -eq 1 ]]; then
  HOSTNAME=127.0.0.1 PORT="$APP_PORT" bun run start:bun >"$LOG_PATH" 2>&1 &
else
  HOSTNAME=127.0.0.1 PORT="$APP_PORT" node .next/standalone/server.js >"$LOG_PATH" 2>&1 &
fi
SERVER_PID=$!

log_step "Waiting for app readiness"
for attempt in $(seq 1 60); do
  if curl -fsS "${APP_URL}/dashboard" >/dev/null 2>&1; then
    break
  fi

  if [[ "$attempt" -eq 60 ]]; then
    echo "Application did not become ready in time." >&2
    cat "$LOG_PATH" >&2 || true
    exit 1
  fi

  sleep 2
done

log_step "Running navigation E2E"
run_script test:e2e tests/e2e/public-navigation.spec.ts tests/e2e/dashboard-navigation-and-filters.spec.ts

log_step "Running site audit"
run_script qa:audit --base-url "$APP_URL" --output "$REPORT_PATH"

log_step "Enforcing QA audit gate"
run_script qa:audit:check --input "$REPORT_PATH"

log_step "Local CI quality gate passed"
echo "Audit report: $ROOT_DIR/$REPORT_PATH"
echo "Server log: $LOG_PATH"
