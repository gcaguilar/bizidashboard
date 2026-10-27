import { appRoutes } from '@/lib/routes';

export type SocialImageKind =
  | 'home'
  | 'landing'
  | 'report'
  | 'station'
  | 'district'
  | 'api';

type BuildSocialImagePathOptions = {
  kind: SocialImageKind;
  /** Requerido para `kind: 'station'`; el resto de tipos usan la tarjeta de la red. */
  stationId?: string;
};

/**
 * Ruta de la imagen social (Open Graph) de una página. Las fichas de estación
 * usan `/api/og/station`; cualquier otra página comparte la tarjeta de red
 * `/api/og/network`, que refleja el estado actual de las estaciones.
 */
export function buildSocialImagePath({ kind, stationId }: BuildSocialImagePathOptions): string {
  if (kind === 'station' && stationId) {
    return appRoutes.api.ogStation(stationId);
  }

  return appRoutes.api.ogNetwork();
}
