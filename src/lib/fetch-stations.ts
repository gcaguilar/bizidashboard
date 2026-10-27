import type { StationSnapshot } from '@/lib/api-types';
import { appRoutes } from '@/lib/routes';

/**
 * Cliente de `/api/stations` compartido por la portada, el buscador, el
 * planificador y el CTA de bicis cercanas. Cachea la respuesta en memoria 30 s
 * y comparte la petición en vuelo para respetar el rate limit público (40/min).
 */
export const STATIONS_CLIENT_TTL_MS = 30_000;

export type StationsSnapshot = {
  stations: StationSnapshot[];
  /** ISO de generación de la respuesta, si el servidor la envía. */
  generatedAt: string | null;
};

let cache: { snapshot: StationsSnapshot; expiresAt: number } | null = null;
let inFlight: Promise<StationsSnapshot> | null = null;

function rejectIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
}

export async function fetchStationsSnapshot(
  options: { signal?: AbortSignal } = {}
): Promise<StationsSnapshot> {
  const { signal } = options;
  rejectIfAborted(signal);

  if (cache && cache.expiresAt > Date.now()) {
    return cache.snapshot;
  }

  // La petición compartida no lleva la señal de un solo consumidor: si este
  // aborta, los demás siguen esperando el mismo resultado.
  if (!inFlight) {
    inFlight = fetch(appRoutes.api.stations())
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const snapshot: StationsSnapshot = {
          stations: Array.isArray(data?.stations) ? data.stations : [],
          generatedAt: typeof data?.generatedAt === 'string' ? data.generatedAt : null,
        };
        cache = { snapshot, expiresAt: Date.now() + STATIONS_CLIENT_TTL_MS };
        return snapshot;
      })
      .finally(() => {
        inFlight = null;
      });
  }

  const snapshot = await inFlight;
  rejectIfAborted(signal);
  return snapshot;
}

export async function fetchStations(options: { signal?: AbortSignal } = {}): Promise<StationSnapshot[]> {
  return (await fetchStationsSnapshot(options)).stations;
}

/** Solo para tests. */
export function resetStationsCache(): void {
  cache = null;
  inFlight = null;
}
