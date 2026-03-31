import type { Metadata } from 'next';
import { buildRebalancingReport } from '@/lib/rebalancing-report';
import { fetchDistrictCollection } from '@/lib/districts';
import { RedistribucionClient } from './_components/RedistribucionClient';

export const dynamic = 'force-dynamic';

// Minimal metadata for browser tab — no SEO optimisation (internal operational page)
export const metadata: Metadata = {
  title: 'Redistribución | Dashboard Bizi',
};

export default async function RedistribucionPage() {
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
    />
  );
}
