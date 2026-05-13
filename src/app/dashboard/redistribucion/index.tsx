import { createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';
import { getDashboardRebalancingPageData } from '@/server-functions/dashboard-redistribucion';

export const Route = createFileRoute('/dashboard/redistribucion/')({
  head: () => ({
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
    title: 'Redistribución | Dashboard Bizi',
  }),
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
  initialReport: any;
  districtNames: string[];
  tableParams: any;
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
