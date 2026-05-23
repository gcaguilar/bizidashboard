import { redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { isValidMonthKey } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';

const MonthInputSchema = z.string().optional();

export const getReportMonthPageData = createServerFn({ method: 'GET' })
  .inputValidator(MonthInputSchema)
  .handler(async ({ data: month }: { data: string | undefined }) => {
    if (!month || !isValidMonthKey(month)) {
      throw redirect({ to: appRoutes.reports() });
    }

    const nowIso = new Date().toISOString();
    try {
      const [{ fetchCachedMonthlyDemandCurve }, { buildFallbackDatasetSnapshot }] = await Promise.all([
        import('@/lib/analytics-series'),
        import('@/lib/shared-data-fallbacks'),
      ]);
      const monthlySeries = await fetchCachedMonthlyDemandCurve(36).catch(() => {
        buildFallbackDatasetSnapshot(nowIso);
        return [];
      });
      const monthRow = monthlySeries.find((row) => row.monthKey === month) ?? null;

      return {
        month,
        monthRow,
        nearbyMonths: monthlySeries
          .filter((row) => row.monthKey !== month)
          .slice(0, 6)
          .map((row) => row.monthKey),
        dataState: monthRow ? ('ok' as const) : ('no_coverage' as const),
      };
    } catch (error) {
      captureExceptionWithContext(error, { area: 'informes.month', operation: 'loader' });
      return { month, dataState: 'error' as const };
    }
  });
