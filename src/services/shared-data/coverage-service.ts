import 'server-only';

import { cache } from 'react';
import { withCache } from '@/lib/cache/cache';
import { prisma } from '@/lib/db';
import type { CoverageSummary, HistoryMetadata, SharedDataSource } from './types';

const CACHE_KEY = 'shared-data:coverage';
const CACHE_TTL_SECONDS = 300;
const GBFS_DISCOVERY_URL = 'https://zaragoza.publicbikesystem.net/customer/gbfs/v2/gbfs.json';

type CoverageRow = {
  firstRecordedAt: Date | string | null;
  lastRecordedAt: Date | string | null;
  totalSamples: bigint | number | null;
};

type StationsRow = {
  totalStations: bigint | number | null;
};

type DaysRow = {
  totalDays: bigint | number | null;
};

function toNumber(value: bigint | number | null | undefined): number {
  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  return 0;
}

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

export const getCoverageSummary = cache(async (): Promise<CoverageSummary> => {
  return withCache(CACHE_KEY, CACHE_TTL_SECONDS, async () => {
    const generatedAt = new Date().toISOString();
    const [coverageRows, stationRows, hourlyDaysRows, dailyDaysRows] = await Promise.all([
      prisma.$queryRaw<CoverageRow[]>`
        SELECT
          MIN("recordedAt") AS "firstRecordedAt",
          MAX("recordedAt") AS "lastRecordedAt",
          COUNT(*) AS "totalSamples"
        FROM "StationStatus";
      `,
      prisma.$queryRaw<StationsRow[]>`
        SELECT COUNT(*) AS "totalStations"
        FROM "Station"
        WHERE "isActive" = true;
      `.catch((error) => {
        console.warn('[SharedData] Unable to read active stations summary:', error);
        return [];
      }),
      prisma.$queryRaw<DaysRow[]>`
        SELECT COUNT(DISTINCT TO_CHAR("bucketStart", 'YYYY-MM-DD')) AS "totalDays"
        FROM "HourlyStationStat"
        WHERE "occupancyAvg" IS NOT NULL;
      `.catch((error) => {
        console.warn('[SharedData] Unable to read day coverage from HourlyStationStat:', error);
        return [];
      }),
      prisma.$queryRaw<DaysRow[]>`
        SELECT COUNT(DISTINCT TO_CHAR("bucketDate", 'YYYY-MM-DD')) AS "totalDays"
        FROM "DailyStationStat"
        WHERE "bucketDate" IS NOT NULL;
      `.catch((error) => {
        console.warn('[SharedData] Unable to read day coverage from DailyStationStat:', error);
        return [];
      }),
    ]);

    const coverage = coverageRows[0] ?? {
      firstRecordedAt: null,
      lastRecordedAt: null,
      totalSamples: 0,
    };

    return {
      firstRecordedAt: toIsoString(coverage.firstRecordedAt),
      lastRecordedAt: toIsoString(coverage.lastRecordedAt),
      totalSamples: toNumber(coverage.totalSamples),
      totalStations: toNumber(stationRows[0]?.totalStations),
      totalDays: Math.max(
        toNumber(hourlyDaysRows[0]?.totalDays),
        toNumber(dailyDaysRows[0]?.totalDays)
      ),
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
