# Phase 04: API Layer - Research

**Researched:** 2026-02-06
**Domain:** Next.js REST API layer with Redis caching and OpenAPI docs
**Confidence:** MEDIUM

## Summary

This phase builds a thin REST API in the Next.js App Router using Route Handlers, backed by Prisma queries that read pre-computed aggregates from Phase 3. The API should stay stateless and do minimal computation, with Redis providing a 5-minute TTL cache for hot queries (cache-aside) and predictable response times. Route handlers return JSON via the Web Response API and handle query parameters via `NextRequest`.

Redis should be implemented with the official `redis` (node-redis) client, which is the recommended Node.js Redis client. Use a singleton connection module to avoid connection storms in dev/serverless, and set cache entries with expiration options on `SET`. API documentation can be served at `/api/docs` as an OpenAPI JSON document (OpenAPI Specification latest is 3.2.0).

**Primary recommendation:** Implement Route Handlers under `src/app/api` with cache-aside Redis (5-minute TTL) and serve a static OpenAPI JSON at `/api/docs`.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router Route Handlers | 16.1.6 | REST endpoints in `app/api` | Official Next.js mechanism for API endpoints in App Router. |
| Prisma Client + LibSQL adapter | 7.3.0 | Query pre-computed aggregates | Existing data access layer in this repo. |
| redis (node-redis) | 5.10.0 | Redis cache client | Official recommended Redis client for Node.js. |
| OpenAPI Specification | 3.2.0 | API docs at `/api/docs` | Standard, toolable API description format. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | 4.3.6 | Validate query params | If endpoints need strict query param validation. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| node-redis | ioredis | Supported but considered older; node-redis is the recommended client. |

**Installation:**
```bash
npm install redis
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/api/             # Route Handlers for REST endpoints
├── lib/analytics/       # Read-only aggregate queries (Phase 3)
├── lib/cache/           # Redis client + cache helpers
└── schemas/             # Zod schemas (if validating query params)
```

### Pattern 1: App Router Route Handler
**What:** Use `route.ts` with `GET` handlers and `Response.json`.
**When to use:** All REST endpoints (`/api/stations`, `/api/rankings`, etc.).
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
export async function GET() {
  return Response.json({ message: 'Hello World' })
}
```

### Pattern 2: Cache-Aside Redis (5-minute TTL)
**What:** Check Redis first, compute on miss, then `SET` with expiration.
**When to use:** Hot queries (rankings, heatmap, alerts, station list).
**Example:**
```typescript
// Source: https://github.com/redis/node-redis/blob/master/README.md
import { createClient } from 'redis'

const client = await createClient()
  .on('error', (err) => console.log('Redis Client Error', err))
  .connect()

await client.set('key', 'value', { EX: 300 })
const value = await client.get('key')
```

### Anti-Patterns to Avoid
- **Per-request Redis client creation:** causes connection storms; use a singleton module.
- **Ad-hoc docs:** don’t serve hand-written HTML; return a valid OpenAPI JSON instead.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Query caching | In-memory LRU per process | Redis with TTL | Avoids stale caches across instances and supports 5-minute TTL requirement. |
| API docs | Custom HTML pages | OpenAPI JSON | Standard tooling compatibility. |

**Key insight:** Redis and OpenAPI already solve TTL cache and API documentation; custom solutions add failure modes and maintenance.

## Common Pitfalls

### Pitfall 1: Missing Redis `error` listener
**What goes wrong:** Unhandled `error` event can crash the Node process.
**Why it happens:** node-redis requires an error listener on the client.
**How to avoid:** Always attach `.on('error', ...)` before `.connect()`.
**Warning signs:** Process exits on transient Redis network errors.

### Pitfall 2: Next.js route handler caching surprises
**What goes wrong:** Responses are cached unexpectedly or revalidated incorrectly.
**Why it happens:** Route handlers follow route segment caching config.
**How to avoid:** Set explicit route config (`dynamic`/`revalidate`) for API endpoints.
**Warning signs:** Hot endpoints return stale data after aggregate updates.

### Pitfall 3: Cache key mismatch for query params
**What goes wrong:** Rankings or patterns return incorrect data across different query params.
**Why it happens:** Cache key ignores `type` or `stationId`.
**How to avoid:** Include all query params in cache keys (e.g., `rankings:type=availability`).
**Warning signs:** Cached responses identical across different query values.

## Code Examples

Verified patterns from official sources:

### Route Handler GET
```typescript
// Source: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
export async function GET() {
  return Response.json({ message: 'Hello World' })
}
```

### Redis SET with Expiration (TTL)
```typescript
// Source: https://github.com/redis/node-redis/blob/master/README.md
await client.set('key', 'value', { EX: 10, NX: true })
```

### OpenAPI Document Skeleton
```yaml
# Source: https://spec.openapis.org/oas/latest.html
openapi: 3.2.0
info:
  title: Bizi Dashboard API
  version: 0.1.0
paths: {}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router API routes | App Router Route Handlers | Next.js v13.2.0 | API endpoints live in `app/api` using Web Request/Response. |

**Deprecated/outdated:**
- Pages Router API routes for new App Router projects; use Route Handlers instead.

## Open Questions

1. **Redis deployment choice (local vs managed)**
   - What we know: Only Redis is required, not the hosting mode.
   - What's unclear: Connection URL format and auth details.
   - Recommendation: Plan for `REDIS_URL` env and document it.

2. **Aggregate query shape from Phase 3**
   - What we know: Aggregates exist but exact schemas are not specified here.
   - What's unclear: Field names for rankings, patterns, heatmap, alerts.
   - Recommendation: Confirm Phase 3 output schema before defining response payloads.

## Sources

### Primary (HIGH confidence)
- https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- https://redis.io/docs/latest/develop/clients/nodejs/
- https://github.com/redis/node-redis/blob/master/README.md
- https://redis.io/docs/latest/commands/set/
- https://spec.openapis.org/oas/latest.html
- https://github.com/redis/node-redis/releases

### Secondary (MEDIUM confidence)
- None

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - official Next.js/Redis/OpenAPI docs and repo dependency versions.
- Architecture: MEDIUM - patterns inferred from repo structure plus official Route Handler docs.
- Pitfalls: MEDIUM - Redis error listener is documented; caching behavior details need verification in implementation.

**Research date:** 2026-02-06
**Valid until:** 2026-03-08
