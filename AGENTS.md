# AGENTS.md

Project instructions for Codex working in `gcaguilar/bizidashboard`.

## Mission

Work like a careful maintainer of a production analytics platform for GBFS-based bike-share systems. Prefer minimal, reversible, well-tested changes that preserve schema-per-city correctness, observability, and API stability.

## Source of truth

When docs and code disagree, trust code and config first.

Priority order:
1. `package.json`
2. `prisma/schema.prisma`
3. `src/**`
4. `tests/**`
5. `next.config.ts`, `prisma.config.ts`, `Dockerfile`, `docker-compose.yml`, `ops/**`
6. `README.md`, `PLAN.md`, `docs/**`

Do not assume older README guidance is current. Verify the live repo state before acting.

## Repository shape

- `src/app`: Next.js App Router pages, layouts, API routes
- `src/jobs`: collection and aggregation jobs
- `src/services`: upstream fetch, validation, persistence
- `src/analytics`: SQL helpers, time buckets, retention, locks, watermarks
- `src/lib`: DB access, schema routing, security, logging, request context, cache
- `src/schemas`: Zod/runtime schemas
- `prisma`: schema and migrations
- `ops`: operational scripts and runtime helpers
- `tests`: Vitest and Playwright

## Stack assumptions

- Next.js App Router
- TypeScript
- Bun package manager/runtime entry
- Prisma with PostgreSQL
- Redis present
- Sentry present
- Vitest for unit/integration tests
- Playwright for e2e tests

## Hard rules

### Database
- PostgreSQL-first only.
- Multi-tenancy is by PostgreSQL schema, not by table prefix.
- Respect `CITY` to schema routing and schema normalization.
- Avoid destructive schema changes unless explicitly requested.
- Treat raw SQL as PostgreSQL-only.

### API and security
- Follow existing `src/app/api/**/route.ts` patterns.
- Reuse `withApiRequest(...)` and existing security helpers when applicable.
- Keep handlers thin and move real logic to `lib/`, `services/`, or `analytics/`.
- Do not weaken auth, API key checks, signatures, origin controls, or rate limits.
- Preserve response shape and important headers.

### Jobs and analytics
- Preserve job locking, dedupe, watermark, and observability behavior.
- Be explicit about timezone assumptions and bucket boundaries.
- Avoid changing retention or aggregation semantics casually.

### Logging and errors
- Use structured logging.
- Include useful identifiers like `requestId`, `collectionId`, route, city, and duration.
- Never log secrets or raw tokens.
- Keep Sentry/error capture behavior intact.

## Commands

Prefer existing scripts from `package.json`.

```bash
bun install
bun run dev
bun run build
bun run start
bun run lint
bun run test
bun run test:e2e
bun run db:health
```

When validating work, run the smallest relevant test scope first.

## Change strategy

For implementation work:
1. Inspect adjacent files and mirror the nearest existing pattern.
2. Make the smallest correct change.
3. Preserve current abstractions unless there is a clear defect.
4. Add or update tests.
5. Summarize impact and risks.

For debugging:
1. Check env/config assumptions.
2. Check city/schema selection.
3. Check route/service/job boundaries.
4. Check tests and expected contracts.
5. Only then consider larger refactors.

## Good changes

Prefer:
- extending an existing helper over creating a new parallel helper
- typed end-to-end changes
- explicit error handling
- deterministic analytics logic
- focused tests

Avoid:
- broad refactors without need
- mixing UI, DB, and fetch logic in one file
- bypassing validation for external payloads
- ad-hoc console logging
- hidden constants with no names

## Testing expectations

- route logic -> relevant API/unit tests
- analytics logic -> deterministic Vitest coverage
- DB/schema changes -> query/persistence tests
- UI behavior -> unit tests and Playwright when flow meaningfully changes
- security/auth/headers -> targeted tests preferred

If tests cannot be run, state exactly which commands should be run next.

## Definition of done

A task is done when:
- the change is minimal and coherent
- conventions are preserved
- typing is clean
- relevant tests pass or are clearly identified
- security and observability behavior remain intact
- contract changes are deliberate and explained

## One-line rule

Prefer established repo patterns over clever rewrites.
