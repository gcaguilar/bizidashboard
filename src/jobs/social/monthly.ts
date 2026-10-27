/**
 * Carrusel mensual (dia 1, 10:00 Europe/Madrid).
 *
 * Usa el informe mensual ya construido y sellado (`buildMonthlyReport`); no
 * recalcula cifras ni publica meses sin cobertura. El informe del mes anterior
 * esta sellado desde las 05:00 UTC, cinco horas antes de este slot.
 */

import { logger } from '@/lib/logger';
import { buildMonthlyReport } from '@/lib/monthly-report';
import { getPreviousMonthKey } from '@/lib/social/data';
import { buildMonthlyCarousel } from '@/lib/social/story';
import type { SocialCarousel } from '@/lib/social/types';

import type { SocialSlotDataDeps } from './shared';

export async function runMonthlySlot(
  deps: SocialSlotDataDeps
): Promise<SocialCarousel | null> {
  const { now, config } = deps;
  const monthKey = getPreviousMonthKey(now, config.timezone);

  if (!monthKey) {
    logger.info('social.monthly_data_unavailable', { reason: 'missing_month_key' });
    return null;
  }

  const report = await buildMonthlyReport(monthKey, now.toISOString());

  if (!report.hasReport) {
    logger.info('social.monthly_data_unavailable', {
      monthKey,
      reason: 'report_not_ready',
    });
  } else if (report.coverage.coveredDays <= 0 || report.coverage.expectedDays <= 0) {
    logger.info('social.monthly_data_unavailable', {
      monthKey,
      reason: 'coverage',
    });
  }

  return buildMonthlyCarousel({
    report,
    reportPath: `/informes/${monthKey}`,
  });
}
