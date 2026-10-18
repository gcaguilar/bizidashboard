import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { loadDashboardRebalancingPageData } from '@/server-functions/dashboard-redistribucion.server';

const RebalancingSearchParamsSchema = z.object({
  sort: z.string().regex(/^[a-zA-Z0-9_]+:(asc|desc)$/).optional(),
  filter: z.string().regex(/^[a-zA-Z0-9_]+:[^:]+$/).optional(),
  search: z.string().trim().max(120).optional(),
  page: z.number().int().min(0).optional(),
  pageSize: z.number().int().min(1).max(200).optional(),
}).default({});

export type RebalancingSearchParams = z.infer<typeof RebalancingSearchParamsSchema>;

export const getDashboardRebalancingPageData = createServerFn({ method: 'GET' })
  .validator(RebalancingSearchParamsSchema)
  .handler(
    async ({ data: params }: { data: RebalancingSearchParams | undefined }) =>
      loadDashboardRebalancingPageData(params)
  );
