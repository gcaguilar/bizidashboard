import type { Metadata } from 'next';
import { SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site';
import { HelpCenterClient } from './_components/HelpCenterClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Centro de ayuda',
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/dashboard/ayuda',
  },
  openGraph: {
    title: `${SITE_TITLE} - Centro de ayuda`,
    description: SITE_DESCRIPTION,
    url: '/dashboard/ayuda',
  },
};

export default function DashboardHelpPage() {
  return <HelpCenterClient />;
}
