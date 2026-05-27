import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import type { RebalancingReport } from '@/types/rebalancing';

const RebalancingSearchParamsSchema = z.object({
  sort: z.string().optional(),
  filter: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().min(0).optional(),
  pageSize: z.number().int().min(1).max(200).optional(),
}).default({});

type RebalancingSearchParams = z.infer<typeof RebalancingSearchParamsSchema>;

export function compactInitialRebalancingReport(report: RebalancingReport): RebalancingReport {
  return {
    ...report,
    diagnostics: report.diagnostics.map((diagnostic) => ({
      ...diagnostic,
      timeBandMetrics: [],
      network: {
        ...diagnostic.network,
        nearbyStationCount: diagnostic.network.nearbyStations.length,
        nearbyStations: [],
      },
    })),
  };
}

export const getDashboardRebalancingPageData = createServerFn({ method: 'GET' })
  .inputValidator(RebalancingSearchParamsSchema)
  .handler(async ({ data: params }: { data: RebalancingSearchParams | undefined }) => {
    const sort = params?.sort;
    const filter = params?.filter;
    const search = params?.search;
    const page = params?.page;
    const pageSize = params?.pageSize;
    const tableParams = {
      sort: sort?.includes(':') ? sort : undefined,
      filter: filter?.includes(':') ? filter : undefined,
      search,
      page,
      pageSize,
    };

    const { fetchDistrictCollection } = await import('@/lib/districts.server');
    const districtCollection = await fetchDistrictCollection().catch(() => null);

    const districtNames = districtCollection
      ? [...new Set(districtCollection.features
          .map((feature) => feature.properties?.distrito)
          .filter((district): district is string => typeof district === 'string')
        )].sort((left, right) => left.localeCompare(right, 'es'))
      : [];

    return {
      // Keep SSR lightweight; full report is fetched client-side on mount.
      report: null as RebalancingReport | null,
      districtNames,
      tableParams,
    };
  });
