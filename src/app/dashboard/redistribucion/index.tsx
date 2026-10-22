import { createFileRoute } from '@tanstack/react-router';
import { buildSeoHead } from '@/lib/seo-head'
import { lazy, Suspense, useState } from 'react';
import { z } from 'zod';
import { getDashboardRebalancingPageData } from '@/server-functions/dashboard-redistribucion';

const RedistribucionClient = lazy(() =>
  import('@/app/dashboard/redistribucion/_components/RedistribucionClient').then(m => ({ default: m.RedistribucionClient }))
);

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
  loader: () => getDashboardRebalancingPageData(),
  component: RedistribucionPage,
});

function RedistribucionPage() {
  const { districtNames } = Route.useLoaderData();
  // La tabla solo usa los parametros como estado inicial; congelarlos evita
  // re-renderizar el informe cada vez que la tabla reescribe la URL.
  const search = Route.useSearch();
  const [tableParams] = useState(() => search);

  return (
    <Suspense fallback={<RebalancingSkeleton />}>
      <RedistribucionClientWrapper
        districtNames={districtNames}
        tableParams={tableParams}
      />
    </Suspense>
  );
}

function RebalancingSkeleton() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 animate-pulse">
      <div className="mb-6">
        <div className="h-8 w-48 rounded bg-[var(--border)]" />
        <div className="mt-2 h-4 w-72 rounded bg-[var(--border)]" />
      </div>
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="h-9 w-[230px] rounded-lg bg-[var(--border)]" />
        <div className="h-9 w-[190px] rounded-lg bg-[var(--border)]" />
      </div>
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-[var(--card)] border border-[var(--border)]" />
        ))}
      </div>
      <div className="h-10 w-full rounded-t-lg bg-[var(--border)] mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 rounded bg-[var(--border)] opacity-60" />
        ))}
      </div>
    </div>
  );
}

function RedistribucionClientWrapper({
  districtNames,
  tableParams
}: {
  districtNames: string[];
  tableParams: Record<string, unknown>;
}) {
  return (
    <RedistribucionClient
      districtNames={districtNames}
      tableParams={tableParams}
    />
  );
}
