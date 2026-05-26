import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import type { RebalancingReport } from '@/types/rebalancing';

const RebalancingSearchParamsSchema = z.object({
  sort: z.union([z.string(), z.array(z.string())]).optional(),
  filter: z.union([z.string(), z.array(z.string())]).optional(),
  search: z.union([z.string(), z.array(z.string())]).optional(),
  page: z.union([z.string(), z.array(z.string())]).optional(),
  pageSize: z.union([z.string(), z.array(z.string())]).optional(),
}).default({});

type RebalancingSearchParams = z.infer<typeof RebalancingSearchParamsSchema>;

const getFirst = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

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
    const sort = getFirst(params?.sort);
    const filter = getFirst(params?.filter);
    const search = getFirst(params?.search);
    const page = getFirst(params?.page);
    const pageSize = getFirst(params?.pageSize);
    const tableParams = {
      sort: sort?.includes(':') ? sort : undefined,
      filter: filter?.includes(':') ? filter : undefined,
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
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
