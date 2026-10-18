import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { fetchDistrictCollection } from '@/lib/districts.server';

const RebalancingSearchParamsSchema = z.object({
  sort: z.string().regex(/^[a-zA-Z0-9_]+:(asc|desc)$/).optional(),
  filter: z.string().regex(/^[a-zA-Z0-9_]+:[^:]+$/).optional(),
  search: z.string().trim().max(120).optional(),
  page: z.number().int().min(0).optional(),
  pageSize: z.number().int().min(1).max(200).optional(),
}).default({});

type RebalancingSearchParams = z.infer<typeof RebalancingSearchParamsSchema>;

export type DashboardRebalancingPageData = {
  districtNames: string[];
  tableParams: RebalancingSearchParams;
};

/**
 * Cabecera de la pagina (barrios y parametros de tabla). El informe completo lo
 * pide el cliente al montar, asi que el SSR no carga ni compacta el informe.
 */
export async function loadDashboardRebalancingPageData(
  params: RebalancingSearchParams | undefined
): Promise<DashboardRebalancingPageData> {
  const districtCollection = await fetchDistrictCollection().catch(() => null);

  const districtNames = districtCollection
    ? [...new Set(districtCollection.features
        .map((feature) => feature.properties?.distrito)
        .filter((district): district is string => typeof district === 'string')
      )].sort((left, right) => left.localeCompare(right, 'es'))
    : [];

  return {
    districtNames,
    tableParams: {
      sort: params?.sort,
      filter: params?.filter,
      search: params?.search,
      page: params?.page,
      pageSize: params?.pageSize,
    },
  };
}

export const getDashboardRebalancingPageData = createServerFn({ method: 'GET' })
  .validator(RebalancingSearchParamsSchema)
  .handler(
    async ({ data: params }: { data: RebalancingSearchParams | undefined }) =>
      loadDashboardRebalancingPageData(params)
  );
