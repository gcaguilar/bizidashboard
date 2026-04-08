import 'server-only';

import { cache } from 'react';
import { fetchAvailableDataMonths } from '@/lib/api';
import { fetchCachedMonthlyDemandCurve } from '@/lib/analytics-series';
import { isValidMonthKey } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import {
  evaluatePageIndexability,
  type SeoIndexabilityDecision,
  type SeoIndexabilityInput,
} from '@/lib/seo-policy';
import { getDistrictSeoRows } from '@/lib/seo-districts';
import { getStationSeoRows, type StationSeoSummary } from '@/lib/seo-stations';

export type AcquisitionLandingKind = 'utility' | 'insights';

export type AcquisitionLandingData = {
  kind: AcquisitionLandingKind;
  path: string;
  stationRows: StationSeoSummary[];
  featuredStations: StationSeoSummary[];
  districtRows: Awaited<ReturnType<typeof getDistrictSeoRows>>;
  publishedMonths: string[];
  latestMonth: string | null;
  bikesAvailable: number;
  indexabilityInput: Omit<SeoIndexabilityInput, 'path' | 'canonicalPath'>;
  indexability: SeoIndexabilityDecision;
};

function buildUtilityLandingIndexabilityInput(
  stationRows: StationSeoSummary[],
  districtCount: number
): Omit<SeoIndexabilityInput, 'path' | 'canonicalPath'> {
  return {
    pageType: 'marketing',
    hasMeaningfulContent: true,
    hasData: stationRows.length > 0,
    requiresStrongCoverage: true,
    thresholds: [
      {
        label: 'indexable-stations',
        current: stationRows.length,
        minimum: 5,
      },
      {
        label: 'district-coverage',
        current: districtCount,
        minimum: 1,
      },
    ],
  };
}

function buildInsightsLandingIndexabilityInput(
  stationRows: StationSeoSummary[],
  districtCount: number,
  publishedMonths: string[]
): Omit<SeoIndexabilityInput, 'path' | 'canonicalPath'> {
  return {
    pageType: 'marketing',
    hasMeaningfulContent: true,
    hasData: stationRows.length > 0 && publishedMonths.length > 0,
    requiresStrongCoverage: true,
    thresholds: [
      {
        label: 'indexable-stations',
        current: stationRows.length,
        minimum: 5,
      },
      {
        label: 'district-coverage',
        current: districtCount,
        minimum: 2,
      },
      {
        label: 'published-months',
        current: publishedMonths.length,
        minimum: 1,
      },
    ],
  };
}

export const getUtilityLandingData = cache(async (): Promise<AcquisitionLandingData> => {
  const [stationRows, districtRows] = await Promise.all([
    getStationSeoRows().catch(() => []),
    getDistrictSeoRows().catch(() => []),
  ]);
  const indexableStations = stationRows.filter((row) => row.indexability.indexable);
  const featuredStations = indexableStations.slice(0, 4);
  const bikesAvailable = indexableStations.reduce(
    (sum, row) => sum + row.station.bikesAvailable,
    0
  );
  const indexabilityInput = buildUtilityLandingIndexabilityInput(
    indexableStations,
    districtRows.length
  );
  const path = appRoutes.utilityLanding();

  return {
    kind: 'utility',
    path,
    stationRows: indexableStations,
    featuredStations,
    districtRows,
    publishedMonths: [],
    latestMonth: null,
    bikesAvailable,
    indexabilityInput,
    indexability: evaluatePageIndexability({
      path,
      ...indexabilityInput,
    }),
  };
});

export const getInsightsLandingData = cache(async (): Promise<AcquisitionLandingData> => {
  const [stationRows, districtRows, monthsResponse, monthlySeries] = await Promise.all([
    getStationSeoRows().catch(() => []),
    getDistrictSeoRows().catch(() => []),
    fetchAvailableDataMonths().catch(() => ({
      months: [],
      generatedAt: new Date().toISOString(),
    })),
    fetchCachedMonthlyDemandCurve(36).catch(() => []),
  ]);
  const monthSet = new Set<string>();
  for (const month of [...monthsResponse.months, ...monthlySeries.map((row) => row.monthKey)]) {
    if (isValidMonthKey(month)) {
      monthSet.add(month);
    }
  }
  const publishedMonths = Array.from(monthSet).sort((left, right) => right.localeCompare(left));
  const indexableStations = stationRows.filter((row) => row.indexability.indexable);
  const featuredStations = indexableStations.slice(0, 4);
  const bikesAvailable = indexableStations.reduce(
    (sum, row) => sum + row.station.bikesAvailable,
    0
  );
  const indexabilityInput = buildInsightsLandingIndexabilityInput(
    indexableStations,
    districtRows.length,
    publishedMonths
  );
  const path = appRoutes.insightsLanding();

  return {
    kind: 'insights',
    path,
    stationRows: indexableStations,
    featuredStations,
    districtRows,
    publishedMonths,
    latestMonth: publishedMonths[0] ?? null,
    bikesAvailable,
    indexabilityInput,
    indexability: evaluatePageIndexability({
      path,
      ...indexabilityInput,
    }),
  };
});
