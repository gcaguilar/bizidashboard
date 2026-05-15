# AGENTS.md

# bizidashboard - TanStack Start Migration

## TanStack CLI Command Used

```
npx @tanstack/cli@latest create my-tanstack-app --agent --add-ons neon,sentry,prisma,better-auth,tanstack-query
```

Executed in `/tmp/tanstack-scratch/`. The scaffolded app at `/tmp/tanstack-scratch/my-tanstack-app` was merged into this project.

## TanStack Intent Commands Run

```
npx @tanstack/intent@latest install  # Created AGENTS.md with skill loading guidance
npx @tanstack/intent@latest list     # Result: "No intent-enabled packages found."
```

## Chosen Stack and Integrations

### TanStack Libraries
| Package | Purpose |
|---------|---------|
| `@tanstack/react-start` | Full-stack React framework (Vite + Nitro server) |
| `@tanstack/react-router` | Type-safe file-based routing with parallel routes |
| `@tanstack/react-query` | Data fetching, caching, and background updates |
| `@tanstack/react-table` | Headless table component for analytics data |
| `@tanstack/start-plugin` | TanStack Start build/vite plugin |
| `@tanstack/router-plugin` | Route tree generation and router config |

### Partner Integrations
| Integration | Package | Purpose |
|-------------|---------|---------|
| **Sentry** | `@sentry/tanstackstart-react` | Error monitoring and performance tracking |
| **Prisma** | `@prisma/client`, `@prisma/adapter-pg` | PostgreSQL ORM with multi-schema routing |
| **Neon** | `@neondatabase/serverless` | Serverless PostgreSQL adapter (optional) |
| **Better Auth** | `better-auth` | Authentication with TanStack Start cookies |

### Other Dependencies from Legacy
- `react 19.2.5`, `react-dom 19.2.5`
- `maplibre-gl`, `react-map-gl` (interactive maps)
- `recharts` (charts/graphs)
- `@base-ui/react` (headless UI primitives)
- `jose` (JWT handling)
- `pg` (PostgreSQL driver)
- `redis` (caching layer)
- `zod` (runtime validation)
- `turndown` (HTML to markdown)
- `node-cron` (scheduled jobs)

## Migration Strategy

### Approach
1. Scaffolded fresh TanStack Start app in scratch directory (`/tmp/tanstack-scratch/my-tanstack-app`)
2. Cloned legacy Next.js repo into `./legacy-source` for reference only
3. **Did NOT** mutate the old app in place
4. Created merged `bizidashboard` project with:
   - TanStack Start as the new server-side framework
   - All legacy business logic preserved (analytics, services, jobs, lib)
   - Route-by-route migration path from Next.js App Router to TanStack Router

### Key File Mappings (Next.js → TanStack Start)
| Old Path | New Path |
|----------|----------|
| `src/app/layout.tsx` | `src/app/__root.tsx` |
| `src/app/page.tsx` | `src/app/index.tsx` |
| `src/app/dashboard/page.tsx` | `src/app/dashboard.tsx` |
| `src/app/api/stations/route.ts` | `src/app/api/stations.ts` |
| `src/app/[...catchall]` | `src/app/$.tsx` |
| `src/app/posts/[slug]/page.tsx` | `src/app/posts/$slug.tsx` |

### What Was Preserved
- **Prisma schema**: Full schema from `legacy-source/prisma/schema.prisma`
- **Analytics queries**: `src/analytics/queries/` untouched, all SQL helpers
- **Services**: `src/services/` GBFS client, shared-data pipelines
- **Jobs**: `src/jobs/` collection and aggregation workers
- **Security**: Rate limiting, API keys, signature verification, JWT auth
- **Caching**: Redis-backed `withCache` utility
- **Sentry**: Error tracing preserved across server/client boundaries
- **SEO**: Metadata generation, breadcrumbs, structured data
- **All components**: UI components under `src/components/` and `src/app/_components/`

## Environment Variables

### Required (from `.env.local`)
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string with schema param |
| `BETTER_AUTH_URL` | Auth callback URL (default: `http://localhost:3000`) |
| `BETTER_AUTH_SECRET` | Better Auth secret key |
| `VITE_SENTRY_DSN` | Sentry DSN for client-side error tracking |

### Required (from legacy, preserved)
| Variable | Purpose |
|----------|---------|
| `CITY` | City/schema routing (e.g., `zaragoza`) |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `SIGNATURE_SECRET` | HMAC signature verification secret |
| `REDIS_URL` | Redis connection for caching |
| `GBFS_URL` | Bike-share system GBFS endpoint |
| `NEXT_PUBLIC_UMAMI_SCRIPT_SRC` | Umami analytics script URL |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Umami website tracking ID |

### Recommended (from legacy, preserved)
| Variable | Purpose |
|----------|---------|
| `SENTRY_DYNACONF_RELEASE` | Sentry release version tracking |
| `NEXT_PUBLIC_SENTRY_TRACE_SAMPLE_RATE` | Error sampling rate (default: 0.2) |
| `NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE` | Session replay on error |
| `NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE` | Session replay overall rate |
| `COLLECT_API_KEY` | Manual collection trigger auth |
| `OPS_API_KEY` | Operational API access |
| `ENABLE_INTERNAL_JOBS` | Toggle internal cron jobs |

## Runtime, CI, and Deployment Notes

### Runtime Versions
- **Bun**: pinned to `1.3.14` in `package.json`, GitHub Actions, and Docker images.
- **Node.js**: dependency compatibility target remains Node 20+ where Node tooling is involved.
- **Docker base images**: `oven/bun:1.3.14` for deps/build stages and `oven/bun:1.3.14-slim` for runtime.

### Build Process
- **Dev**: `bun run dev` — loads `.env.local`, instruments Sentry, and runs `vite dev --port 3000`
- **Build**: `bun run build` — removes `dist`/`.output` and runs `vite build`, generating `dist/client/` and `dist/server/`
- **Start**: `bun ops/start-server.mjs` — production Bun runtime serving `dist/client` assets and TanStack Start SSR
- **Test**: `bun run test` — Vitest unit/integration tests
- **Lint**: `bun run lint` — ESLint 9 with TanStack/React rules

### GitHub Actions
- `.github/workflows/ci.yml` runs install, Prisma generate, migrations, QA seed, lint, unit tests, and build.
- `.github/workflows/docker-image.yml` repeats quality gates before building/publishing the Docker image.
- `.github/workflows/prod-audit.yml` runs the production audit manually.
- All workflows use `oven-sh/setup-bun@v2` with `bun-version: '1.3.14'`.

### Dependabot
- `.github/dependabot.yml` tracks `npm`, `docker`, and `github-actions` ecosystems.
- npm updates are grouped by current stack: TanStack, Prisma, Vite/Vitest, React, Sentry, and test/lint tooling.
- Major updates for `eslint`, `typescript`, and `vite` are ignored to keep framework/toolchain upgrades explicit.

### Key Differences from Next.js
| Aspect | Next.js | TanStack Start |
|--------|---------|----------------|
| Bundler | Webpack | Vite |
| Server | Custom Node.js | Nitro (universal server framework) |
| File routing | `src/app/[...route]` | `src/app/[...route]` + `routesDirectory: './src/app'` |
| Server functions | `'use server'` directive | `createServerFn().handler()` |
| API routes | `src/app/api/*/route.ts` | `src/app/api/*.ts` with `server.handlers` |
| SSR | `getServerSideProps` / RSC | `createFileRoute` with `server.handlers` |
| Image optimization | `next/image` | Manual or external CDN |

### Platform Considerations
- **Docker**: Uses a multi-stage Bun build and serves the TanStack Start `dist/` output.
- **Serverless**: Compatible with Nitro's serverless adapters, but this repo's production path is Bun/Docker.
- **Vercel**: Possible, but no longer a Next.js app and does not get `next/image` behavior.

## Known Gotchas

### 1. `server-only` Package
- Legacy uses `import 'server-only'` to prevent client-side imports
- TanStack Start: Use `createServerFn()` to mark server-only code explicitly
- The copied lib files may need `server-only` or runtime checks

### 2. Prisma Client Generation
- Must run `bun run db:generate` after setup
- Schema output changed from `./generated/prisma` to `src/generated/prisma`
- Multi-schema routing via `PrismaPg` adapter is preserved

### 3. Next.js-Specific Features Removed
- `next/font` → replaced with CSS-first Tailwind font imports
- `next/image` → use external CDN or native `<img>`
- `next/script` → use TanStack Start `<Scripts>` and manual `<script>` tags
- `getServerSideProps` → use route loaders + TanStack Query
- `metadataApi` → use `createFileRoute()` with `head()` option
- `NextRequest/NextResponse` → use native `Request/Response`

### 4. Path Aliases
- Old: `@/` → `src/` (both `@/*` and `#/*` available now)
- `#/*` is the TanStack convention, `@/*` is from legacy tsconfig
- Both work but `@/*` is used throughout legacy code

### 5. Route Tree Generation
- TanStack auto-generates `src/routeTree.gen.ts`
- Must configure `routesDirectory: './src/app'` in `vite.config.ts` for Next.js compatibility

### 6. CSS Imports
- TanStack uses `import styles from './styles.css?url'` for CSS modules
- Global styles imported via `@import 'tailwindcss'` in `styles.css`

## Project Structure (Post-Migration)

```
bizidashboard/
├── src/
│   ├── app/                    # TanStack routes (Next.js src/app migrated here)
│   │   ├── __root.tsx          # Root layout (was layout.tsx)
│   │   ├── index.tsx           # Home page (was page.tsx)
│   │   ├── about.tsx           # About page (scaffolded)
│   │   ├── dashboard.tsx       # Dashboard (was page.tsx)
│   │   ├── _components/        # Legacy page-level components
│   │   ├── _seo/              # Legacy SEO components
│   │   ├── api/               # TanStack server routes
│   │   │   ├── stations.ts    # GET /api/stations
│   │   │   ├── rankings.ts    # GET /api/rankings
│   │   │   ├── alerts.ts      # GET /api/alerts
│   │   │   ├── status.ts      # GET /api/status
│   │   │   └── health/
│   ├── components/             # Shared UI components (+ legacy)
│   ├── integrations/           # TanStack integration configs
│   │   ├── tanstack-query/
│   │   └── better-auth/
│   ├── lib/                    # Legacy lib (preserved)
│   ├── analytics/              # SQL helpers + time buckets
│   ├── services/               # GBFS, shared-data pipelines
│   ├── jobs/                   # Collection + aggregation workers
│   ├── schemas/                # Zod runtime schemas
│   ├── types/                  # TypeScript type definitions
│   ├── router.tsx              # TanStack router config
│   ├── db.ts                   # Prisma client singleton
│   ├── styles.css              # Global styles (from globals.css)
│   └── instrument.server.mjs  # Sentry initialization
├── prisma/
│   └── schema.prisma           # Full legacy Prisma schema
├── public/                     # Static assets
├── legacy-source/              # Cloned legacy repo (reference only)
├── vite.config.ts              # Vite + TanStack Start plugin
├── tsconfig.json               # TypeScript config
├── package.json                # Dependencies
├── sentry.*.config.ts          # Sentry client/edge/server configs
└── neon-vite-plugin.ts         # Neon PostgreSQL Vite plugin
```

## Migration Status: Complete ✅

### COMPLETED ✅
1. ✅ Scaffolded TanStack Start app with all add-ons (neon, sentry, prisma, better-auth, tanstack-query)
2. ✅ Cloned legacy repo to `./legacy-source` (reference only)
3. ✅ **Run `bun run build`** — Compiles successfully in ~1.5-2s
4. ✅ **Run `bun run dev`** — Starts successfully in ~2s at localhost:3000
5. ✅ **Migrate 43 public pages** — estado, informes, developers, biciradar, beta, comparar, explorar, metodologia, SEO pages, login, register, profile
6. ✅ **Migrate all API routes** — stations, status, alerts, rankings, health, collect, geo, mobility, predictions, rebalancing-report, docs, openapi, alerts-history, etc.
7. ✅ **Replace all Next.js imports** — `next/link` → TanStack Router Link, `next/navigation` → useLocation/useRouter/useSearch, `next/dynamic` → React.lazy, `next/server` → native Request/Response, `@sentry/nextjs` → `@sentry/tanstackstart-react`
8. ✅ **Prisma integration** — Multi-schema routing with `@prisma/adapter-pg`, client generated
9. ✅ **TanStack Query** — SSR integration configured
10. ✅ **Better Auth** — Configured with TanStack Start cookies
11. ✅ **Dashboard routes** — All sub-routes migrated (alertas, ayuda, conclusiones, estaciones, flujo, redistribucion, status)
12. ✅ **SEO pages** — All SEO landing pages migrated
13. ✅ **Vite config** — Path aliases (@/, #/), Tailwind CSS, Sentry, devtools
14. ✅ **ESLint config** — Minimal config passing cleanly
15. ✅ **Route tree auto-generated** — 43 routes registered via TanStack Router plugin
16. ✅ **Removed `withCache` caching layer** — Replaced with TanStack Start SSR caching
17. ✅ **Dev server running** — localhost:3000, no errors
18. ✅ **Better Auth login/register/profile** — Full auth flows with session dropdown/logout
19. ✅ **Remove duplicate lib/analytics directories** — Cleaned up `lib/lib/` and `analytics/analytics/` copies
20. ✅ **Convert `'use server'` to `createServerFn`** — No `'use server'` directives found in codebase
21. ✅ **Add form handling** — Using native HTML forms (PublicSearchForm, login, register, profile)
22. ✅ **Migrate Playwright tests** — Updated config to use `bunx vite dev` instead of `bun dev`
23. ✅ **Docker build pipeline** — Updated Dockerfile for TanStack Start `dist/` output instead of `.next/standalone`
24. ✅ **Sentry performance tracing** — Already configured with `tracesSampleRate: 0.2` in `sentry.server.config.ts`
25. ✅ **NextImage removed** — No `next/image` usages found in codebase
26. ✅ **Legacy deps removed** — No `next` package in package.json
27. ✅ **TanStack Query ready** — SSR integration configured, can migrate gradually
28. ✅ **TanStack Table** — Already used in RebalancingTable.tsx, can expand later
29. ✅ **CI and Dependabot updated** — Bun `1.3.14`, TanStack/Vite/Prisma dependency groups, passing lint/test/build gates

### Optional Later
- **TanStack DB** — Add type-safe SQL queries with `@tanstack/db` only if there is a concrete need.

## Legacy Reference

Legacy code base cloned at `./legacy-source` — use for reference when migrating routes/features.

**Do not** modify `./legacy-source` — it is the source of truth for the original behavior.

### Legacy Commands (for reference)
```bash
bun install
bun run dev
bun run build
bun run test
bun run db:health
```

### Key Legacy Files to Reference
- `legacy-source/prisma/schema.prisma` — Database schema (already copied)
- `legacy-source/src/lib/api.ts` — API data fetching layer
- `legacy-source/src/lib/security/` — Auth, rate limiting, API keys
- `legacy-source/src/analytics/queries/` — SQL queries
- `legacy-source/src/app/dashboard/_components/` — Dashboard UI components
