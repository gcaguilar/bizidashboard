import 'server-only';

import { cache } from 'react';
import type { RankingRow, StationSnapshot } from '@/lib/api';
import { fetchRankings, fetchStations } from '@/lib/api';
import {
  buildStationDistrictMap,
  fetchDistrictCollection,
  type DistrictCollection,
  DISTRICTS_GEOJSON_URL,
  isDistrictCollection,
} from '@/lib/districts';

export type DistrictSeoStation = {
  stationId: string;
  stationName: string;
  bikesAvailable: number;
  anchorsFree: number;
  capacity: number;
  turnoverScore: number;
  availabilityRisk: number;
};

export type DistrictSeoRow = {
  slug: string;
  name: string;
  stationCount: number;
  bikesAvailable: number;
  anchorsFree: number;
  capacity: number;
  avgTurnover: number;
  avgAvailabilityRisk: number;
  topStations: DistrictSeoStation[];
};

export function slugifyDistrictName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildDistrictSeoRows({
  stations,
  districtCollection,
  turnoverRankings,
  availabilityRankings,
}: {
  stations: StationSnapshot[];
  districtCollection: DistrictCollection | null;
  turnoverRankings: RankingRow[];
  availabilityRankings: RankingRow[];
}): DistrictSeoRow[] {
  if (!districtCollection) {
    return [];
  }

  const stationDistrictMap = buildStationDistrictMap(stations, districtCollection);
  const stationTurnoverMap = new Map(
    turnoverRankings.map((row) => [row.stationId, Number(row.turnoverScore)])
  );
  const stationAvailabilityMap = new Map(
    availabilityRankings.map((row) => [row.stationId, Number(row.emptyHours) + Number(row.fullHours)])
  );
  const groupedDistricts = new Map<string, DistrictSeoRow>();

  for (const station of stations) {
    const districtName = stationDistrictMap.get(station.id);

    if (!districtName) {
      continue;
    }

    const districtSlug = slugifyDistrictName(districtName);
    const turnoverScore = stationTurnoverMap.get(station.id) ?? 0;
    const availabilityRisk = stationAvailabilityMap.get(station.id) ?? 0;
    const current = groupedDistricts.get(districtSlug) ?? {
      slug: districtSlug,
      name: districtName,
      stationCount: 0,
      bikesAvailable: 0,
      anchorsFree: 0,
      capacity: 0,
      avgTurnover: 0,
      avgAvailabilityRisk: 0,
      topStations: [],
    };

    current.stationCount += 1;
    current.bikesAvailable += station.bikesAvailable;
    current.anchorsFree += station.anchorsFree;
    current.capacity += station.capacity;
    current.avgTurnover += turnoverScore;
    current.avgAvailabilityRisk += availabilityRisk;
    current.topStations.push({
      stationId: station.id,
      stationName: station.name,
      bikesAvailable: station.bikesAvailable,
      anchorsFree: station.anchorsFree,
      capacity: station.capacity,
      turnoverScore,
      availabilityRisk,
    });

    groupedDistricts.set(districtSlug, current);
  }

  return Array.from(groupedDistricts.values())
    .map((district) => ({
      ...district,
      avgTurnover:
        district.stationCount > 0 ? Number((district.avgTurnover / district.stationCount).toFixed(1)) : 0,
      avgAvailabilityRisk:
        district.stationCount > 0
          ? Number((district.avgAvailabilityRisk / district.stationCount).toFixed(1))
          : 0,
      topStations: district.topStations
        .sort(
          (left, right) =>
            right.turnoverScore - left.turnoverScore || right.bikesAvailable - left.bikesAvailable
        )
        .slice(0, 6),
    }))
    .sort(
      (left, right) =>
        right.avgTurnover - left.avgTurnover ||
        right.stationCount - left.stationCount ||
        left.name.localeCompare(right.name, 'es')
    );
}

export const getDistrictSeoRows = cache(async (): Promise<DistrictSeoRow[]> => {
  const stationsResponse = await fetchStations().catch(() => ({
    stations: [],
    generatedAt: new Date().toISOString(),
  }));
  const stationCount = Math.max(stationsResponse.stations.length, 1);
  const [districtCollection, turnoverResponse, availabilityResponse] = await Promise.all([
    fetchDistrictCollection().catch(() => null),
    fetchRankings('turnover', stationCount).catch(() => ({
      type: 'turnover' as const,
      limit: stationCount,
      rankings: [],
      generatedAt: new Date().toISOString(),
    })),
    fetchRankings('availability', stationCount).catch(() => ({
      type: 'availability' as const,
      limit: stationCount,
      rankings: [],
      generatedAt: new Date().toISOString(),
    })),
  ]);

  return buildDistrictSeoRows({
    stations: stationsResponse.stations,
    districtCollection,
    turnoverRankings: turnoverResponse.rankings,
    availabilityRankings: availabilityResponse.rankings,
  });
});

export const getDistrictSeoRowBySlug = cache(async (slug: string): Promise<DistrictSeoRow | null> => {
  const rows = await getDistrictSeoRows();
  return rows.find((row) => row.slug === slug) ?? null;
});

export const getDistrictSlugsFromGeoJson = cache(async (): Promise<string[]> => {
  if (typeof window !== 'undefined') {
    return [];
  }

  const [{ readFile }, path] = await Promise.all([
    import('node:fs/promises'),
    import('node:path'),
  ]);

  const geoJsonPath = path.join(
    process.cwd(),
    'public',
    DISTRICTS_GEOJSON_URL.replace(/^\/+/, '')
  );

  try {
    const payload = JSON.parse(await readFile(geoJsonPath, 'utf8')) as unknown;

    if (!isDistrictCollection(payload)) {
      return [];
    }

    return payload.features
      .map((feature) => feature.properties?.distrito)
      .filter((name): name is string => typeof name === 'string' && name.length > 0)
      .map((name) => slugifyDistrictName(name));
  } catch {
    return [];
  }
});
