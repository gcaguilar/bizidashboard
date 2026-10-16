import { createServerFn } from '@tanstack/react-start';
import { buildFallbackHistoryMetadata } from '@/lib/shared-data-fallbacks';

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
