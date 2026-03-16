import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import { HelpCenterClient } from './_components/HelpCenterClient';

export const revalidate = 3600;

export const metadata: Metadata = buildPageMetadata({
  title: 'Centro de ayuda',
  description:
    'FAQ del dashboard de Bizi Zaragoza para entender alertas, rankings, movilidad, predicciones y metodologia de calculo.',
  path: '/dashboard/ayuda',
});

export default function DashboardHelpPage() {
  return <HelpCenterClient />;
}
