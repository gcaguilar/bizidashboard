export type StationSnapshotMap = Record<string, number>;

export type RecentStationSnapshot = {
  recordedAt: string;
  snapshot: StationSnapshotMap;
};

const MAX_RECENT_SNAPSHOTS = 20;

export function trimRecentSnapshots(snapshots: RecentStationSnapshot[]): RecentStationSnapshot[] {
  return snapshots.slice(-MAX_RECENT_SNAPSHOTS);
}

export function parseRecentSnapshots(rawValue: string | null): RecentStationSnapshot[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return trimRecentSnapshots(
      parsed
        .filter((item): item is { recordedAt?: unknown; snapshot?: unknown } => Boolean(item && typeof item === 'object'))
        .map((item) => ({
          recordedAt: typeof item.recordedAt === 'string' ? item.recordedAt : new Date(0).toISOString(),
          snapshot: normalizeSnapshot(item.snapshot),
        }))
    );
  } catch {
    return [];
  }
}

function normalizeSnapshot(value: unknown): StationSnapshotMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const snapshot: StationSnapshotMap = {};

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!Number.isFinite(entry)) {
      continue;
    }

    snapshot[key] = Number(entry);
  }

  return snapshot;
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
