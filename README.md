# 🚲 BiziDashboard

**BiziDashboard** is a multi-city analytics platform designed for real-time monitoring and historical data ingestion of shared bicycle systems using the **GBFS (General Bikeshare Feed Specification)** standard. 

Originally built for Zaragoza, it is now a generic, multi-tenant engine capable of supporting any city globally (Zaragoza, Madrid, Barcelona, NYC, Chicago, etc.) through independent PostgreSQL schemas.

---

## 🏗️ Project Architecture

The system is built on four core pillars:

1. **Ingestion Engine**: Light, standalone cron tasks (via Bun or Alpine/curl) that trigger periodic GBFS snapshots via the `POST /api/collect` endpoint.
2. **Storage Layer**: PostgreSQL with **Multi-Tenant by Schema** capability. Isolation is handled at the database level: each city has its own schema and tables.
3. **Analytics Core**: Specialized SQL aggregations (Rankings, Trends, Alerts, Heatmaps, Mobility Signals) optimized for time-series bike availability data.
4. **Visual Dashboard**: A Next.js (App Router) interface with real-time station statuses, historical graphs, and mobility reports.

---

## 📱 Mobile App Integration

This project exposes specialized analytical APIs that power the **[BiziMobile](https://github.com/gcaguilar/bizimobile)** application. When a station is empty, the mobile app uses our predictions and mobility signals to help users find the nearest available bike with high confidence using historical occupancy patterns.

---

## 🌍 Supported Cities

The project natively supports multiple cities out of the box. To switch cities, configure these environment variables:

| City | `CITY` Key | `GBFS_DISCOVERY_URL` |
| :--- | :--- | :--- |
| **Zaragoza** | `zaragoza` | `https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json` |
| **Madrid** | `madrid` | `https://madrid.publicbikesystem.net/customer/gbfs/v2/gbfs.json` |
| **Barcelona** | `barcelona` | `https://barcelona-sp.publicbikesystem.net/customer/gbfs/v2/gbfs.json` |

---

## 🛠️ PostgreSQL Developer Guidelines

Since the project uses **PostgreSQL**, strict rules apply when writing raw SQL queries to avoid syntax errors:

### 1. Quoting Identifiers (Case Sensitivity)
Postgres requires double quotes for `camelCase` table and column names. Unquoted names are lowercased by default.
- ✅ **Correct**: `SELECT "stationId" FROM "StationStatus"`
- ❌ **Incorrect**: `SELECT stationId FROM StationStatus`

### 2. BigInt & Type Safety
Aggregations like `SUM()` and `COUNT()` return **BigInt** (Int8). Always cast to `Number()` in TypeScript to avoid math or serialization errors.
- ✅ **Correct**: `const total = Number(row.totalCount)`

### 3. PostgreSQL Date Handling
Use `TO_CHAR` for consistent date formatting instead of SQLite-specific functions:
- ✅ **Correct**: `TO_CHAR("recordedAt", 'YYYY-MM-DD')`

### 4. Transaction-Safe Maintenance
Do **not** use `VACUUM`. Use `ANALYZE` for maintaining query planner statistics, as it is safe to run inside transactions.

---

## 🚀 Deployment (Docker Compose)

The architecture supports multiple isolated city deployments in a single `docker-compose.yml`:

### Isolated Services
Each city runs its own container, allowing independent scaling and city-specific SEO:

```yaml
services:
  zaragoza-app:
    environment:
      - CITY=zaragoza
      - DATABASE_URL=postgresql://user:pass@postgres:5432/bizidashboard
      - Port: 3000
  
  madrid-app:
    environment:
      - CITY=madrid
      - DATABASE_URL=postgresql://user:pass@postgres:5432/bizidashboard
      - Port: 3001
```

### Automatic Schema Isolation
When a city container starts, it automatically executes `SET search_path TO "city-name"`, ensuring isolation within a shared database instance.

---

## ➕ Adding New Lyft/GBFS Systems

Adding a new compatible city is easy:

1. Update `CITIES` and `CITY_CONFIGS` in `src/lib/constants.ts`.
2. Find the system's `gbfs.json` URL.
3. Deploy a new Docker service instance with the corresponding `CITY` and `GBFS_DISCOVERY_URL`.
4. Run migrations for the new schema:
   ```bash
   DATABASE_URL="postgresql://user:pass@host:5432/db?schema=newcity" npx prisma migrate deploy
   ```

---

## ⚙️ Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Runtime**: Bun (Production) / Node (Build)
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Testing**: Vitest

---

## 📜 License

Licensed under the **GNU General Public License v3.0 (GPLv3)**.
