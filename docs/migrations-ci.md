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

`npm run db:health` validates connectivity and confirms migrations are reachable.
The workflow runs it after `prisma migrate deploy` on `main`.
