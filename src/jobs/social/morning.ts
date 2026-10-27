/**
 * Slot de manana (08:30 Europe/Madrid).
 *
 * Datos: snapshot fresco, perfil de dias laborables 07:00-08:59, movimiento de
 * la ultima hora completa y contexto de red. Si el snapshot esta vacio o tiene
 * mas de 10 minutos, devuelve `null` para que el wrapper lo registre como
 * `skipped` y no se publique informacion vieja.
 */

import {
  getLatestCompletedHourMobility,
  getWeekdayMorningProfiles,
} from '@/analytics/queries/social';
import { getStationsWithLatestStatus } from '@/analytics/queries/read';
import { formatHourMinute } from '@/lib/format';
import { logger } from '@/lib/logger';
import { buildNetworkHealth } from '@/lib/network-health';
import { getServiceCause } from '@/lib/service-calendar';
import {
  aggregateDistrictStats,
  getSlotDateKey,
  selectMorningStations,
  topDistrictsByActivity,
} from '@/lib/social/data';
import { buildMorningStory } from '@/lib/social/story';
import type { SocialStory } from '@/lib/social/types';

import { loadStationDistrictMap } from './districts';
import {
  aggregateMorningProfiles,
  getLatestMobilityBucketStart,
  getLatestRecordedAt,
  isLatestMobilityFresh,
  isStationSnapshotFresh,
  mapLatestHourDemandRows,
  mapNetworkHealth,
  mapServiceCause,
} from './mappers';
import type { SocialSlotDataDeps } from './shared';

export async function runMorningSlot(
  deps: SocialSlotDataDeps
): Promise<SocialStory | null> {
  const { now, config } = deps;
  const dateKey = getSlotDateKey('morning', now, config.timezone);
  const stations = await getStationsWithLatestStatus();
  const fresh = isStationSnapshotFresh(stations, now);

  if (stations.length === 0 || !fresh) {
    logger.info('social.morning_data_unavailable', {
      dateKey,
      stations: stations.length,
      fresh,
    });
    return null;
  }

  const [profileRows, mobility] = await Promise.all([
    getWeekdayMorningProfiles(),
    getLatestCompletedHourMobility(),
  ]);

  if (!isLatestMobilityFresh(mobility, now)) {
    logger.info('social.morning_data_unavailable', {
      dateKey,
      reason: 'mobility_stale',
      rows: mobility.length,
    });
    return null;
  }

  const selection = selectMorningStations({
    stations,
    profiles: aggregateMorningProfiles(profileRows),
    limit: 3,
    cohortSize: 40,
  });

  const bucketStart = getLatestMobilityBucketStart(mobility);
  const dataWindow = bucketStart
    ? `${formatHourMinute(bucketStart, config.timezone)}–${formatHourMinute(now, config.timezone)}`
    : undefined;

  const districtByStation = await loadStationDistrictMap(stations);
  const districtStats = aggregateDistrictStats({
    current: mapLatestHourDemandRows(mobility, districtByStation),
    districtByStation,
  });

  const network = mapNetworkHealth(
    buildNetworkHealth({
      stations,
      pipelineHealthy: fresh,
      lastUpdatedAt: getLatestRecordedAt(stations),
      nowIso: now.toISOString(),
      locale: 'es',
    })
  );

  return buildMorningStory({
    dateKey,
    selection,
    topDistricts: topDistrictsByActivity(districtStats, 2),
    network,
    cause: mapServiceCause(getServiceCause(dateKey)),
    dataWindow,
  });
}
