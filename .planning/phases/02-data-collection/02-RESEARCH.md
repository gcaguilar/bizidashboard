# Phase 2: Data Collection & Validation - Research

**Researched:** February 5, 2026  
**Domain:** GBFS (General Bikeshare Feed Specification), Node.js Data Pipelines, Data Observability  
**Confidence:** HIGH for Bizi API (verified live), MEDIUM for patterns (verified with multiple sources)

## Summary

This research establishes the technical foundation for implementing a robust, production-ready data collection pipeline for Bizi Zaragoza bike-sharing data. The key findings:

**Bizi Zaragoza uses GBFS v2.3** (verified via live discovery endpoint), not a proprietary OAuth API as initially suspected from older documentation. The feed is publicly accessible without authentication, with a TTL of 1 second indicating near-real-time data updates. The system has 276 stations with electric bikes.

**Critical insight for DATA-05:** GBFS specification recommends data latency should be "no more than 5 minutes out-of-date" and the `ttl` field indicates refresh frequency. Bizi's TTL=1s suggests very fresh data, but our 30-minute polling interval is appropriate to avoid unnecessary load while maintaining data freshness for analytics.

**Primary recommendation:** Use native `fetch` with custom retry logic (not axios) to minimize bundle size in Next.js 16. Implement Zod for runtime schema validation to ensure version-agnostic parsing. Use `node-cron` for scheduling with proper error handling and exponential backoff.

## Bizi API Discovery

### Verified GBFS Feed Structure

| Endpoint | URL | Purpose |
|----------|-----|---------|
| **GBFS Discovery** | `https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json` | Entry point - lists all available feeds |
| **Station Information** | `https://zaragoza.publicbikesystem.net/customer/gbfs/v2/en/station_information` | Static data: station IDs, names, locations, capacity |
| **Station Status** | `https://zaragoza.publicbikesystem.net/customer/gbfs/v2/en/station_status` | Real-time: available bikes, free docks, status |
| **System Information** | `https://zaragoza.publicbikesystem.net/customer/gbfs/v2/en/system_information` | Metadata: operator, timezone, contact |
| **Vehicle Types** | `https://zaragoza.publicbikesystem.net/customer/gbfs/v2/en/vehicle_types` | Bike types (e-bikes vs regular) |

**GBFS Version:** 2.3 (verified from live feed)  
**Authentication:** None required (public feed)  
**Rate Limits:** Not specified (GBFS standard encourages open access)  
**TTL:** 1 second (data refresh frequency)  
**Language Support:** en, es, fr (use `en` for consistency)

### GBFS Response Structure

```json
{
  "last_updated": 1770324668,
  "ttl": 1,
  "version": "2.3",
  "data": {
    "stations": [
      {
        "station_id": "string",
        "num_bikes_available": 0,
        "num_docks_available": 0,
        "is_installed": true,
        "is_renting": true,
        "is_returning": true,
        "last_reported": 1770324668
      }
    ]
  }
}
```

**Key fields for DATA-02:**
- `station_id` - unique identifier
- `num_bikes_available` / `num_docks_available` - current counts
- `is_renting` / `is_returning` - station operational status
- `last_reported` - timestamp of last update from station

### Alternative: CityBikes API

If GBFS feed becomes unavailable, CityBikes provides an alternative:
- **Endpoint:** `https://api.citybik.es/v2/networks/zaragoza`
- **Rate Limit:** 300 requests/hour
- **Format:** Proprietary (simpler but less standard)

**Recommendation:** Use GBFS as primary source (more detailed, standard format). CityBikes as fallback only.

### Trip Data Availability

**Answer to critical question:** Bizi API does NOT provide origin-destination trip data (who rode from where to where). GBFS only provides:
- Station-level availability (how many bikes at each station)
- No individual trip records
- No user data (by design - GBFS respects privacy)

To calculate trip patterns, you would need:
- Historical station status data (track bikes leaving/arriving stations over time)
- Statistical inference (not direct trip data)
- Consider requesting usage data from Zaragoza Ayuntamiento under open data laws

## Standard Stack

### Core Libraries

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **node-cron** | ^3.0.3 | Job scheduling | Battle-tested, simple API, no external dependencies (Redis, etc.) |
| **Zod** | ^3.24.x | Schema validation | TypeScript-first, static inference, 2kb bundle, zero deps |
| **retry-axios** | ^3.0.0 | HTTP retry logic | Industry standard, exponential backoff built-in |
| **undici** | Built-in | HTTP client | Node 18+ native fetch uses undici - no extra dependency |

### Installation

```bash
npm install node-cron zod retry-axios
npm install --save-dev @types/node-cron
```

### Why NOT These Alternatives

| Instead of | Don't Use Because |
|------------|-------------------|
| **axios** | Native fetch is now fully capable in Node 18+. Axios adds 13.5KB bundle for features we can implement simply. |
| **bull/bullmq** | Overkill for single-server polling. Requires Redis. node-cron is sufficient for 30-min intervals. |
| **Joi/Yup** | Zod has better TypeScript integration and smaller bundle (2kb vs Joi's larger footprint). |
| **node-schedule** | More complex than needed. node-cron has cleaner API for simple recurring jobs. |

## Architecture Patterns

### Recommended Project Structure

```
src/
├── jobs/
│   └── bizi-collection.ts      # Main polling job
├── services/
│   ├── gbfs-client.ts          # GBFS API wrapper
│   ├── data-validator.ts       # Schema validation
│   └── data-storage.ts         # Database operations
├── schemas/
│   └── gbfs.ts                 # Zod schemas
├── lib/
│   ├── retry.ts                # Exponential backoff logic
│   └── observability.ts        # Freshness/volume checks
└── types/
    └── gbfs.ts                 # TypeScript interfaces
```

### Pattern 1: Resilient HTTP Client with Retry

**What:** Wrap all API calls with exponential backoff and circuit breaker logic  
**When to use:** All external HTTP requests (especially for DATA-05)  
**Why:** GBFS feeds can temporarily fail; graceful degradation prevents data loss

```typescript
// Source: Retry best practices + GBFS implementation guide
import axios from 'axios';
import retryAxios from 'retry-axios';

const client = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent': 'BiziDashboard/1.0 (your-email@example.com)'
  }
});

retryAxios.attach(client);

const retryConfig = {
  retry: 5,
  retryDelay: (retryCount: number) => {
    // Exponential backoff with jitter
    const delay = Math.pow(2, retryCount) * 1000;
    const jitter = Math.random() * 1000;
    return delay + jitter;
  },
  retryCondition: (error: any) => {
    // Retry on network errors or 5xx/429 responses
    return retryAxios.isNetworkError(error) ||
           retryAxios.isRetryableError(error) ||
           error.response?.status === 429;
  }
};

export async function fetchWithRetry(url: string) {
  return client.get(url, retryConfig);
}
```

### Pattern 2: Schema Validation Pipeline

**What:** Validate all incoming data against Zod schemas before storage  
**When to use:** Every API response (DATA-03 requirement)  
**Why:** Prevents invalid data from corrupting database; enables version-agnostic parsing

```typescript
// Source: Zod documentation + GBFS field types
import { z } from 'zod';

const StationStatusSchema = z.object({
  station_id: z.string(),
  num_bikes_available: z.number().int().min(0),
  num_docks_available: z.number().int().min(0),
  is_installed: z.boolean(),
  is_renting: z.boolean(),
  is_returning: z.boolean(),
  last_reported: z.number().int(), // Unix timestamp
  // Version-agnostic: ignore extra fields
}).passthrough();

const GBFSResponseSchema = z.object({
  last_updated: z.number().int(),
  ttl: z.number().int(),
  version: z.string(),
  data: z.object({
    stations: z.array(StationStatusSchema)
  })
});

export type StationStatus = z.infer<typeof StationStatusSchema>;

export function validateStationData(data: unknown) {
  const result = GBFSResponseSchema.safeParse(data);
  if (!result.success) {
    // Log validation errors for observability
    console.error('GBFS validation failed:', result.error.format());
    throw new Error(`Invalid GBFS data: ${result.error.message}`);
  }
  return result.data;
}
```

### Pattern 3: Data Observability Layer

**What:** Five Pillars checks after each collection  
**When to use:** After every successful API call (INFRA-04 requirement)  
**Why:** Detect issues before they affect dashboard accuracy

```typescript
// Source: Monte Carlo Data Observability + Dagster patterns
interface DataObservabilityMetrics {
  freshness: boolean;      // Data is recent
  volume: boolean;         // Expected number of stations
  schema: boolean;         // Structure matches expected
  distribution: boolean;   // Values are in expected ranges
  lineage: boolean;        // Source is traceable
}

export async function validateDataQuality(
  data: GBFSResponse,
  previousCount: number
): Promise<DataObservabilityMetrics> {
  const now = Date.now() / 1000;
  const maxAge = 300; // 5 minutes per GBFS spec
  
  return {
    // Pillar 1: Freshness
    freshness: (now - data.last_updated) < maxAge,
    
    // Pillar 2: Volume (Bizi should have ~276 stations)
    volume: data.data.stations.length > 200 && 
            data.data.stations.length < 500,
    
    // Pillar 3: Schema (validated by Zod)
    schema: true, // If we got here, Zod validated
    
    // Pillar 4: Distribution
    distribution: data.data.stations.every(s => 
      s.num_bikes_available >= 0 && 
      s.num_docks_available >= 0
    ),
    
    // Pillar 5: Lineage
    lineage: data.version.startsWith('2.')
  };
}
```

### Pattern 4: Scheduling with Error Recovery

**What:** Cron job with robust error handling  
**When to use:** Main data collection entry point  
**Why:** Ensures continuous operation even if individual runs fail

```typescript
// Source: node-cron best practices + GBFS producer guide
import cron from 'node-cron';

export function startCollectionJob() {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('[Cron] Starting Bizi data collection...');
    
    try {
      const result = await collectBiziData();
      console.log(`[Cron] Successfully collected data for ${result.stationCount} stations`);
    } catch (error) {
      console.error('[Cron] Collection failed:', error);
      // Error is logged; next run will retry in 30 minutes
      // Consider alerting if 3 consecutive failures
    }
  }, {
    timezone: 'Europe/Madrid', // Bizi local time
    runOnInit: true // Collect immediately on startup
  });
}
```

### Anti-Patterns to Avoid

- **Hard-coding API URLs:** Always read from gbfs.json discovery file first (handles version changes)
- **Ignoring TTL:** Respect the `ttl` field - don't poll more frequently than indicated
- **Storing raw JSON:** Parse and validate before storage (DATA-03)
- **Synchronous loops:** Use Promise.all for multiple station updates
- **No User-Agent:** GBFS producers appreciate identification for debugging

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **Retry logic** | Custom for/while loops | `retry-axios` | Handles jitter, exponential backoff, circuit breaker patterns |
| **Cron scheduling** | setInterval | `node-cron` | Timezone support, daylight saving handling, cleaner API |
| **Schema validation** | Manual if/else checks | `Zod` | Type inference, error messages, composable schemas |
| **Date parsing** | new Date() everywhere | `date-fns` or native Intl | Timezone handling (critical for UTC requirement) |
| **HTTP timeouts** | Promise.race hacks | axios timeout config | Cleaner abort handling, request cancellation |

**Key insight:** The biggest risk in data collection isn't the initial implementation - it's handling edge cases that appear after weeks of operation (API hiccups, rate limiting, schema changes). Battle-tested libraries handle these scenarios you haven't thought of yet.

## Common Pitfalls

### Pitfall 1: Timestamp Confusion

**What goes wrong:** Mixing Unix timestamps (GBFS) with ISO strings (Prisma) causes timezone errors  
**Why it happens:** GBFS uses Unix timestamps (seconds since epoch), JavaScript Date uses milliseconds  
**How to avoid:** 
```typescript
// GBFS last_updated is in seconds
const lastUpdatedMs = data.last_updated * 1000;
const lastUpdatedDate = new Date(lastUpdatedMs);

// Store as UTC in database (Phase 1 requirement)
await prisma.stationStatus.create({
  data: {
    timestamp: lastUpdatedDate, // Prisma handles UTC conversion
    // ...
  }
});
```

### Pitfall 2: Ignoring Station Status Flags

**What goes wrong:** Counting bikes at stations that are `is_renting: false` (maintenance, full, etc.)  
**Why it happens:** Assuming all stations in list are operational  
**How to avoid:** Always check `is_installed`, `is_renting`, `is_returning` flags before analysis

### Pitfall 3: Not Handling GBFS Version Changes

**What goes wrong:** API upgrades to v3.0 break hardcoded v2.3 field access  
**Why it happens:** Zaragoza may upgrade their feed version  
**How to avoid:** 
1. Read `version` field from response
2. Use Zod `.passthrough()` to allow extra fields
3. Check `gbfs_versions.json` endpoint for available versions

### Pitfall 4: Missing Data Deduplication

**What goes wrong:** Storing identical data on every poll wastes storage  
**Why it happens:** Station status may not change between 30-min intervals  
**How to avoid:** Hash the data and check for changes before insert, or use upsert logic

### Pitfall 5: No Backpressure Handling

**What goes wrong:** Database slow down causes memory buildup if polling continues  
**Why it happens:** Async operations accumulate faster than they complete  
**How to avoid:** Use Promise.all with concurrency limit, or implement queue with p-limit

## Code Examples

### Complete Collection Pipeline

```typescript
// src/jobs/bizi-collection.ts
import { fetchGBFS } from '@/services/gbfs-client';
import { validateStationData } from '@/schemas/gbfs';
import { storeStationStatus } from '@/services/data-storage';
import { validateDataQuality } from '@/lib/observability';

export async function collectBiziData() {
  // 1. Fetch discovery file
  const discovery = await fetchGBFS('https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json');
  
  // 2. Get station_status URL (version-agnostic)
  const statusUrl = discovery.data.en.feeds.find(f => f.name === 'station_status')?.url;
  if (!statusUrl) throw new Error('station_status feed not found');
  
  // 3. Fetch station data with retry
  const response = await fetchGBFS(statusUrl);
  
  // 4. Validate schema (DATA-03)
  const validated = validateStationData(response);
  
  // 5. Check data quality (INFRA-04)
  const quality = await validateDataQuality(validated, /* previous count */);
  if (!quality.freshness) console.warn('Data may be stale');
  if (!quality.volume) console.warn('Unexpected station count');
  
  // 6. Store in database
  const stations = await Promise.all(
    validated.data.stations.map(storeStationStatus)
  );
  
  return {
    stationCount: stations.length,
    timestamp: new Date(validated.last_updated * 1000),
    quality
  };
}
```

### Exponential Backoff Implementation

```typescript
// src/lib/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  options = { maxRetries: 5, baseDelay: 1000 }
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === options.maxRetries) break;
      
      // Exponential backoff with jitter
      const delay = Math.pow(2, attempt) * options.baseDelay;
      const jitter = Math.random() * 1000;
      await sleep(delay + jitter);
    }
  }
  
  throw lastError!;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| **Axios for HTTP** | Native fetch (Node 18+) | 2022 | Smaller bundle, native Promise support |
| **GBFS v1.1** | GBFS v2.3/v3.0 | 2020-2023 | Better vehicle type support, localization |
| **Joi validation** | Zod | 2022-2024 | Better TypeScript integration, smaller bundle |
| **Redis-based queues** | node-cron for simple polling | Ongoing | Simpler for low-frequency jobs |
| **Manual retry loops** | retry-axios | Ongoing | Battle-tested patterns, circuit breakers |

**Deprecated/outdated:**
- **Bizi OAuth API:** The PDF documentation found appears to be outdated. Bizi now uses standard GBFS (verified February 2026).
- **GBFS v1.1:** Still supported but lacks features. v2.3 is current stable.
- **Moment.js for dates:** Use date-fns or native Intl (smaller bundles).

## Open Questions

### 1. Bizi Rate Limits

**What we know:** GBFS spec encourages open access; no auth required  
**What's unclear:** Specific rate limits for Zaragoza's infrastructure  
**Recommendation:** 
- Start with 30-minute polling as planned
- Monitor for 429 (Too Many Requests) responses
- If rate limited, implement exponential backoff and contact `feed_contact_email` from system_information.json

### 2. Historical Data Availability

**What we know:** GBFS provides only current state, not history  
**What's unclear:** Whether Bizi provides historical trip data via separate API  
**Recommendation:** 
- Build historical dataset through continuous collection
- Contact Zaragoza open data office (datosabiertos@zaragoza.es) for bulk historical data
- Consider integrating with CityBikes historical API if available

### 3. Data Retention Policy

**What we know:** SQLite for MVP, TimescaleDB for later (STATE.md)  
**What's unclear:** How much historical data to keep in SQLite before archiving  
**Recommendation:** 
- With 276 stations × 48 polls/day = ~13k records/day
- SQLite can handle millions of records; set retention at 6 months initially
- Implement data aggregation (hourly/daily summaries) to reduce storage

## Sources

### Primary (HIGH confidence)
- **GBFS Official Specification v3.0:** https://gbfs.org/documentation/reference/ (fetched Feb 5, 2026)
- **Bizi Zaragoza GBFS Discovery (live):** https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json
- **MobilityData GBFS Guide:** https://gbfs.org/learn/guide/
- **GBFS Systems Catalog:** https://github.com/MobilityData/gbfs/blob/master/systems.csv

### Secondary (MEDIUM confidence)
- **Zod Documentation:** https://zod.dev/ (verified v3.24+)
- **retry-axios:** https://jbeckwith.com/projects/retry-axios/ (verified patterns)
- **Five Pillars of Data Observability:** Monte Carlo Data (industry standard definition)

### Tertiary (LOW confidence - verify before use)
- **CityBikes API Rate Limits:** Documentation states 300 req/hour but may change
- **Bizi OAuth API:** PDF found appears outdated; GBFS is current method

## Metadata

**Confidence breakdown:**
- Bizi API specifics: **HIGH** - Verified via live endpoint
- Standard stack: **HIGH** - Multiple authoritative sources agree
- Architecture patterns: **MEDIUM** - Based on best practices, not specific GBFS consumer implementations
- Pitfalls: **MEDIUM** - Derived from general data pipeline experience

**Research date:** February 5, 2026  
**Valid until:** April 2026 (GBFS v3.1 may be released; check for updates)

---

**Note for Planner:** The Bizi API is confirmed to work via GBFS v2.3. No authentication required. The 30-minute polling interval is appropriate and respectful of API resources. Trip data is NOT available directly - must be inferred from station-level changes over time.
