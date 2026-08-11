import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AlertsResponse,
  RankingsResponse,
  SharedDatasetSnapshot,
  StationsResponse,
  StatusResponse,
} from '@/lib/api-types';
import { appRoutes } from '@/lib/routes';
import { captureExceptionWithContext } from '@/lib/sentry-reporting';
import type { DashboardInitialData } from './DashboardClient';

export const REFRESH_AFTER_LAST_DATA_MS = 5 * 60_000; // 5 minutes
const MIN_REFRESH_FALLBACK_MS = 30_000;
const MIN_REFETCH_DELAY_MS = 1_000;

const DASHBOARD_LIVE_QUERY_KEY = ['dashboard', 'live'] as const;

export type DashboardLiveData = {
  stations: StationsResponse;
  status: StatusResponse;
  alerts: AlertsResponse;
  rankings: {
    turnover: RankingsResponse;
    availability: RankingsResponse;
  };
  /** Momento absoluto del próximo refresco, alineado a la cadencia de datos y a Retry-After. */
  nextRefreshAtMs: number;
};

type RefreshPayload<T> =
  | { ok: true; data: T }
  | { ok: false; retryAfterSeconds?: number };

async function fetchJson<T>(url: string): Promise<RefreshPayload<T>> {
  try {
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      const retryAfter = response.headers.get('Retry-After');
      throw new Error(`HTTP ${response.status}`, {
        cause: retryAfter ? { retryAfterSeconds: parseInt(retryAfter, 10) } : undefined,
      });
    }

    return {
      ok: true,
      data: (await response.json()) as T,
    };
  } catch (error) {
    captureExceptionWithContext(error, {
      area: 'dashboard.client',
      operation: 'useDashboardLiveData.fetchJson',
      extra: { url },
    });
    const retryAfterSeconds = (error as Error & { cause?: { retryAfterSeconds?: number } }).cause
      ?.retryAfterSeconds;
    return { ok: false, retryAfterSeconds };
  }
}

function toTimestamp(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function resolveLatestDataUpdatedAt(
  dataset: SharedDatasetSnapshot,
  stations: StationsResponse,
  status: StatusResponse
): number {
  const stationRecordings = stations.stations
    .map((station) => toTimestamp(station.recordedAt))
    .filter((value): value is number => value !== null);

  const candidates = [
    toTimestamp(dataset.lastUpdated.lastSampleAt),
    toTimestamp(dataset.coverage.generatedAt),
    ...stationRecordings,
    toTimestamp(status.pipeline.lastSuccessfulPoll),
    toTimestamp(stations.generatedAt),
    toTimestamp(status.timestamp),
  ].filter((value): value is number => value !== null);

  if (candidates.length === 0) {
    return Date.now();
  }

  return Math.max(...candidates);
}

function resolveNextRefreshAtMs(
  dataset: SharedDatasetSnapshot,
  stations: StationsResponse,
  status: StatusResponse,
  now: number
): number {
  if (stations.stations.length === 0) {
    return now + MIN_REFRESH_FALLBACK_MS;
  }

  const latestUpdate = resolveLatestDataUpdatedAt(dataset, stations, status);
  return Math.max(latestUpdate + REFRESH_AFTER_LAST_DATA_MS, now + MIN_REFRESH_FALLBACK_MS);
}

export function useDashboardLiveData(initialData: DashboardInitialData) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: DASHBOARD_LIVE_QUERY_KEY,
    queryFn: async (): Promise<DashboardLiveData> => {
      const previous =
        queryClient.getQueryData<DashboardLiveData>(DASHBOARD_LIVE_QUERY_KEY) ?? {
          stations: initialData.stations,
          status: initialData.status,
          alerts: initialData.alerts,
          rankings: initialData.rankings,
          nextRefreshAtMs: Date.now() + MIN_REFRESH_FALLBACK_MS,
        };

      const rankingLimit = Math.max(50, Math.min(200, previous.stations.stations.length || 50));

      const [stationsResult, alertsResult, turnoverResult, availabilityResult, statusResult] =
        await Promise.all([
          fetchJson<StationsResponse>(appRoutes.api.stations()),
          fetchJson<AlertsResponse>(appRoutes.api.alerts({ limit: 20 })),
          fetchJson<RankingsResponse>(appRoutes.api.rankings({ type: 'turnover', limit: rankingLimit })),
          fetchJson<RankingsResponse>(appRoutes.api.rankings({ type: 'availability', limit: rankingLimit })),
          fetchJson<StatusResponse>(appRoutes.api.status()),
        ]);

      const results = [stationsResult, alertsResult, turnoverResult, availabilityResult, statusResult];

      const stations = stationsResult.ok ? stationsResult.data : previous.stations;
      const status = statusResult.ok ? statusResult.data : previous.status;
      const alerts = alertsResult.ok ? alertsResult.data : previous.alerts;
      const rankings =
        turnoverResult.ok && availabilityResult.ok
          ? { turnover: turnoverResult.data, availability: availabilityResult.data }
          : previous.rankings;

      const now = Date.now();
      let nextRefreshAtMs = resolveNextRefreshAtMs(initialData.dataset, stations, status, now);

      const rateLimitSeconds = results
        .map((result) => (!result.ok ? result.retryAfterSeconds ?? 0 : 0))
        .reduce((max, value) => Math.max(max, value), 0);
      const allFailed = results.every((result) => !result.ok);

      if (rateLimitSeconds > 0) {
        nextRefreshAtMs = Math.max(nextRefreshAtMs, now + rateLimitSeconds * 1000);
      } else if (allFailed) {
        nextRefreshAtMs = Math.max(nextRefreshAtMs, now + Math.max(60_000, REFRESH_AFTER_LAST_DATA_MS));
      }

      return { stations, status, alerts, rankings, nextRefreshAtMs };
    },
    initialData: () => ({
      stations: initialData.stations,
      status: initialData.status,
      alerts: initialData.alerts,
      rankings: initialData.rankings,
      nextRefreshAtMs: resolveNextRefreshAtMs(
        initialData.dataset,
        initialData.stations,
        initialData.status,
        Date.now()
      ),
    }),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    // El sondeo original con setTimeout seguía activo en pestañas en segundo plano.
    refetchIntervalInBackground: true,
    refetchInterval: (activeQuery) => {
      const nextAt = activeQuery.state.data?.nextRefreshAtMs ?? Date.now() + MIN_REFRESH_FALLBACK_MS;
      return Math.max(MIN_REFETCH_DELAY_MS, nextAt - Date.now());
    },
  });

  return {
    data: query.data,
    isRefreshing: query.isFetching,
    nextRefreshAt: new Date(query.data.nextRefreshAtMs),
  };
}
