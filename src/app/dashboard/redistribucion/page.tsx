import type { Metadata } from 'next';
import { buildRebalancingReport } from '@/lib/rebalancing-report';
import { fetchDistrictCollection } from '@/lib/districts';
import { RedistribucionClient } from './_components/RedistribucionClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Redistribución | Dashboard Bizi',
};

function getTableParams(params: { [key: string]: string | string[] | undefined }) {
  const getFirst = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v;
  const sort = getFirst(params.sort);
  const filter = getFirst(params.filter);
  const search = getFirst(params.search);
  const page = getFirst(params.page);
  const pageSize = getFirst(params.pageSize);
  return {
    sort: sort?.includes(':') ? sort : undefined,
    filter: filter?.includes(':') ? filter : undefined,
    search,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };
}

export default async function RedistribucionPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const [report, districtCollection] = await Promise.all([
    buildRebalancingReport({ days: 15 }),
    fetchDistrictCollection().catch(() => null),
  ]);

  const districtNames = districtCollection
    ? [...new Set(districtCollection.features
        .map((f) => f.properties?.distrito)
        .filter((d): d is string => typeof d === 'string')
      )].sort((a, b) => a.localeCompare(b, 'es'))
    : [];

  return (
    <RedistribucionClient
      initialReport={report}
      districtNames={districtNames}
      tableParams={getTableParams(params)}
    />
  );
}