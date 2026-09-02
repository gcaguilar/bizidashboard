import { redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { isValidMonthKey } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { buildPeriodCoverage } from '@/lib/temporal-comparison';

const MonthInputSchema = z.string().optional();

export const getReportMonthPageData = createServerFn({ method: 'GET' })
  .validator(MonthInputSchema)
  .handler(async ({ data: month }: { data: string | undefined }) => {
    if (!month || !isValidMonthKey(month)) {
      throw redirect({ to: appRoutes.reports() });
    }

    try {
      const [{ fetchCachedDailyDemandCurve, fetchCachedMonthlyDemandCurve }] = await Promise.all([
        import('@/lib/analytics-series'),
        import('@/lib/shared-data-fallbacks'),
      ]);
      const [monthlySeries, dailySeries] = await Promise.all([
        fetchCachedMonthlyDemandCurve(12).catch((error) => {
          captureExceptionWithContext(error, { area: 'informes.month', operation: 'fetchCachedMonthlyDemandCurve' });
          return [];
        }),
        fetchCachedDailyDemandCurve(31, month).catch((error) => {
          captureExceptionWithContext(error, { area: 'informes.month', operation: 'fetchCachedDailyDemandCurve' });
          return [];
        }),
      ]);
      const monthRow = monthlySeries.find((row) => row.monthKey === month) ?? null;
      const periodCoverage = buildPeriodCoverage(
        month,
        dailySeries.map((row) => ({
          day: row.day,
          demandScore: Number(row.demandScore),
          sampleCount: Number(row.sampleCount),
        })),
        new Date().toISOString()
      );

      return {
        month,
        monthRow,
        periodCoverage,
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
