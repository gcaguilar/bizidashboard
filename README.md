# BiziDashboard

BiziDashboard is an experimental, vibe-coded project for evaluating data ingestion and analytics workflows over the public Bizi Zaragoza GBFS feeds.

The repository is intended for rapid iteration and technical validation. It is used to test collection reliability, storage behavior, API contracts, and dashboard rendering under realistic conditions.

## Overview

This project provides a full prototype pipeline:

1. Collect live GBFS data (`station_status`, `station_information`).
2. Persist snapshots and station metadata.
3. Expose processed data through REST-style API routes.
4. Visualize operational and analytical metrics in a web dashboard.

## Scope and Intended Use

- Validate ingestion against an external API.
- Test schema validation and retry strategies.
- Evaluate analytical endpoints (rankings, alerts, patterns, heatmaps).
- Exercise dashboard functionality using near real-time data.
- Support architecture and implementation experiments before production hardening.

## Technology Stack

- Next.js (App Router) and React
- TypeScript
- Prisma with SQLite/libSQL adapter
- Redis cache layer (optional)
- Vitest for automated tests

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Common development commands:

```bash
pnpm test
pnpm lint
pnpm build
pnpm db:health
```

## Project Status

This repository is a prototype-oriented codebase. While functional, interfaces and internal implementation details may change as experimentation continues.

External API availability and payload changes may affect runtime behavior.

## Contributing

Contributions are welcome for improvements in reliability, observability, API design, and developer experience. Please open an issue or pull request describing the proposed change and rationale.

## License

This project is licensed under the GNU General Public License v3.0 (GPLv3).
See `LICENSE` for details.
