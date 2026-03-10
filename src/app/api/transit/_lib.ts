import type { TransitMode } from '@/analytics/queries/transit-read';

export function parseTransitMode(value: string | null): TransitMode | null {
  if (value === 'bus' || value === 'tram') {
    return value;
  }

  return null;
}

export function parsePositiveInteger(value: string | null, fallback: number): number | null {
  if (value === null) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}
