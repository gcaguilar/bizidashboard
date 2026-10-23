import { createFileRoute } from '@tanstack/react-router';
import { buildSeoHead } from '@/lib/seo-head'
import { useState } from 'react';
import { z } from 'zod';
import { getDashboardRebalancingPageData } from '@/server-functions/dashboard-redistribucion';

import { RedistribucionClient } from '@/app/dashboard/redistribucion/_components/RedistribucionClient';
import {
  DEFAULT_ANALYSIS_DAYS,
  rebalancingReportQueryOptions,
} from '@/app/dashboard/redistribucion/rebalancing-report-query';

export const Route = createFileRoute('/dashboard/redistribucion/')({
  validateSearch: z.object({
    sort: z.string().regex(/^[a-zA-Z0-9_]+:(asc|desc)$/).optional(),
    filter: z.string().regex(/^[a-zA-Z0-9_]+:[^:]+$/).optional(),
    search: z.string().trim().max(120).optional(),
    page: z.coerce.number().int().min(0).optional(),
    pageSize: z.coerce.number().int().min(1).max(200).optional(),
  }),
  head: () =>
    buildSeoHead({
      title: 'Redistribución | Dashboard Bizi',
      description: 'Revisa dónde faltan bicis o huecos en Bizi Zaragoza y qué señales apuntan a un desequilibrio.',
      robots: 'noindex, nofollow',
    }),
  loader: ({ context }) => {
    // En navegaciones (y preloads por hover) el informe se pide en paralelo al
    // resto de la ruta en vez de esperar a que el componente monte. No se espera:
    // el cliente enseña placeholders mientras llega. En la carga inicial el
    // loader corre en el servidor, que no debe calcular el informe en el SSR.
    if (typeof window !== 'undefined') {
      void context.queryClient.prefetchQuery(rebalancingReportQueryOptions(null, DEFAULT_ANALYSIS_DAYS));
    }
    return getDashboardRebalancingPageData();
  },
  component: RedistribucionPage,
});

function RedistribucionPage() {
  const { districtNames } = Route.useLoaderData();
  // La tabla solo usa los parametros como estado inicial; congelarlos evita
  // re-renderizar el informe cada vez que la tabla reescribe la URL.
  const search = Route.useSearch();
  const [tableParams] = useState(() => search);

  return (
    <RedistribucionClient
      districtNames={districtNames}
      tableParams={tableParams}
    />
  );
}
