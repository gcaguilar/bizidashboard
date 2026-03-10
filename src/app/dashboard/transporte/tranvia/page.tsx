import type { Metadata } from 'next';
import { SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site';
import { TransitDashboardClient } from '../_components/TransitDashboardClient';
import { getTransitDashboardData } from '../_lib';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tranvia',
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/dashboard/transporte/tranvia' },
  openGraph: {
    title: `${SITE_TITLE} - Tranvia`,
    description: SITE_DESCRIPTION,
    url: '/dashboard/transporte/tranvia',
  },
};

export default async function TramDashboardPage() {
  const data = await getTransitDashboardData('tram');
  return <TransitDashboardClient mode="tram" {...data} />;
}
