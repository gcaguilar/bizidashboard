# CI/CD Migrations Setup

## GitHub Actions Secret

The migrations workflow reads the database connection string from the
`DATABASE_URL` GitHub Actions secret.

Add it in:

`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

### Format

- SQLite (prod file): `file:./prod.db`
- PostgreSQL/TimescaleDB: `postgresql://user:pass@host:5432/dbname`

## Health Check

`pnpm run db:health` validates connectivity and confirms migrations are reachable.
The workflow runs it after `prisma migrate deploy` on `main`.

## Current quality gates in CI

The main `CI` workflow currently validates:

- `bun run lint`
- `bun run test`
- `bun run build`

Additional QA checks (`qa:validate:site-env`, site audit, dependency audit, and smoke E2E) are kept as opt-in scripts for local runs or separate workflows.

## CSP rollout notes

When hardening CSP in `next.config.ts`:

- Validate staging first with `CSP_REPORT_ONLY=true`.
- Keep Sentry/Umami domains in `script-src` and `connect-src`.
- Verify browser error events (Sentry) and pageview/event delivery (Umami) before enforcing strict mode.
