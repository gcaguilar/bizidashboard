import { useEffect, useRef, useState } from 'react';
import type { StationsResponse } from '@/lib/api-types';
import {
  buildStationSnapshotMap,
  parseRecentSnapshots,
  parseStationSnapshot,
  pushRecentSnapshot,
  type RecentStationSnapshot,
  type StationSnapshotMap,
} from '@/lib/recent-station-history';
import { writeJsonStorageItem } from './client-storage';

const TREND_SNAPSHOT_STORAGE_KEY = 'bizidashboard-session-station-snapshot';
const RECENT_SNAPSHOTS_STORAGE_KEY = 'bizidashboard-session-recent-station-snapshots';

export type StationTrend = 'up' | 'down' | 'flat';

export function computeStationTrends(
  previousSnapshot: StationSnapshotMap,
  currentStations: StationsResponse['stations']
): Record<string, StationTrend> {
  const trends: Record<string, StationTrend> = {};

  for (const station of currentStations) {
    const previousBikes = previousSnapshot[station.id];

    if (!Number.isFinite(previousBikes)) {
      trends[station.id] = 'flat';
      continue;
    }

    if (station.bikesAvailable > previousBikes) {
      trends[station.id] = 'up';
    } else if (station.bikesAvailable < previousBikes) {
      trends[station.id] = 'down';
    } else {
      trends[station.id] = 'flat';
    }
  }

  return trends;
}

/**
 * Registra cada snapshot de estaciones en sessionStorage y deriva la tendencia
 * (sube/baja/estable) de cada estación respecto al snapshot anterior de la sesión.
 */
export function useStationTrends(stations: StationsResponse) {
  const [stationTrendById, setStationTrendById] = useState<Record<string, StationTrend>>({});
  const [recentSnapshots, setRecentSnapshots] = useState<RecentStationSnapshot[]>([]);
  const previousStationsRef = useRef<StationsResponse['stations'] | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const currentSnapshot = buildStationSnapshotMap(stations.stations);
    const storedSnapshot = parseStationSnapshot(
      window.sessionStorage.getItem(TREND_SNAPSHOT_STORAGE_KEY)
    );
    const fallbackSnapshot = previousStationsRef.current
      ? buildStationSnapshotMap(previousStationsRef.current)
      : null;
    const trendSource = storedSnapshot ?? fallbackSnapshot;

    if (trendSource) {
      setStationTrendById(computeStationTrends(trendSource, stations.stations));
    }

    const nextRecentSnapshots = pushRecentSnapshot(
      parseRecentSnapshots(window.sessionStorage.getItem(RECENT_SNAPSHOTS_STORAGE_KEY)),
      {
        recordedAt: stations.generatedAt,
        snapshot: currentSnapshot,
      }
    );

    setRecentSnapshots(nextRecentSnapshots);
    writeJsonStorageItem(window.sessionStorage, TREND_SNAPSHOT_STORAGE_KEY, currentSnapshot);
    writeJsonStorageItem(window.sessionStorage, RECENT_SNAPSHOTS_STORAGE_KEY, nextRecentSnapshots);
    previousStationsRef.current = stations.stations;
  }, [stations]);

  return { stationTrendById, recentSnapshots };
}
