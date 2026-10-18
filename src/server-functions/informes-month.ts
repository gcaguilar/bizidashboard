import { redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { resolveDataState } from '@/lib/data-state';
import { buildMonthlyReport } from '@/lib/monthly-report';
import { isValidMonthKey } from '@/lib/months';
import { appRoutes } from '@/lib/routes';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import { buildFallbackMonthlyReport } from '@/lib/shared-data-fallbacks';

const MonthInputSchema = z.string().optional();

export const getReportMonthPageData = createServerFn({ method: 'GET' })
  .validator(MonthInputSchema)
  .handler(async ({ data: month }: { data: string | undefined }) => {
    if (!month || !isValidMonthKey(month)) {
      throw redirect({ to: appRoutes.reports() });
    }

    const nowIso = new Date().toISOString();

    try {
      const report = await buildMonthlyReport(month, nowIso);
      const monthRow =
        report.trends.monthly.find((row) => row.monthKey === month) ?? null;

      return {
        month,
        monthRow,
        report,
        nearbyMonths: report.trends.monthly
          .filter((row) => row.monthKey !== month)
          .slice(-6)
          .reverse()
          .map((row) => row.monthKey),
        dataState: resolveDataState({
          hasData: report.hasReport,
          hasCoverage: report.hasReport || report.coverage.coveredDays > 0,
        }),
      };
    } catch (error) {
      captureExceptionWithContext(error, { area: 'reports.month', operation: 'loader' });
      const report = buildFallbackMonthlyReport(month, nowIso);

      return {
        month,
        monthRow: null,
        report,
        nearbyMonths: [] as string[],
        dataState: 'error' as const,
      };
    }
  });
