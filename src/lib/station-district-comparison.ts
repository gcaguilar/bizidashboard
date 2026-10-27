import type { RankingRow, StationSnapshot } from '@/lib/api-types';

/** Métricas comparables de una estación; null cuando falta el dato. */
export type StationComparisonMetrics = {
  occupancy: number | null;
  emptyShare: number | null;
  fullShare: number | null;
  movement: number | null;
};

export type ComparisonMetricKey = keyof StationComparisonMetrics;
export type ComparisonVerdict = 'above' | 'similar' | 'below';

export type StationDistrictComparisonRow = {
  key: ComparisonMetricKey;
  stationValue: number;
  districtValue: number;
  verdict: ComparisonVerdict;
};

export type StationDistrictComparison = {
  state: 'ok' | 'empty';
  peerCount: number;
  rows: StationDistrictComparisonRow[];
};

/** Mínimo de estaciones del barrio con dato para considerar fiable la media. */
export const MIN_DISTRICT_PEERS = 2;
const SHARE_TOLERANCE = 0.05;
const MOVEMENT_TOLERANCE = 0.15;

function toFinite(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function share(hours: unknown, totalHours: unknown): number | null {
  const h = toFinite(hours);
  const t = toFinite(totalHours);
  if (h === null || t === null || t <= 0) return null;
  return Math.max(0, Math.min(1, h / t));
}

export function buildStationComparisonMetrics(input: {
  station: Pick<StationSnapshot, 'capacity' | 'bikesAvailable'>;
  turnover: RankingRow | null;
  availability: RankingRow | null;
}): StationComparisonMetrics {
  const { station, turnover, availability } = input;
  return {
    occupancy:
      Number.isFinite(station.capacity) && station.capacity > 0
        ? Math.max(0, Math.min(1, station.bikesAvailable / station.capacity))
        : null,
    emptyShare: share(availability?.emptyHours, availability?.totalHours),
    fullShare: share(availability?.fullHours, availability?.totalHours),
    movement: turnover ? toFinite(turnover.turnoverScore) : null,
  };
}

function getVerdict(key: ComparisonMetricKey, station: number, district: number): ComparisonVerdict {
  const diff = station - district;
  const similar =
    key === 'movement'
      ? Math.abs(diff) <= Math.max(district, 1) * MOVEMENT_TOLERANCE
      : Math.abs(diff) <= SHARE_TOLERANCE;
  if (similar) return 'similar';
  return diff > 0 ? 'above' : 'below';
}

const METRIC_KEYS: ComparisonMetricKey[] = ['occupancy', 'emptyShare', 'fullShare', 'movement'];

export function buildStationDistrictComparison(
  station: StationComparisonMetrics,
  peers: StationComparisonMetrics[]
): StationDistrictComparison {
  const rows: StationDistrictComparisonRow[] = [];
  let peerCount = 0;

  for (const key of METRIC_KEYS) {
    const stationValue = station[key];
    const values = peers.map((peer) => peer[key]).filter((v): v is number => v !== null);
    if (stationValue === null || values.length < MIN_DISTRICT_PEERS) continue;
    const districtValue = values.reduce((sum, v) => sum + v, 0) / values.length;
    peerCount = Math.max(peerCount, values.length);
    rows.push({ key, stationValue, districtValue, verdict: getVerdict(key, stationValue, districtValue) });
  }

  return { state: rows.length > 0 ? 'ok' : 'empty', peerCount, rows };
}
