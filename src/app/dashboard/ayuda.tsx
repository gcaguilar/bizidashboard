import { createFileRoute } from '@tanstack/react-router'
import { fetchHistoryMetadata } from '@/lib/api';
import { appRoutes } from '@/lib/routes';
import { getSharedDataSource, type HistoryMetadata } from '@/services/shared-data';
import { HelpCenterClient } from '@/app/dashboard/ayuda/_components/HelpCenterClient';

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

export const Route = createFileRoute('/dashboard/ayuda')({
  head: () => ({
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        name: 'description',
        content:
          'FAQ del dashboard de Bizi Zaragoza para entender alertas, rankings, movilidad, predicciones y metodologia de calculo.',
      },
      { property: 'og:type', content: 'website' },
    ],
    title: 'Centro de ayuda',
  }),
  loader: async () => {
    const nowIso = new Date().toISOString();
    const historyMeta = await fetchHistoryMetadata().catch(() => buildFallbackHistoryMetadata(nowIso));
    return { historyMeta };
  },
  component: DashboardHelpPage,
});

export default function DashboardHelpPage() {
  const { historyMeta } = Route.useLoaderData();
  return <HelpCenterClient historyMeta={historyMeta} />;
}
