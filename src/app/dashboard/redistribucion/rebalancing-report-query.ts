import { queryOptions } from '@tanstack/react-query';
import { appRoutes } from '@/lib/routes';
import { fetchJson } from '@/lib/fetch-json';
import type { RebalancingReport } from '@/types/rebalancing';

export const DEFAULT_ANALYSIS_DAYS = 15;

/**
 * Compartida entre el loader de la ruta (que lanza la peticion antes de que el
 * componente exista) y el cliente, para que ambos lean la misma entrada de cache.
 */
export function rebalancingReportQueryOptions(district: string | null, days: number) {
  return queryOptions({
    queryKey: ['dashboard', 'rebalancing-report', district, days] as const,
    queryFn: ({ signal }) =>
      fetchJson<RebalancingReport>(
        appRoutes.api.rebalancingReport({ district, days, view: 'compact' }),
        { signal, errorMessage: 'HTTP fetch failed' }
      ),
    // La API ya lo sirve con max-age=300; volver a la pagina no debe recalcularlo.
    staleTime: 5 * 60_000,
  });
}
