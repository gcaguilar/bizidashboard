import { createServerFn } from '@tanstack/react-start';
import { loadDashboardRebalancingPageData } from '@/server-functions/dashboard-redistribucion.server';

export const getDashboardRebalancingPageData = createServerFn({ method: 'GET' }).handler(
  async () => loadDashboardRebalancingPageData()
);
