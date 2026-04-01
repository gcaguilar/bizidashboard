import { isRecord, parseJsonValue } from '@/lib/json';

export type StationSnapshotMap = Record<string, number>;

export type RecentStationSnapshot = {
  recordedAt: string;
  snapshot: StationSnapshotMap;
};

type SnapshotSource = {
  id: string;
  bikesAvailable: number;
};

const MAX_RECENT_SNAPSHOTS = 20;

export function trimRecentSnapshots(snapshots: RecentStationSnapshot[]): RecentStationSnapshot[] {
  return snapshots.slice(-MAX_RECENT_SNAPSHOTS);
}

export function buildStationSnapshotMap<T extends SnapshotSource>(
  stations: readonly T[]
): StationSnapshotMap {
  return stations.reduce<StationSnapshotMap>((accumulator, station) => {
    accumulator[station.id] = Number(station.bikesAvailable);
    return accumulator;
  }, {});
}

export function normalizeStationSnapshot(value: unknown): StationSnapshotMap {
  if (!isRecord(value)) {
    return {};
  }

  const snapshot: StationSnapshotMap = {};

  for (const [key, entry] of Object.entries(value)) {
    if (!Number.isFinite(entry)) {
      continue;
    }

    snapshot[key] = Number(entry);
  }

  return snapshot;
}

export function parseStationSnapshot(rawValue: string | null): StationSnapshotMap | null {
  const parsed = parseJsonValue(rawValue);

  if (parsed === null) {
    return null;
  }

  return normalizeStationSnapshot(parsed);
}

export function parseRecentSnapshots(rawValue: string | null): RecentStationSnapshot[] {
  const parsed = parseJsonValue(rawValue);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return trimRecentSnapshots(
    parsed.filter(isRecord).map((item) => ({
      recordedAt:
        typeof item.recordedAt === 'string' ? item.recordedAt : new Date(0).toISOString(),
      snapshot: normalizeStationSnapshot(item.snapshot),
    }))
  );
}

export function pushRecentSnapshot(
  snapshots: RecentStationSnapshot[],
  nextSnapshot: RecentStationSnapshot
): RecentStationSnapshot[] {
  const previous = snapshots[snapshots.length - 1];

  if (previous && previous.recordedAt === nextSnapshot.recordedAt) {
    return trimRecentSnapshots([...snapshots.slice(0, -1), nextSnapshot]);
  }

  return trimRecentSnapshots([...snapshots, nextSnapshot]);
}
