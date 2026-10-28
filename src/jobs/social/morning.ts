/**
 * Slot de manana (08:30 Europe/Madrid).
 *
 * Datos: snapshot fresco, perfil historico de dias laborables 07:00-08:59 (las
 * dos caras: estaciones que se vacian y que se llenan) y contexto de red. La story solo habla de disponibilidad de bicis, asi que no
 * depende del rollup horario de actividad. Si el snapshot esta vacio o tiene
 * mas de 10 minutos, devuelve `null` para que el wrapper lo registre como
 * `skipped` y no se publique informacion vieja.
 */

import { getRecentBikeSamples, getWeekdayMorningProfiles } from '@/analytics/queries/social';
import { getStationsWithLatestStatus } from '@/analytics/queries/read';
import { formatHourMinute } from '@/lib/format';
import { logger } from '@/lib/logger';
import { buildNetworkHealth } from '@/lib/network-health';
import { getServiceCause } from '@/lib/service-calendar';
import { isBacktestReliable } from '@/lib/prediction-backtest';
import { getStationPredictions } from '@/lib/predictions';
import {
  findDroppingStations,
  findNearbyAlternative,
  getSlotDateKey,
  modelContradictsDrop,
  selectEveningStations,
  selectMorningStations,
} from '@/lib/social/data';
import { buildMorningStory } from '@/lib/social/story';
import type {
  SocialDroppingStation,
  SocialNearbyAlternative,
  SocialStory,
} from '@/lib/social/types';

import {
  aggregateStationProfiles,
  getLatestRecordedAt,
  isStationSnapshotFresh,
  mapNetworkHealth,
  mapServiceCause,
} from './mappers';
import type { SocialSlotDataDeps } from './shared';

const DROP_LOOKBACK_MS = 35 * 60_000;

/**
 * Descarta las bajadas que el modelo historico (con backtest fiable) no
 * comparte. Es un filtro opcional: si el modelo falla o no es fiable, manda lo
 * observado. Se pasa `now` para no depender de la cache compartida.
 */
async function confirmWithModel(
  candidates: readonly SocialDroppingStation[],
  now: Date
): Promise<SocialDroppingStation[]> {
  const confirmed: SocialDroppingStation[] = [];

  for (const candidate of candidates) {
    try {
      const response = await getStationPredictions(candidate.stationId, now);
      const point = response?.predictions.find((entry) => entry.horizonMinutes === 30);
      if (modelContradictsDrop(point, isBacktestReliable(point?.backtest), candidate.bikesNow)) {
        continue;
      }
    } catch (error) {
      logger.warn('social.morning_model_unavailable', {
        stationId: candidate.stationId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    confirmed.push(candidate);
  }

  return confirmed;
}

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

  const [profileRows, bikeSamples] = await Promise.all([
    getWeekdayMorningProfiles(),
    getRecentBikeSamples(new Date(now.getTime() - DROP_LOOKBACK_MS)),
  ]);
  const profiles = aggregateStationProfiles(profileRows);

  const selection = selectMorningStations({
    stations,
    profiles,
    limit: 3,
    cohortSize: 40,
  });

  // Lado contrario: estaciones que a esta hora suelen llenarse y estan sin huecos.
  const fullStations = selectEveningStations({
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

  // Bajando deprisa: lecturas reales de la ultima media hora, filtradas por el
  // modelo solo si este es fiable y no las comparte.
  const dropping = await confirmWithModel(
    findDroppingStations({ stations, samples: bikeSamples, now, limit: 3 }),
    now
  );

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
    dropping,
    fullStations,
    network,
    cause: mapServiceCause(getServiceCause(dateKey)),
    dataWindow,
  });
}
