import type { Metadata } from 'next';
import { SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site';
import { TransitDashboardClient } from '../_components/TransitDashboardClient';
import { getTransitDashboardData } from '../_lib';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Bus urbano',
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/dashboard/transporte/bus' },
  openGraph: {
    title: `${SITE_TITLE} - Bus urbano`,
    description: SITE_DESCRIPTION,
    url: '/dashboard/transporte/bus',
  },
};

export default async function BusDashboardPage() {
  const data = await getTransitDashboardData('bus');
  return <TransitDashboardClient mode="bus" {...data} />;
}
