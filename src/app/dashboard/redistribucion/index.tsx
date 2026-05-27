import { createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';
import { z } from 'zod';
import { getDashboardRebalancingPageData } from '@/server-functions/dashboard-redistribucion';
import type { RebalancingReport } from '@/types/rebalancing';

export const Route = createFileRoute('/dashboard/redistribucion/')({
  validateSearch: z.object({
    sort: z.string().optional(),
    filter: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
  head: () => {
    const title = 'Redistribución | Dashboard Bizi'
    const description = 'Revisa donde faltan bicis o huecos en Bizi Zaragoza y que movimientos ayudan a equilibrar mejor el sistema.'
    return {
      meta: [
        { title },
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { name: 'robots', content: 'noindex, nofollow' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
      title,
    }
  },
  loaderDeps: ({ search }) => ({
    sort: search.sort,
    filter: search.filter,
    search: search.search,
    page: search.page,
    pageSize: search.pageSize,
  }),
  loader: async ({ deps }) =>
    getDashboardRebalancingPageData({
      data: {
        sort: deps.sort,
        filter: deps.filter,
        search: deps.search,
        page: deps.page,
        pageSize: deps.pageSize,
      },
    }),
  component: RedistribucionPage,
});

export default function RedistribucionPage() {
  const { report, districtNames, tableParams } = Route.useLoaderData();
  
  return (
    <Suspense fallback={<RebalancingSkeleton />}>
      <RedistribucionClientWrapper
        initialReport={report}
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

async function RedistribucionClientWrapper({ 
  initialReport, 
  districtNames, 
  tableParams 
}: {
  initialReport: RebalancingReport | null;
  districtNames: string[];
  tableParams: Record<string, unknown>;
}) {
  const { RedistribucionClient } = await import('@/app/dashboard/redistribucion/_components/RedistribucionClient');
  return (
    <RedistribucionClient
      initialReport={initialReport}
      districtNames={districtNames}
      tableParams={tableParams}
    />
  );
}
