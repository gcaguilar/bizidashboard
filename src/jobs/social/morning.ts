/**
 * Slot de manana (08:30 Europe/Madrid).
 *
 * Datos: snapshot fresco, perfil historico de dias laborables 07:00-08:59 y
 * contexto de red. La story solo habla de disponibilidad de bicis, asi que no
 * depende del rollup horario de actividad. Si el snapshot esta vacio o tiene
 * mas de 10 minutos, devuelve `null` para que el wrapper lo registre como
 * `skipped` y no se publique informacion vieja.
 */

import { getWeekdayMorningProfiles } from '@/analytics/queries/social';
import { getStationsWithLatestStatus } from '@/analytics/queries/read';
import { formatHourMinute } from '@/lib/format';
import { logger } from '@/lib/logger';
import { buildNetworkHealth } from '@/lib/network-health';
import { getServiceCause } from '@/lib/service-calendar';
import { findNearbyAlternative, getSlotDateKey, selectMorningStations } from '@/lib/social/data';
import { buildMorningStory } from '@/lib/social/story';
import type { SocialNearbyAlternative, SocialStory } from '@/lib/social/types';

import {
  aggregateMorningProfiles,
  getLatestRecordedAt,
  isStationSnapshotFresh,
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

  const profiles = aggregateMorningProfiles(await getWeekdayMorningProfiles());

  const selection = selectMorningStations({
    stations,
    profiles,
    limit: 3,
    cohortSize: 40,
  });

  // Primera estacion destacada con una alternativa a pie; si ninguna la tiene,
  // la story no sugiere nada.
  let alternative: SocialNearbyAlternative | null = null;
  for (const station of selection.stations) {
    alternative = findNearbyAlternative(station, stations);
    if (alternative) {
      break;
    }
  }

  // La story muestra la hora real de la foto de datos, no la hora del cron.
  const latestRecordedAt = getLatestRecordedAt(stations);
  const dataWindow = latestRecordedAt
    ? formatHourMinute(latestRecordedAt, config.timezone)
    : undefined;

  const network = mapNetworkHealth(
    buildNetworkHealth({
      stations,
      pipelineHealthy: fresh,
      lastUpdatedAt: latestRecordedAt,
      nowIso: now.toISOString(),
      locale: 'es',
    })
  );

  return buildMorningStory({
    dateKey,
    selection,
    profiles,
    alternative,
    network,
    cause: mapServiceCause(getServiceCause(dateKey)),
    dataWindow,
  });
}
