/**
 * Slot de mediodia (13:00 Europe/Madrid).
 *
 * Datos: snapshot fresco, perfil historico de dias laborables 12:00-13:59 y
 * contexto de red. La story junta las dos caras de la hora: donde coger bici
 * (estaciones que suelen vaciarse) y donde dejarla (las que suelen llenarse),
 * cada una con su alternativa cercana. Si el snapshot esta vacio o tiene mas de
 * 10 minutos, devuelve `null` para que el wrapper lo registre como `skipped`.
 */

import { getWeekdayMiddayProfiles } from '@/analytics/queries/social';
import { getStationsWithLatestStatus } from '@/analytics/queries/read';
import { formatHourMinute } from '@/lib/format';
import { logger } from '@/lib/logger';
import { buildNetworkHealth } from '@/lib/network-health';
import { getServiceCause } from '@/lib/service-calendar';
import {
  findNearbyAlternative,
  getSlotDateKey,
  selectEveningStations,
  selectMorningStations,
} from '@/lib/social/data';
import { buildMiddayStory } from '@/lib/social/story';
import type { SocialNearbyAlternative, SocialStory } from '@/lib/social/types';

import {
  aggregateStationProfiles,
  getLatestRecordedAt,
  isStationSnapshotFresh,
  mapNetworkHealth,
  mapServiceCause,
} from './mappers';
import type { SocialSlotDataDeps } from './shared';

export async function runMiddaySlot(
  deps: SocialSlotDataDeps
): Promise<SocialStory | null> {
  const { now, config } = deps;
  const dateKey = getSlotDateKey('midday', now, config.timezone);
  const stations = await getStationsWithLatestStatus();
  const fresh = isStationSnapshotFresh(stations, now);

  if (stations.length === 0 || !fresh) {
    logger.info('social.midday_data_unavailable', {
      dateKey,
      stations: stations.length,
      fresh,
    });
    return null;
  }

  const profiles = aggregateStationProfiles(await getWeekdayMiddayProfiles());

  const emptyStations = selectMorningStations({
    stations,
    profiles,
    limit: 3,
    cohortSize: 40,
  });
  const fullStations = selectEveningStations({
    stations,
    profiles,
    limit: 3,
    cohortSize: 40,
  });

  // Primera estacion destacada de cada cara con una alternativa a pie.
  let bikesAlternative: SocialNearbyAlternative | null = null;
  for (const station of emptyStations.stations) {
    bikesAlternative = findNearbyAlternative(station, stations);
    if (bikesAlternative) {
      break;
    }
  }

  let anchorsAlternative: SocialNearbyAlternative | null = null;
  for (const station of fullStations.stations) {
    anchorsAlternative = findNearbyAlternative(station, stations, { kind: 'anchors' });
    if (anchorsAlternative) {
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

  return buildMiddayStory({
    dateKey,
    emptyStations,
    fullStations,
    bikesAlternative,
    anchorsAlternative,
    network,
    cause: mapServiceCause(getServiceCause(dateKey)),
    dataWindow,
  });
}
