import type { Metadata } from 'next';
import { fetchHistoryMetadata } from '@/lib/api';
import { buildPageMetadata } from '@/lib/seo';
import { getSharedDataSource, type HistoryMetadata } from '@/services/shared-data';
import { HelpCenterClient } from './_components/HelpCenterClient';

export const revalidate = 3600;

export const metadata: Metadata = buildPageMetadata({
  title: 'Centro de ayuda',
  description:
    'FAQ del dashboard de Bizi Zaragoza para entender alertas, rankings, movilidad, predicciones y metodologia de calculo.',
  path: '/dashboard/ayuda',
});

function buildFallbackHistoryMetadata(nowIso: string): HistoryMetadata {
  return {
    source: getSharedDataSource(),
    coverage: {
      firstRecordedAt: null,
      lastRecordedAt: null,
      totalSamples: 0,
      totalStations: 0,
      totalDays: 0,
      generatedAt: nowIso,
    },
    generatedAt: nowIso,
  };
}

export default async function DashboardHelpPage() {
  const nowIso = new Date().toISOString();
  const historyMeta = await fetchHistoryMetadata().catch(() => buildFallbackHistoryMetadata(nowIso));

  return <HelpCenterClient historyMeta={historyMeta} />;
}
