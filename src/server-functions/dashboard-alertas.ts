import { createServerFn } from '@tanstack/react-start';

export const getAlertsHistoryPageData = createServerFn({ method: 'GET' }).handler(async () => {
  const { fetchStations } = await import('@/lib/api');
  const stations = await fetchStations().catch(() => ({
    stations: [],
    generatedAt: new Date().toISOString(),
  }));

  return { stations };
});
