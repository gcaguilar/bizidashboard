/**
 * Pieza semanal de variedad (miercoles 09:00 Europe/Madrid).
 *
 * No es una story utilitaria: cada semana rota un tema editorial distinto
 * (estacion, explicador, record, mito o red) para que la cuenta no cuente
 * siempre la misma historia. El tema sale de la semana ISO, asi que es
 * determinista; si el tema no tiene datos suficientes, el slot se salta.
 */

import {
  getStationDailyDemand,
  getStationsWithLatestStatus,
} from '@/analytics/queries/read';
import { getWeeklyStationFriction } from '@/analytics/queries/social';
import { logger } from '@/lib/logger';
import { buildMonthlyReport } from '@/lib/monthly-report';
import {
  getFeatureTheme,
  getPreviousMonthKey,
  getPreviousWeekRange,
  getSlotDateKey,
} from '@/lib/social/data';
import { buildFeatureStory } from '@/lib/social/story';
import type { SocialStory } from '@/lib/social/types';

import {
  mapDailyDemandRows,
  mapWeeklyFrictionRows,
} from './mappers';
import { getRecentStationIds, type SocialSlotDataDeps } from './shared';

/** 14 dias cubren la ultima semana completa y margen de huso horario. */
const FEATURE_DEMAND_DAYS = 14;

export async function runFeatureSlot(
  deps: SocialSlotDataDeps
): Promise<SocialStory | null> {
  const { now, config } = deps;
  const dateKey = getSlotDateKey('feature', now, config.timezone);
  const theme = getFeatureTheme(dateKey);
  const week = getPreviousWeekRange(now, config.timezone);

  const stations = await getStationsWithLatestStatus();
  if (stations.length === 0) {
    logger.info('social.feature_data_unavailable', {
      dateKey,
      theme,
      reason: 'no_stations',
    });
    return null;
  }

  const needsReport = theme === 'record' || theme === 'myth';
  const monthKey = needsReport ? getPreviousMonthKey(now, config.timezone) : null;

  if (needsReport && !monthKey) {
    logger.info('social.feature_data_unavailable', {
      dateKey,
      theme,
      reason: 'missing_month_key',
    });
    return null;
  }

  const [frictionRows, dailyRows, recentStationIds, report] = await Promise.all([
    getWeeklyStationFriction(1, now),
    getStationDailyDemand(FEATURE_DEMAND_DAYS),
    getRecentStationIds(deps),
    monthKey ? buildMonthlyReport(monthKey, now.toISOString()) : Promise.resolve(null),
  ]);

  const demand = mapDailyDemandRows(dailyRows, {
    startDateKey: week.weekStart,
    endDateKey: week.weekEnd,
  });
  const friction = mapWeeklyFrictionRows(frictionRows);

  const story = buildFeatureStory({
    dateKey,
    theme,
    stations,
    demand,
    friction,
    recentStationIds,
    report,
  });

  if (!story) {
    logger.info('social.feature_data_unavailable', {
      dateKey,
      theme,
      reason: 'insufficient_data',
    });
  }

  return story;
}
