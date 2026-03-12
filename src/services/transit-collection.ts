import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getWatermark, setWatermark } from '@/analytics/watermarks';
import { withRetry } from '@/lib/retry';
import { getEuropeMadridOffset } from '@/lib/timezone';

const TransitProvider = {
  TRAM: 'TRAM',
  BUS: 'BUS',
} as const;

type TransitProvider = (typeof TransitProvider)[keyof typeof TransitProvider];

type TransitStation = {
  id: string;
  lat: number;
  lon: number;
};

type TransitStopCandidate = {
  externalId: string;
  name: string;
  lat: number;
  lon: number;
};

type TransitSnapshotCandidate = {
  externalId: string;
  observedAt: Date;
  sourceUpdatedAt: Date | null;
  etaMinutes: number | null;
  arrivalPressure: number;
  arrivalEvents: number;
  isStale: boolean;
};

type SnapshotFetchResult = {
  snapshots: TransitSnapshotCandidate[];
  warnings: string[];
};

type TransitProviderAdapter = {
  provider: TransitProvider;
  fetchStops: () => Promise<TransitStopCandidate[]>;
  fetchSnapshots: (externalIds: string[]) => Promise<SnapshotFetchResult>;
};

type StationLinkCandidate = {
  stationId: string;
  provider: TransitProvider;
  transitStopId: string;
  externalId: string;
  distanceMeters: number;
};

export type TransitProviderCollectionResult = {
  provider: TransitProvider;
  linksRefreshed: boolean;
  stopsDiscovered: number;
  linkedStations: number;
  uniqueLinkedStops: number;
  snapshotsStored: number;
  snapshotsDeduplicated: number;
  staleSnapshots: number;
  warnings: string[];
};

export type TransitCollectionSummary = {
  providers: TransitProviderCollectionResult[];
  warnings: string[];
};

const TRANSIT_REQUEST_TIMEOUT_MS = Number(process.env.TRANSIT_REQUEST_TIMEOUT_MS ?? 12000);
const TRANSIT_MAX_RETRIES = Number(process.env.TRANSIT_MAX_RETRIES ?? 2);
const TRANSIT_RETRY_BASE_DELAY_MS = Number(process.env.TRANSIT_RETRY_BASE_DELAY_MS ?? 500);
const TRANSIT_MAX_LINK_DISTANCE_METERS = Number(
  process.env.TRANSIT_MAX_LINK_DISTANCE_METERS ?? 200
);
const TRANSIT_EVENT_WINDOW_MINUTES = Number(process.env.TRANSIT_EVENT_WINDOW_MINUTES ?? 12);
const TRANSIT_SNAPSHOT_STALE_MINUTES = Number(process.env.TRANSIT_SNAPSHOT_STALE_MINUTES ?? 45);
const BUS_REALTIME_MAX_CONCURRENCY = Number(process.env.BUS_REALTIME_MAX_CONCURRENCY ?? 8);
const BUS_STOPS_CACHE_TTL_MS = Number(process.env.BUS_STOPS_CACHE_TTL_MS ?? 6 * 60 * 60 * 1000);
const TRANSIT_LINK_REFRESH_MINUTES = Number(process.env.TRANSIT_LINK_REFRESH_MINUTES ?? 360);
const TRANSIT_LINK_REFRESH_MS = Math.max(1, TRANSIT_LINK_REFRESH_MINUTES) * 60_000;

const TRAM_STOPS_URL =
  process.env.TRAM_STOPS_URL ??
  'https://www.zaragoza.es/sede/servicio/urbanismo-infraestructuras/transporte-urbano/parada-tranvia.json';
const BUS_STOPS_URL =
  process.env.BUS_STOPS_URL ??
  'https://www.zaragoza.es/api/recurso/urbanismo-infraestructuras/transporte-urbano/poste.json?srsname=wgs84';
const BUS_REALTIME_BASE_URL =
  process.env.BUS_REALTIME_BASE_URL ??
  'https://www.zaragoza.es/sede/servicio/urbanismo-infraestructuras/transporte-urbano/poste-autobus';

const REQUEST_HEADERS: HeadersInit = {
  Accept: 'application/json',
  'User-Agent': 'BiziDashboard/1.0',
};

let cachedTramRows: unknown[] | null = null;
let cachedBusStops: { fetchedAtMs: number; stops: TransitStopCandidate[] } | null = null;

function toTransitStopId(provider: TransitProvider, externalId: string): string {
  return `${provider}:${externalId}`;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function toCoordinatePair(value: unknown): [number, number] | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const coordinates = (value as { coordinates?: unknown }).coordinates;

  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }

  const lon = coordinates[0];
  const lat = coordinates[1];

  if (!isFiniteNumber(lon) || !isFiniteNumber(lat)) {
    return null;
  }

  return [lat, lon];
}

function toStringId(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function toName(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
}

function parseMinutes(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = Math.max(0, Math.round(value));
    return parsed;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const match = normalized.match(/\d+/);
  if (match) {
    const parsed = Number.parseInt(match[0], 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
  }

  if (
    normalized.includes('aproxim') ||
    normalized.includes('lleg') ||
    normalized.includes('en parada')
  ) {
    return 0;
  }

  return null;
}

function parseSourceUpdatedAt(value: unknown): Date | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const hasExplicitTimezone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(trimmed);

  if (hasExplicitTimezone) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const localLikeTimestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(trimmed);

  if (localLikeTimestamp) {
    const normalized = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
    const asUtc = new Date(`${normalized}Z`);

    if (Number.isNaN(asUtc.getTime())) {
      return null;
    }

    const madridOffsetMinutes = getEuropeMadridOffset(asUtc);

    if (!Number.isFinite(madridOffsetMinutes)) {
      return asUtc;
    }

    return new Date(asUtc.getTime() - madridOffsetMinutes * 60_000);
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function computeArrivalPressure(etaMinutes: number | null): number {
  if (etaMinutes === null || !Number.isFinite(etaMinutes)) {
    return 0;
  }

  const boundedEta = Math.min(60, Math.max(0, etaMinutes));
  return 1 / (boundedEta + 1);
}

function computeArrivalEvents(etaMinutes: number | null): number {
  if (etaMinutes === null) {
    return 0;
  }

  return etaMinutes <= TRANSIT_EVENT_WINDOW_MINUTES ? 1 : 0;
}

function isSnapshotStale(sourceUpdatedAt: Date | null, observedAt: Date): boolean {
  if (!sourceUpdatedAt) {
    return false;
  }

  const ageMs = observedAt.getTime() - sourceUpdatedAt.getTime();
  return ageMs > TRANSIT_SNAPSHOT_STALE_MINUTES * 60_000;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineDistanceMeters(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const earthRadiusMeters = 6_371_000;
  const dLat = toRadians(bLat - aLat);
  const dLon = toRadians(bLon - aLon);
  const lat1 = toRadians(aLat);
  const lat2 = toRadians(bLat);

  const haversineA =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  const haversineC = 2 * Math.atan2(Math.sqrt(haversineA), Math.sqrt(1 - haversineA));
  return earthRadiusMeters * haversineC;
}

async function fetchJsonWithRetry(url: string): Promise<unknown> {
  try {
    return await withRetry(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TRANSIT_REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          headers: REQUEST_HEADERS,
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status >= 500 || response.status === 429) {
            throw response;
          }

          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        return (await response.json()) as unknown;
      } finally {
        clearTimeout(timeout);
      }
    }, {
      maxRetries: Math.max(0, Math.floor(TRANSIT_MAX_RETRIES)),
      baseDelay: Math.max(100, Math.floor(TRANSIT_RETRY_BASE_DELAY_MS)),
    });
  } catch (error) {
    if (error instanceof Response) {
      throw new Error(`HTTP ${error.status} ${error.statusText}`);
    }

    throw error;
  }
}

function pickNearestStops(
  provider: TransitProvider,
  stations: TransitStation[],
  stops: TransitStopCandidate[]
): StationLinkCandidate[] {
  if (stations.length === 0 || stops.length === 0) {
    return [];
  }

  const links: StationLinkCandidate[] = [];

  for (const station of stations) {
    let nearestStop: TransitStopCandidate | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const stop of stops) {
      const distanceMeters = haversineDistanceMeters(station.lat, station.lon, stop.lat, stop.lon);

      if (distanceMeters < nearestDistance) {
        nearestDistance = distanceMeters;
        nearestStop = stop;
      }
    }

    if (!nearestStop || nearestDistance > TRANSIT_MAX_LINK_DISTANCE_METERS) {
      continue;
    }

    links.push({
      stationId: station.id,
      provider,
      transitStopId: toTransitStopId(provider, nearestStop.externalId),
      externalId: nearestStop.externalId,
      distanceMeters: nearestDistance,
    });
  }

  return links;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const safeConcurrency = Math.max(1, Math.floor(concurrency));
  const results: R[] = [];
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      const item = items[currentIndex] as T;
      const result = await mapper(item);
      results[currentIndex] = result;
    }
  }

  await Promise.all(Array.from({ length: Math.min(safeConcurrency, items.length) }, () => worker()));
  return results;
}

function getResultRows(payload: unknown): unknown[] {
  const maybeResult = (payload as { result?: unknown }).result;
  return Array.isArray(maybeResult) ? maybeResult : [];
}

function getLinkSyncWatermarkName(provider: TransitProvider): string {
  return `transit-link-sync-${provider.toLowerCase()}`;
}

type ExistingProviderLink = {
  stationId: string;
  provider: TransitProvider;
  transitStopId: string;
  distanceMeters: number;
  transitStop: {
    id: string;
    externalId: string;
    name: string;
    lat: number;
    lon: number;
  };
};

async function getExistingProviderLinks(
  provider: TransitProvider,
  stationIds: string[]
): Promise<ExistingProviderLink[]> {
  if (stationIds.length === 0) {
    return [];
  }

  return prisma.stationTransitLink.findMany({
    where: {
      provider,
      stationId: { in: stationIds },
    },
    include: {
      transitStop: {
        select: {
          id: true,
          externalId: true,
          name: true,
          lat: true,
          lon: true,
        },
      },
    },
  });
}

type LatestSnapshotRow = {
  transitStopId: string;
  sourceUpdatedAt: Date | null;
  etaMinutes: number | null;
  arrivalPressure: number;
  arrivalEvents: number;
  isStale: number;
};

function areDateValuesEqual(a: Date | null, b: Date | null): boolean {
  if (a === null && b === null) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  return a.getTime() === b.getTime();
}

function isDuplicateSnapshot(
  snapshot: TransitSnapshotCandidate,
  latest: LatestSnapshotRow | undefined
): boolean {
  if (!latest) {
    return false;
  }

  return (
    areDateValuesEqual(snapshot.sourceUpdatedAt, latest.sourceUpdatedAt) &&
    snapshot.etaMinutes === latest.etaMinutes &&
    snapshot.arrivalEvents === latest.arrivalEvents &&
    snapshot.isStale === Boolean(latest.isStale) &&
    Math.abs(snapshot.arrivalPressure - latest.arrivalPressure) < 0.000001
  );
}

async function getLatestSnapshotsByTransitStop(
  provider: TransitProvider,
  transitStopIds: string[]
): Promise<Map<string, LatestSnapshotRow>> {
  if (transitStopIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.$queryRaw<LatestSnapshotRow[]>`
    WITH latest AS (
      SELECT
        transitStopId,
        MAX(observedAt) AS observedAt
      FROM TransitSnapshot
      WHERE provider = ${provider}
        AND transitStopId IN (${Prisma.join(transitStopIds)})
      GROUP BY transitStopId
    )
    SELECT
      ts.transitStopId AS transitStopId,
      ts.sourceUpdatedAt AS sourceUpdatedAt,
      ts.etaMinutes AS etaMinutes,
      ts.arrivalPressure AS arrivalPressure,
      ts.arrivalEvents AS arrivalEvents,
      CASE WHEN ts.isStale THEN 1 ELSE 0 END AS isStale
    FROM TransitSnapshot ts
    INNER JOIN latest
      ON latest.transitStopId = ts.transitStopId
      AND latest.observedAt = ts.observedAt
    WHERE ts.provider = ${provider};
  `;

  return new Map(rows.map((row: any) => [row.transitStopId, row] as const));
}

const tramProvider: TransitProviderAdapter = {
  provider: TransitProvider.TRAM,
  fetchStops: async () => {
    const payload = await fetchJsonWithRetry(TRAM_STOPS_URL);
    const rows = getResultRows(payload);
    cachedTramRows = rows;

    const stops: TransitStopCandidate[] = [];

    for (const row of rows) {
      const externalId = toStringId((row as { id?: unknown }).id);
      if (!externalId) {
        continue;
      }

      const coordinates = toCoordinatePair((row as { geometry?: unknown }).geometry);
      if (!coordinates) {
        continue;
      }

      const [lat, lon] = coordinates;
      const fallbackName = `Tranvia ${externalId}`;
      const name = toName((row as { title?: unknown }).title, fallbackName);

      stops.push({
        externalId,
        name,
        lat,
        lon,
      });
    }

    return stops;
  },
  fetchSnapshots: async (externalIds: string[]) => {
    if (externalIds.length === 0) {
      return { snapshots: [], warnings: [] };
    }

    const rows = cachedTramRows ?? getResultRows(await fetchJsonWithRetry(TRAM_STOPS_URL));
    cachedTramRows = null;

    const allowedIds = new Set(externalIds);
    const observedAt = new Date();
    const snapshots: TransitSnapshotCandidate[] = [];

    for (const row of rows) {
      const externalId = toStringId((row as { id?: unknown }).id);
      if (!externalId || !allowedIds.has(externalId)) {
        continue;
      }

      const destinos = Array.isArray((row as { destinos?: unknown }).destinos)
        ? ((row as { destinos: unknown[] }).destinos)
        : [];
      const etaCandidates = destinos
        .map((destination) => parseMinutes((destination as { minutos?: unknown }).minutos))
        .filter((value): value is number => value !== null);
      const etaMinutes = etaCandidates.length > 0 ? Math.min(...etaCandidates) : null;

      const sourceUpdatedAt = parseSourceUpdatedAt((row as { lastUpdated?: unknown }).lastUpdated);
      const staleByAge = isSnapshotStale(sourceUpdatedAt, observedAt);
      const isStale = staleByAge || etaMinutes === null;

      snapshots.push({
        externalId,
        observedAt,
        sourceUpdatedAt,
        etaMinutes,
        arrivalPressure: computeArrivalPressure(etaMinutes),
        arrivalEvents: computeArrivalEvents(etaMinutes),
        isStale,
      });
    }

    return {
      snapshots,
      warnings: [],
    };
  },
};

const busProvider: TransitProviderAdapter = {
  provider: TransitProvider.BUS,
  fetchStops: async () => {
    const now = Date.now();

    if (
      cachedBusStops &&
      now - cachedBusStops.fetchedAtMs < BUS_STOPS_CACHE_TTL_MS &&
      cachedBusStops.stops.length > 0
    ) {
      return cachedBusStops.stops;
    }

    const payload = await fetchJsonWithRetry(BUS_STOPS_URL);
    const rows = getResultRows(payload);
    const stops: TransitStopCandidate[] = [];

    for (const row of rows) {
      const externalId = toStringId((row as { id?: unknown }).id);
      if (!externalId) {
        continue;
      }

      const coordinates = toCoordinatePair((row as { geometry?: unknown }).geometry);
      if (!coordinates) {
        continue;
      }

      const [lat, lon] = coordinates;
      const fallbackName = `Bus ${externalId}`;
      const name = toName((row as { title?: unknown }).title, fallbackName);

      stops.push({
        externalId,
        name,
        lat,
        lon,
      });
    }

    cachedBusStops = {
      fetchedAtMs: now,
      stops,
    };

    return stops;
  },
  fetchSnapshots: async (externalIds: string[]) => {
    const uniqueIds = Array.from(new Set(externalIds.filter((id) => Boolean(id))));

    if (uniqueIds.length === 0) {
      return { snapshots: [], warnings: [] };
    }

    const warnings: string[] = [];
    const rows = await mapWithConcurrency(uniqueIds, BUS_REALTIME_MAX_CONCURRENCY, async (externalId) => {
      try {
        const payload = await fetchJsonWithRetry(
          `${BUS_REALTIME_BASE_URL}/${encodeURIComponent(externalId)}`
        );

        return { externalId, payload } as const;
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        warnings.push(`bus stop ${externalId}: ${reason}`);
        return { externalId, payload: null } as const;
      }
    });

    const observedAt = new Date();
    const snapshots: TransitSnapshotCandidate[] = [];

    for (const row of rows) {
      if (!row.payload || typeof row.payload !== 'object') {
        continue;
      }

      const payload = row.payload as {
        lastUpdated?: unknown;
        destinos?: unknown;
      };
      const destinos = Array.isArray(payload.destinos) ? payload.destinos : [];
      const etaCandidates: number[] = [];

      for (const destination of destinos) {
        const typedDestination = destination as {
          minutos?: unknown;
          primero?: unknown;
          segundo?: unknown;
        };

        const minuteValues = [
          parseMinutes(typedDestination.minutos),
          parseMinutes(typedDestination.primero),
          parseMinutes(typedDestination.segundo),
        ];

        for (const minute of minuteValues) {
          if (minute !== null) {
            etaCandidates.push(minute);
          }
        }
      }

      const etaMinutes = etaCandidates.length > 0 ? Math.min(...etaCandidates) : null;
      const sourceUpdatedAt = parseSourceUpdatedAt(payload.lastUpdated);
      const staleByAge = isSnapshotStale(sourceUpdatedAt, observedAt);
      const isStale = staleByAge || etaMinutes === null;

      snapshots.push({
        externalId: row.externalId,
        observedAt,
        sourceUpdatedAt,
        etaMinutes,
        arrivalPressure: computeArrivalPressure(etaMinutes),
        arrivalEvents: computeArrivalEvents(etaMinutes),
        isStale,
      });
    }

    return {
      snapshots,
      warnings,
    };
  },
};

const PROVIDERS: TransitProviderAdapter[] = [tramProvider, busProvider];

async function syncProvider(
  adapter: TransitProviderAdapter,
  stations: TransitStation[]
): Promise<TransitProviderCollectionResult> {
  const provider = adapter.provider;
  const warnings: string[] = [];

  const stationIds = stations.map((station) => station.id);
  const existingLinks = await getExistingProviderLinks(provider, stationIds);
  const lastLinkSync = await getWatermark(getLinkSyncWatermarkName(provider), new Date(0));
  const now = new Date();

  let linksRefreshed = false;
  let stopsDiscovered = 0;
  let links: StationLinkCandidate[] = [];
  const linkedStopsByExternalId = new Map<string, TransitStopCandidate>();

  const shouldRefreshLinks =
    existingLinks.length === 0 || now.getTime() - lastLinkSync.getTime() >= TRANSIT_LINK_REFRESH_MS;

  if (shouldRefreshLinks) {
    const allStops = await adapter.fetchStops();
    stopsDiscovered = allStops.length;

    const stopByExternalId = new Map(
      allStops.map((stop) => [stop.externalId, stop] as const)
    );
    links = pickNearestStops(provider, stations, allStops);

    for (const link of links) {
      const stop = stopByExternalId.get(link.externalId);
      if (stop) {
        linkedStopsByExternalId.set(link.externalId, stop);
      }
    }

    const linkedStops = Array.from(linkedStopsByExternalId.values());

    await prisma.$transaction(async (tx: any) => {
      await tx.transitStop.updateMany({
        where: { provider },
        data: { isActive: false },
      });

      for (const stop of linkedStops) {
        await tx.transitStop.upsert({
          where: {
            id: toTransitStopId(provider, stop.externalId),
          },
          create: {
            id: toTransitStopId(provider, stop.externalId),
            provider,
            externalId: stop.externalId,
            name: stop.name,
            lat: stop.lat,
            lon: stop.lon,
            isActive: true,
          },
          update: {
            name: stop.name,
            lat: stop.lat,
            lon: stop.lon,
            isActive: true,
          },
        });
      }

      await tx.stationTransitLink.deleteMany({
        where: { provider },
      });

      if (links.length > 0) {
        await tx.stationTransitLink.createMany({
          data: links.map((link) => ({
            stationId: link.stationId,
            provider: link.provider,
            transitStopId: link.transitStopId,
            distanceMeters: link.distanceMeters,
            createdAt: now,
            updatedAt: now,
          })),
        });
      }
    });

    await setWatermark(getLinkSyncWatermarkName(provider), now);
    linksRefreshed = true;
  } else {
    for (const link of existingLinks) {
      links.push({
        stationId: link.stationId,
        provider,
        transitStopId: link.transitStopId,
        externalId: link.transitStop.externalId,
        distanceMeters: link.distanceMeters,
      });

      linkedStopsByExternalId.set(link.transitStop.externalId, {
        externalId: link.transitStop.externalId,
        name: link.transitStop.name,
        lat: link.transitStop.lat,
        lon: link.transitStop.lon,
      });
    }

    stopsDiscovered = await prisma.transitStop.count({
      where: {
        provider,
        isActive: true,
      },
    });
  }

  const linkedStops = Array.from(linkedStopsByExternalId.values());
  const linkedStopIds = linkedStops.map((stop) => toTransitStopId(provider, stop.externalId));

  const snapshotFetch = await adapter.fetchSnapshots(Array.from(linkedStopsByExternalId.keys()));
  warnings.push(...snapshotFetch.warnings);

  const snapshotRows = snapshotFetch.snapshots.filter((snapshot) =>
    linkedStopsByExternalId.has(snapshot.externalId)
  );

  let snapshotsStored = 0;
  let snapshotsDeduplicated = 0;

  if (snapshotRows.length > 0) {
    const latestByStop = await getLatestSnapshotsByTransitStop(provider, linkedStopIds);
    const rowsToInsert = snapshotRows.filter((snapshot) => {
      const transitStopId = toTransitStopId(provider, snapshot.externalId);
      const latest = latestByStop.get(transitStopId);
      return !isDuplicateSnapshot(snapshot, latest);
    });

    snapshotsDeduplicated = snapshotRows.length - rowsToInsert.length;

    if (rowsToInsert.length > 0) {
      await prisma.transitSnapshot.createMany({
        data: rowsToInsert.map((snapshot) => ({
          provider,
          transitStopId: toTransitStopId(provider, snapshot.externalId),
          observedAt: snapshot.observedAt,
          sourceUpdatedAt: snapshot.sourceUpdatedAt,
          etaMinutes: snapshot.etaMinutes,
          arrivalPressure: snapshot.arrivalPressure,
          arrivalEvents: snapshot.arrivalEvents,
          isStale: snapshot.isStale,
        })),
      });

      snapshotsStored = rowsToInsert.length;
    }
  }

  if (linkedStops.length === 0) {
    warnings.push(`no station links found within ${TRANSIT_MAX_LINK_DISTANCE_METERS}m`);
  }

  if (linkedStopIds.length > 0 && snapshotsStored === 0) {
    if (snapshotsDeduplicated > 0) {
      warnings.push(`no new snapshots stored (${snapshotsDeduplicated} unchanged)`);
    } else {
      warnings.push('no realtime snapshots stored');
    }
  }

  return {
    provider,
    linksRefreshed,
    stopsDiscovered,
    linkedStations: links.length,
    uniqueLinkedStops: linkedStops.length,
    snapshotsStored,
    snapshotsDeduplicated,
    staleSnapshots: snapshotRows.filter((snapshot) => snapshot.isStale).length,
    warnings,
  };
}

export async function runTransitCollection(stations: TransitStation[]): Promise<TransitCollectionSummary> {
  const cleanStations = stations.filter(
    (station) =>
      Boolean(station.id) &&
      isFiniteNumber(station.lat) &&
      isFiniteNumber(station.lon)
  );

  if (cleanStations.length === 0) {
    return {
      providers: [],
      warnings: ['No valid stations available for transit linking'],
    };
  }

  const providerResults = await Promise.all(
    PROVIDERS.map(async (provider) => {
      try {
        return await syncProvider(provider, cleanStations);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);

        return {
          provider: provider.provider,
          linksRefreshed: false,
          stopsDiscovered: 0,
          linkedStations: 0,
          uniqueLinkedStops: 0,
          snapshotsStored: 0,
          snapshotsDeduplicated: 0,
          staleSnapshots: 0,
          warnings: [reason],
        } satisfies TransitProviderCollectionResult;
      }
    })
  );

  const warnings = providerResults.flatMap((result) =>
    result.warnings.map((warning) => `${result.provider.toLowerCase()}: ${warning}`)
  );

  return {
    providers: providerResults,
    warnings,
  };
}
