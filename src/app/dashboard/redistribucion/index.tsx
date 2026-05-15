import { createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';
import { getDashboardRebalancingPageData } from '@/server-functions/dashboard-redistribucion';
import type { RebalancingReport } from '@/types/rebalancing';

export const Route = createFileRoute('/dashboard/redistribucion/')({
  head: () => {
    const title = 'Redistribución | Dashboard Bizi'
    const description = 'Revisa donde faltan bicis o huecos en Bizi Zaragoza y que movimientos ayudan a equilibrar mejor el sistema.'
    return {
      meta: [
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
  loader: async ({ searchParams }) => getDashboardRebalancingPageData({ data: searchParams ? await searchParams : {} }),
  component: RedistribucionPage,
});

export default function RedistribucionPage() {
  const { report, districtNames, tableParams } = Route.useLoaderData();
  
  return (
    <Suspense>
      <RedistribucionClientWrapper
        initialReport={report}
        districtNames={districtNames}
        tableParams={tableParams}
      />
    </Suspense>
  );
}

async function RedistribucionClientWrapper({ 
  initialReport, 
  districtNames, 
  tableParams 
}: {
  initialReport: RebalancingReport;
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
