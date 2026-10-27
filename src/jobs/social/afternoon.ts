/**
 * Slot de tarde (18:30 Europe/Madrid).
 *
 * Prioridad editorial: alerta activa de 3 h, racha critica, pico horario
 * inusual y, si no hay nada, pulso de vuelta por distritos. La story solo se
 * salta cuando el snapshot no es fresco; si hay datos, siempre hay publicacion.
 */

import { getCriticalEpisodes } from '@/analytics/queries/rebalancing';
import { getActiveAlerts, getStationsWithLatestStatus } from '@/analytics/queries/read';
import {
  getHourlyNetworkActivityBaseline,
  getLatestCompletedHourMobility,
} from '@/analytics/queries/social';
import { formatHourMinute } from '@/lib/format';
import { logger } from '@/lib/logger';
import { buildNetworkHealth } from '@/lib/network-health';
import { getServiceCause } from '@/lib/service-calendar';
import {
  aggregateDistrictStats,
  evaluateHourlyActivityAnomaly,
  getSlotDateKey,
  topDistrictsByActivity,
} from '@/lib/social/data';
import { buildAfternoonStory } from '@/lib/social/story';
import type { SocialStory } from '@/lib/social/types';

import { loadStationDistrictMap } from './districts';
import {
  filterCurrentEpisodes,
  getLatestBucketContext,
  getLatestMobilityBucketStart,
  getLatestRecordedAt,
  isLatestMobilityFresh,
  isStationSnapshotFresh,
  mapActiveAlerts,
  mapAfternoonAnomaly,
  mapCriticalEpisodes,
  mapHourlyActivitySamples,
  mapLatestHourDemandRows,
  mapNetworkHealth,
  mapServiceCause,
  sumLatestHourActivity,
} from './mappers';
import type { SocialSlotDataDeps } from './shared';

export async function runAfternoonSlot(
  deps: SocialSlotDataDeps
): Promise<SocialStory | null> {
  const { now, config } = deps;
  const dateKey = getSlotDateKey('afternoon', now, config.timezone);
  const stations = await getStationsWithLatestStatus();
  const fresh = isStationSnapshotFresh(stations, now);

  if (stations.length === 0 || !fresh) {
    logger.info('social.afternoon_data_unavailable', {
      dateKey,
      stations: stations.length,
      fresh,
    });
    return null;
  }

  const [alerts, episodes, baselineRows, mobility] = await Promise.all([
    getActiveAlerts(200),
    getCriticalEpisodes(1),
    getHourlyNetworkActivityBaseline(12, now),
    getLatestCompletedHourMobility(),
  ]);

  if (!isLatestMobilityFresh(mobility, now)) {
    logger.info('social.afternoon_data_unavailable', {
      dateKey,
      reason: 'mobility_stale',
      rows: mobility.length,
    });
    return null;
  }

  const stationNameById = new Map(
    stations.map((station) => [station.id, station.name])
  );

  const bucketStart = getLatestMobilityBucketStart(mobility);
  const dataWindow = bucketStart
    ? `${formatHourMinute(bucketStart, config.timezone)}–${formatHourMinute(now, config.timezone)}`
    : undefined;

  const bucket = getLatestBucketContext(mobility, config.timezone);
  const anomaly = bucket
    ? mapAfternoonAnomaly({
        anomaly: evaluateHourlyActivityAnomaly(
          sumLatestHourActivity(mobility),
          mapHourlyActivitySamples(baselineRows),
          bucket.weekday,
          bucket.hour
        ),
        weekday: bucket.weekday,
        hour: bucket.hour,
      })
    : null;

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

  const cause = mapServiceCause(getServiceCause(dateKey));

  return buildAfternoonStory({
    dateKey,
    network,
    alerts: mapActiveAlerts(alerts, stationNameById),
    episodes: filterCurrentEpisodes(
      mapCriticalEpisodes(episodes, stationNameById),
      stations
    ),
    anomaly,
    topDistricts: topDistrictsByActivity(districtStats, 3),
    cause,
    dataWindow,
  });
}
