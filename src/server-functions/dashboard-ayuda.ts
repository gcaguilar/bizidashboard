import { createServerFn } from '@tanstack/react-start';
import type { HistoryMetadata, SharedDataSource } from '@/services/shared-data/types';

function buildFallbackHistoryMetadata(nowIso: string, source: SharedDataSource): HistoryMetadata {
  return {
    source,
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

export const getDashboardHelpPageData = createServerFn({ method: 'GET' }).handler(async () => {
  const [{ fetchHistoryMetadata }, { getSharedDataSource }] = await Promise.all([
    import('@/lib/api'),
    import('@/services/shared-data'),
  ]);
  const nowIso = new Date().toISOString();
  const dataSource = getSharedDataSource();
  const historyMeta = await fetchHistoryMetadata().catch(() =>
    buildFallbackHistoryMetadata(nowIso, dataSource)
  );

  return { historyMeta };
});
