import { stringifySearchWith } from '@tanstack/react-router';

/**
 * Serializador de búsqueda del router.
 *
 * El `stringifySearch` por defecto de TanStack vuelve a pasar por
 * `JSON.stringify` cualquier string que "parezca" JSON (por ejemplo `254`), de
 * modo que `?stationId=254` se reescribía en la barra de direcciones como
 * `stationId=%22254%22`. Sin parser de detección los strings se emiten planos;
 * los objetos y arrays siguen serializándose con JSON.
 */
export const stringifyRouterSearch = stringifySearchWith(JSON.stringify);

export function getLocationSearchParams(location: { searchStr?: string; search?: unknown } | null | undefined): URLSearchParams {
  const raw = location?.searchStr ?? (typeof location?.search === 'string' ? location?.search : '');
  return new URLSearchParams(raw ?? '');
}
