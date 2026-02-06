# Phase 05: Dashboard Frontend - Research

**Researched:** 2026-02-06
**Domain:** Next.js 16 App Router dashboard UI (maps + charts)
**Confidence:** HIGH

## Summary

This research covers how to build the Phase 05 public dashboard in Next.js App Router with Recharts and react-map-gl + MapLibre, aligned to the requirement of Spanish UI, responsive layout, and server-side initial data rendering. Official docs confirm App Router server components, server data fetching via `fetch`, and deployment options; Recharts and react-map-gl/MapLibre docs provide the chart and map primitives needed for the dashboard panels.

The standard approach is to render the dashboard route as a Server Component that fetches all required data in parallel (from Phase 4 API endpoints), then pass that data into Client Components for interactive map, charts, and table. For the map, react-map-gl’s Maplibre wrapper plus MapLibre CSS and markers provide occupancy indicators. For charts, Recharts `ResponsiveContainer` with `LineChart`, `BarChart`, and `ScatterChart` covers hour-of-day comparisons and the heatmap matrix (using scatter points and a custom shape).

**Primary recommendation:** Implement the dashboard page as a Server Component that fetches all panel datasets with `fetch(..., { cache: 'no-store' })`, and pass data into Client Components that render Recharts charts and react-map-gl map markers while keeping all UI strings in Spanish.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.x | Server-rendered React app | Official App Router with Server Components and data fetching | 
| React | 19.x | UI framework | Required by Next.js 16 | 
| Recharts | 3.7.x | Charting for dashboard panels | Official docs and API for Line/Bar/Scatter charts | 
| react-map-gl (Maplibre) | 8.x | React wrapper for MapLibre | Official Maplibre integration with Map and Marker | 
| maplibre-gl | 5.17.x | WebGL map renderer | MapLibre GL JS is the base map library | 

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-is | match React | Recharts peer dependency | Required by Recharts install guidance |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | D3 directly | Higher complexity, more custom code |
| react-map-gl + MapLibre | Leaflet | Different map stack, not aligned to prior decision |

**Installation:**
```bash
npm install recharts react-is react-map-gl maplibre-gl
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── dashboard/
│   ├── page.tsx           # Server Component: fetch all data
│   └── _components/
│       ├── MapPanel.tsx   # Client Component (react-map-gl)
│       ├── Rankings.tsx   # Client Component (sortable/searchable table)
│       ├── HourlyCharts.tsx
│       ├── Heatmap.tsx
│       └── Alerts.tsx
lib/
├── api.ts                 # server-only data fetch helpers
└── format.ts              # Spanish labels, formatting helpers
```

### Pattern 1: Server Component data fetch + client visualization
**What:** Fetch all datasets in the Server Component and pass plain JSON to client visualizations.
**When to use:** Required to render initial data server-side with no loading states.
**Example:**
```tsx
// Source: https://nextjs.org/docs/app/building-your-application/data-fetching/fetching
export default async function Page() {
  const res = await fetch('https://api.example.com/dashboard', {
    cache: 'no-store'
  })
  const data = await res.json()
  return <Dashboard data={data} />
}
```

### Pattern 2: MapLibre Map with markers
**What:** Use `Map` and `Marker` from `react-map-gl/maplibre` and include MapLibre CSS.
**When to use:** Station map with occupancy indicators.
**Example:**
```tsx
// Source: https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/map
import {Map, Marker} from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

export function StationMap() {
  return (
    <Map
      initialViewState={{ longitude: -0.88, latitude: 41.65, zoom: 12 }}
      mapStyle="https://demotiles.maplibre.org/style.json"
    >
      <Marker longitude={-0.88} latitude={41.65} anchor="bottom" />
    </Map>
  )
}
```

### Pattern 3: Responsive Recharts panels
**What:** Wrap charts in `ResponsiveContainer` and use `LineChart`/`BarChart`/`ScatterChart` with `XAxis`/`YAxis`.
**When to use:** Hour-of-day charts, rankings comparison, and heatmap grid.
**Example:**
```tsx
// Source: https://recharts.github.io/en-US/api/ResponsiveContainer/
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'

export function HourlyChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <XAxis dataKey="hour" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="weekday" />
        <Line type="monotone" dataKey="weekend" />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Anti-Patterns to Avoid
- **Streaming loading states for initial render:** `loading.js` and Suspense fallbacks violate “no loading states” for initial data.
- **Server-only code in client components:** Avoid accessing secrets or Node APIs in `"use client"` files; keep data fetch in Server Components.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebGL map rendering | Custom map tile renderer | MapLibre GL via react-map-gl | Complex rendering pipeline and styling spec |
| Chart primitives | Custom SVG/D3 charts | Recharts chart components | Full charting API already provided |

**Key insight:** These libraries already encode the map/chart interaction details, and re-implementing them is high effort with little upside for this phase.

## Common Pitfalls

### Pitfall 1: Missing MapLibre CSS
**What goes wrong:** Markers/popups render without styles or appear broken.
**Why it happens:** MapLibre requires its CSS file to be included.
**How to avoid:** Import `maplibre-gl/dist/maplibre-gl.css` in the map component or global CSS.
**Warning signs:** Popups or marker elements appear unstyled or invisible.

### Pitfall 2: Using Client Components for server fetches
**What goes wrong:** Data is fetched client-side, causing loading states and inconsistent SSR.
**Why it happens:** App Router defaults to Server Components; interactivity pushes developers to `"use client"` too early.
**How to avoid:** Fetch in the `page.tsx` Server Component and pass data to client components.
**Warning signs:** Spinners appear on initial load or hydration mismatches.

### Pitfall 3: Stale data due to caching defaults
**What goes wrong:** Dashboard shows old values even though API updates.
**Why it happens:** Next.js may pre-render and cache output unless `cache: 'no-store'` is used for dynamic data.
**How to avoid:** Use `fetch(..., { cache: 'no-store' })` for real-time panels.
**Warning signs:** “Last updated” timestamp doesn’t change after refresh.

## Code Examples

Verified patterns from official sources:

### Server Component data fetch
```tsx
// Source: https://nextjs.org/docs/app/building-your-application/data-fetching/fetching
export default async function Page() {
  const res = await fetch('https://api.example.com/dashboard', {
    cache: 'no-store'
  })
  const data = await res.json()
  return <Dashboard data={data} />
}
```

### MapLibre Map + Marker
```tsx
// Source: https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/marker
import {Map, Marker} from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

export function MapPanel() {
  return (
    <Map
      initialViewState={{ longitude: -0.88, latitude: 41.65, zoom: 12 }}
      mapStyle="https://demotiles.maplibre.org/style.json"
    >
      <Marker longitude={-0.88} latitude={41.65} anchor="bottom" />
    </Map>
  )
}
```

### Responsive Recharts chart
```tsx
// Source: https://recharts.github.io/en-US/api/ResponsiveContainer/
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

export function RankingsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <XAxis dataKey="station" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="turnover" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router SSR | App Router + Server Components | Next.js 13+ | Server-side data fetching is first-class, smaller client bundles |
| Mapbox GL JS v1 | MapLibre GL JS | Ongoing | Open-source base map without Mapbox token requirements |

**Deprecated/outdated:**
- Pages Router for new dashboards: App Router is the standard in Next.js 16.

## Open Questions

1. **Exact API payload shapes for each panel**
   - What we know: Phase 4 provides endpoints for stations, rankings, hour-of-day, heatmap, and alerts.
   - What's unclear: Field names, time zone handling, and normalization format.
   - Recommendation: Lock down response schemas before UI integration.

2. **Deployment target for public URL**
   - What we know: Next.js supports Node server, Docker, and adapters.
   - What's unclear: Which provider will host the public dashboard.
   - Recommendation: Choose deployment target early to align with runtime and env vars.

## Sources

### Primary (HIGH confidence)
- https://nextjs.org/docs/app/building-your-application/data-fetching/fetching - Server Component data fetching and caching behavior
- https://nextjs.org/docs/app/getting-started/layouts-and-pages - App Router structure (layouts/pages)
- https://nextjs.org/docs/app/building-your-application/rendering/server-components - Server vs Client Components
- https://nextjs.org/docs/app/building-your-application/deploying - Deployment options
- https://recharts.github.io/en-US/api/LineChart/ - Line chart API
- https://recharts.github.io/en-US/api/BarChart/ - Bar chart API
- https://recharts.github.io/en-US/api/ResponsiveContainer/ - Responsive container API
- https://recharts.github.io/en-US/api/ScatterChart/ - Scatter chart API
- https://github.com/recharts/recharts - Installation instructions and latest release
- https://visgl.github.io/react-map-gl/docs - react-map-gl v8 docs overview
- https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/map - Map component
- https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/marker - Marker component
- https://maplibre.org/maplibre-gl-js/docs/ - MapLibre GL JS docs and CSS requirement

### Secondary (MEDIUM confidence)
- https://tanstack.com/table/latest/docs/introduction - Table library overview (not required unless dataset size demands)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified with official docs and releases
- Architecture: HIGH - App Router patterns and component APIs documented
- Pitfalls: MEDIUM - derived from documented caching/CSS requirements and App Router behavior

**Research date:** 2026-02-06
**Valid until:** 2026-03-08
