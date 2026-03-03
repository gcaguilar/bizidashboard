import {
  fetchAlerts,
  fetchHeatmap,
  fetchPatterns,
  fetchRankings,
  fetchStations,
  fetchStatus,
  type AlertsResponse,
  type RankingsResponse,
  type StationsResponse,
  type StatusResponse,
} from '@/lib/api';
import { DashboardClient, type DashboardInitialData } from './_components/DashboardClient';

export const dynamic = 'force-dynamic';

type ErrorWithMeta = {
  cause?: unknown;
  meta?: {
    driverAdapterError?: unknown;
  };
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isMissingTableError(error: unknown): boolean {
  const message = toErrorMessage(error).toLowerCase();
  if (message.includes('no such table') || message.includes('p2021')) {
    return true;
  }

  if (error && typeof error === 'object') {
    const maybeError = error as ErrorWithMeta;

    if (maybeError.cause && isMissingTableError(maybeError.cause)) {
      return true;
    }

    if (
      maybeError.meta?.driverAdapterError &&
      isMissingTableError(maybeError.meta.driverAdapterError)
    ) {
      return true;
    }
  }

  return false;
}

function buildFallbackStatus(nowIso: string): StatusResponse {
  return {
    pipeline: {
      lastSuccessfulPoll: null,
      totalRowsCollected: 0,
      pollsLast24Hours: 0,
      validationErrors: 0,
      consecutiveFailures: 0,
      lastDataFreshness: false,
      lastStationCount: 0,
      averageStationsPerPoll: 0,
      healthStatus: 'down',
      healthReason: 'No se pudieron consultar las tablas de datos.',
    },
    quality: {
      freshness: {
        isFresh: false,
        lastUpdated: null,
        maxAgeSeconds: 300,
      },
      volume: {
        recentStationCount: 0,
        averageStationsPerPoll: 0,
        expectedRange: { min: 200, max: 500 },
      },
      lastCheck: null,
    },
    system: {
      uptime: nowIso,
      version: process.env.npm_package_version ?? '0.1.0',
      environment: process.env.NODE_ENV ?? 'production',
    },
    timestamp: nowIso,
  };
}

export default async function DashboardPage() {
  const nowIso = new Date().toISOString();
  const fallbackStations: StationsResponse = {
    stations: [],
    generatedAt: nowIso,
  };
  const fallbackStatus = buildFallbackStatus(nowIso);
  const fallbackAlerts: AlertsResponse = {
    limit: 20,
    alerts: [],
    generatedAt: nowIso,
  };
  const fallbackTurnover: RankingsResponse = {
    type: 'turnover',
    limit: 10,
    rankings: [],
    generatedAt: nowIso,
  };
  const fallbackAvailability: RankingsResponse = {
    type: 'availability',
    limit: 10,
    rankings: [],
    generatedAt: nowIso,
  };
  const fallbackPatterns: DashboardInitialData['patterns'] = [];
  const fallbackHeatmap: DashboardInitialData['heatmap'] = [];

  const loadErrors: string[] = [];
  const schemaMissingFlags: boolean[] = [];

  const withFallback = async <T,>(
    label: string,
    fetcher: () => Promise<T>,
    fallback: T
  ): Promise<T> => {
    try {
      return await fetcher();
    } catch (error) {
      console.error(`[Dashboard] Error cargando ${label}:`, error);
      loadErrors.push(label);
      if (isMissingTableError(error)) {
        schemaMissingFlags.push(true);
      }
      return fallback;
    }
  };

  const [stations, status, alerts, turnover, availability] = await Promise.all([
    withFallback('estaciones', fetchStations, fallbackStations),
    withFallback('estado del sistema', fetchStatus, fallbackStatus),
    withFallback('alertas', () => fetchAlerts(20), fallbackAlerts),
    withFallback('ranking de uso', () => fetchRankings('turnover', 10), fallbackTurnover),
    withFallback(
      'ranking de disponibilidad',
      () => fetchRankings('availability', 10),
      fallbackAvailability
    ),
  ]);

  const defaultStationId = stations.stations[0]?.id ?? '';
  const [patterns, heatmap] = defaultStationId
    ? await Promise.all([
        withFallback('patrones', () => fetchPatterns(defaultStationId), fallbackPatterns),
        withFallback('heatmap', () => fetchHeatmap(defaultStationId), fallbackHeatmap),
      ])
    : [fallbackPatterns, fallbackHeatmap];

  const initialData: DashboardInitialData = {
    stations,
    status,
    alerts,
    rankings: {
      turnover,
      availability,
    },
    patterns,
    heatmap,
  };

  const isSchemaMissing = schemaMissingFlags.length > 0;

  return (
    <main className="min-h-screen px-6 py-8">
      {loadErrors.length > 0 ? (
        <section className="mx-auto mb-6 w-full max-w-6xl rounded-3xl border border-[#f2d08f] bg-[#fff5d7] px-6 py-4 text-sm text-[#8a5b00] shadow-[var(--shadow)]">
          <p className="font-semibold">
            No se pudieron cargar algunos paneles: {loadErrors.join(', ')}.
          </p>
          <p className="mt-1 text-xs">
            {isSchemaMissing
              ? 'La base de datos parece no estar inicializada. Ejecuta `pnpm prisma migrate deploy` con la misma DATABASE_URL del servidor.'
              : 'Revisa los logs del servidor para mas detalles.'}
          </p>
        </section>
      ) : null}
      <DashboardClient initialData={initialData} />
    </main>
  );
}
