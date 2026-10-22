import { cache } from 'react';
import { withCache } from '@/lib/cache/cache';
import { getRollupVersion, ROLLUP_SERIES_TTL_SECONDS } from '@/lib/cache/rollup-version';
import { prisma } from '@/lib/db';
import { toNumber } from '@/lib/format';
import { logger } from '@/lib/logger';
import type { CoverageSummary, HistoryMetadata, SharedDataSource } from './types';

const CACHE_KEY = 'shared-data:coverage';
const CACHE_TTL_SECONDS = 300;
const GBFS_DISCOVERY_URL = 'https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json';

type CoverageBoundsRow = {
  firstRecordedAt: Date | string | null;
  lastRecordedAt: Date | string | null;
};

type CoverageTotalsRow = {
  totalSamples: bigint | number | null;
  totalDays: bigint | number | null;
};

type StationsRow = {
  totalStations: bigint | number | null;
};

const EMPTY_TOTALS: CoverageTotalsRow = { totalSamples: 0, totalDays: 0 };

function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

export function getSharedDataSource(): SharedDataSource {
  return {
    provider: 'Bizi Zaragoza GBFS',
    gbfsDiscoveryUrl: GBFS_DISCOVERY_URL,
  };
}

/**
 * Coverage counts come from the daily rollup instead of raw snapshots: the raw
 * table has millions of rows and is pruned by retention, while `DailyStationStat`
 * keeps the full history in a few thousand rows.
 *
 * `lastRecordedAt` still reads `StationStatus` so freshness reflects the latest
 * ingested snapshot. `MIN`/`MAX` use the existing indexes.
 */
async function readCoverageBounds(): Promise<CoverageBoundsRow[]> {
  const rows = await prisma.$queryRaw<CoverageBoundsRow[]>`
    SELECT
      COALESCE(
        (SELECT MIN("bucketDate") FROM "DailyStationStat"),
        (SELECT MIN("recordedAt") FROM "StationStatus")
      ) AS "firstRecordedAt",
      (SELECT MAX("recordedAt") FROM "StationStatus") AS "lastRecordedAt";
  `.catch((error) => {
    logger.warn('shared_data.coverage_bounds_failed', { error });
    return [];
  });

  if (rows.length > 0) {
    return rows;
  }

  return prisma.$queryRaw<CoverageBoundsRow[]>`
    SELECT
      MIN("recordedAt") AS "firstRecordedAt",
      MAX("recordedAt") AS "lastRecordedAt"
    FROM "StationStatus";
  `.catch((error) => {
    logger.warn('shared_data.coverage_bounds_raw_failed', { error });
    return [];
  });
}

async function readCoverageTotals(): Promise<CoverageTotalsRow[]> {
  return prisma.$queryRaw<CoverageTotalsRow[]>`
    SELECT
      COALESCE(SUM("sampleCount"), 0) AS "totalSamples",
      COUNT(DISTINCT "bucketDate") AS "totalDays"
    FROM "DailyStationStat";
  `;
}

/**
 * The totals scan the whole `DailyStationStat` table (no retention), but only
 * change when the hourly rollup lands: they are cached under the rollup
 * version instead of being recomputed with the 5-minute coverage entry.
 * Numbers are normalised first because `bigint` is not JSON-serialisable.
 */
async function readCachedCoverageTotals(): Promise<CoverageTotalsRow[]> {
  // The error is caught outside `withCache` so a transient failure is not
  // cached for the whole rollup window.
  return withCache(
    `shared-data:coverage-totals:rollup=${await getRollupVersion()}`,
    ROLLUP_SERIES_TTL_SECONDS,
    async () =>
      (await readCoverageTotals()).map((row) => ({
        totalSamples: toNumber(row.totalSamples),
        totalDays: toNumber(row.totalDays),
      }))
  ).catch((error) => {
    logger.warn('shared_data.coverage_totals_failed', { error });
    return [];
  });
}

/**
 * Fresh deployments (or a broken rollup) have no daily rows yet. Fall back to
 * the raw table only in that case, so the common path never counts millions of
 * rows.
 */
async function readRawCoverageTotals(): Promise<CoverageTotalsRow[]> {
  return prisma.$queryRaw<CoverageTotalsRow[]>`
    SELECT
      COUNT(*) AS "totalSamples",
      COUNT(DISTINCT ("recordedAt"::date)) AS "totalDays"
    FROM "StationStatus";
  `.catch((error) => {
    logger.warn('shared_data.coverage_raw_totals_failed', { error });
    return [];
  });
}

export const getCoverageSummary = cache(async (): Promise<CoverageSummary> => {
  return withCache(CACHE_KEY, CACHE_TTL_SECONDS, async () => {
    const generatedAt = new Date().toISOString();
    const [coverageRows, stationRows, totalsRows] = await Promise.all([
      readCoverageBounds(),
      prisma.$queryRaw<StationsRow[]>`
        SELECT COUNT(*) AS "totalStations"
        FROM "Station"
        WHERE "isActive" = true;
      `.catch((error) => {
        logger.warn('shared_data.coverage_stations_failed', { error });
        return [];
      }),
      readCachedCoverageTotals(),
    ]);

    const coverage = coverageRows[0] ?? {
      firstRecordedAt: null,
      lastRecordedAt: null,
    };

    let totals = totalsRows[0] ?? EMPTY_TOTALS;
    if (toNumber(totals.totalDays) === 0) {
      const rawTotals = await readRawCoverageTotals();
      totals = rawTotals[0] ?? EMPTY_TOTALS;
      logger.warn('shared_data.coverage_totals_empty', {
        fallbackTotalDays: toNumber(totals.totalDays),
      });
    }

    return {
      firstRecordedAt: toIsoString(coverage.firstRecordedAt),
      lastRecordedAt: toIsoString(coverage.lastRecordedAt),
      totalSamples: toNumber(totals.totalSamples),
      totalStations: toNumber(stationRows[0]?.totalStations),
      totalDays: toNumber(totals.totalDays),
      generatedAt,
    };
  });
});

export const getHistoryMetadata = cache(async (): Promise<HistoryMetadata> => {
  const coverage = await getCoverageSummary();

  return {
    source: getSharedDataSource(),
    coverage,
    generatedAt: coverage.generatedAt,
  };
});
