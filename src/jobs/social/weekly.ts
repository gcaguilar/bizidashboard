/**
 * Carrusel semanal (lunes 09:00 Europe/Madrid).
 *
 * Ventana: ultima semana completa lunes-domingo. La comparacion es la semana
 * inmediatamente anterior (los 7 dias previos). La demanda sale de
 * `DailyStationStat` y la friccion de las horas vacia/llena semanales; ambos se
 * agregan por distrito con el GeoJSON local.
 */

import {
  getStationDailyDemand,
  getStationsWithLatestStatus,
} from '@/analytics/queries/read';
import { getWeeklyStationFriction } from '@/analytics/queries/social';
import { logger } from '@/lib/logger';
import { buildNetworkHealth } from '@/lib/network-health';
import { getServiceCause } from '@/lib/service-calendar';
import {
  addDaysToDateKey,
  aggregateDistrictStats,
  getPreviousWeekRange,
} from '@/lib/social/data';
import { buildWeeklyCarousel } from '@/lib/social/story';
import type { SocialCarousel } from '@/lib/social/types';

import { loadStationDistrictMap } from './districts';
import {
  getLatestRecordedAt,
  isStationSnapshotFresh,
  mapDailyDemandRows,
  mapNetworkHealth,
  mapServiceCause,
  mapWeeklyFrictionRows,
} from './mappers';
import type { SocialSlotDataDeps } from './shared';

/** 21 dias cubren la semana analizada, la anterior y margen de huso horario. */
const WEEKLY_DEMAND_DAYS = 21;
/** La semana publicada y la de comparacion deben estar completas. */
const MIN_WEEKLY_DAYS = 7;

function daysWithData(
  rows: readonly { day: string }[],
  startDateKey: string,
  endDateKey: string
): number {
  const days = new Set<string>();
  for (const row of rows) {
    if (row.day >= startDateKey && row.day <= endDateKey) {
      days.add(row.day);
    }
  }
  return days.size;
}

export async function runWeeklySlot(
  deps: SocialSlotDataDeps
): Promise<SocialCarousel | null> {
  const { now, config } = deps;
  const week = getPreviousWeekRange(now, config.timezone);
  const previousStart = addDaysToDateKey(week.weekStart, -7);
  const previousEnd = addDaysToDateKey(week.weekStart, -1);

  const stations = await getStationsWithLatestStatus();
  if (stations.length === 0) {
    logger.info('social.weekly_data_unavailable', {
      weekStart: week.weekStart,
      stations: 0,
    });
    return null;
  }

  const districtByStation = await loadStationDistrictMap(stations);
  const [dailyRows, frictionRows] = await Promise.all([
    getStationDailyDemand(WEEKLY_DEMAND_DAYS),
    getWeeklyStationFriction(1, now),
  ]);

  const currentDays = daysWithData(dailyRows, week.weekStart, week.weekEnd);
  const previousDays = daysWithData(dailyRows, previousStart, previousEnd);

  if (currentDays < MIN_WEEKLY_DAYS || previousDays < MIN_WEEKLY_DAYS) {
    logger.info('social.weekly_data_unavailable', {
      weekStart: week.weekStart,
      currentDays,
      previousDays,
    });
    return null;
  }

  const districts = aggregateDistrictStats({
    current: mapDailyDemandRows(dailyRows, {
      startDateKey: week.weekStart,
      endDateKey: week.weekEnd,
      districtByStation,
    }),
    previous: mapDailyDemandRows(dailyRows, {
      startDateKey: previousStart,
      endDateKey: previousEnd,
      districtByStation,
    }),
    friction: mapWeeklyFrictionRows(frictionRows, districtByStation),
    districtByStation,
  });

  if (districts.length === 0) {
    logger.info('social.weekly_data_unavailable', {
      weekStart: week.weekStart,
      districts: 0,
    });
    return null;
  }

  const network = mapNetworkHealth(
    buildNetworkHealth({
      stations,
      pipelineHealthy: isStationSnapshotFresh(stations, now),
      lastUpdatedAt: getLatestRecordedAt(stations),
      nowIso: now.toISOString(),
      locale: 'es',
    })
  );

  return buildWeeklyCarousel({
    week,
    districts,
    network,
    cause: mapServiceCause(getServiceCause(week.weekStart)),
  });
}
