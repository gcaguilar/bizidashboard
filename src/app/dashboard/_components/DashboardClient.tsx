'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type {
  AlertsResponse,
  RankingsResponse,
  StationsResponse,
  StatusResponse,
} from '@/lib/api';
import { AlertsPanel } from './AlertsPanel';
import { DemandFlowCard } from './DemandFlowCard';
import { FlowPreviewPanel } from './FlowPreviewPanel';
import { MapPanel } from './MapPanel';
import { NeighborhoodLoadCard } from './NeighborhoodLoadCard';
import { RankingsTable } from './RankingsTable';
import { StationPicker } from './StationPicker';

export type DashboardInitialData = {
  stations: StationsResponse;
  status: StatusResponse;
  alerts: AlertsResponse;
  rankings: {
    turnover: RankingsResponse;
    availability: RankingsResponse;
  };
};

type DashboardClientProps = {
  initialData: DashboardInitialData;
};

type TimeWindow = {
  id: string;
  label: string;
  mobilityDays: number;
  demandDays: number;
};

type MobilitySignalRow = {
  stationId: string;
  hour: number;
  departures: number;
  arrivals: number;
  sampleCount: number;
};

type DailyDemandRow = {
  day: string;
  demandScore: number;
  avgOccupancy: number;
  sampleCount: number;
};

type MobilityPreviewData = {
  hourlySignals: MobilitySignalRow[];
  dailyDemand: DailyDemandRow[];
};

const TIME_WINDOWS: TimeWindow[] = [
  { id: '24h', label: 'Ultimas 24h', mobilityDays: 1, demandDays: 7 },
  { id: '7d', label: '7 dias', mobilityDays: 7, demandDays: 14 },
  { id: '30d', label: 'Mes', mobilityDays: 30, demandDays: 30 },
];

const EMPTY_MOBILITY_PREVIEW: MobilityPreviewData = {
  hourlySignals: [],
  dailyDemand: [],
};

const REPO_URL = 'https://github.com/gcaguilar/bizidashboard';

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const [selectedStationId, setSelectedStationId] = useState(
    initialData.stations.stations[0]?.id ?? ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeWindowId, setActiveWindowId] = useState(TIME_WINDOWS[1]?.id ?? '7d');
  const [mobilityPreview, setMobilityPreview] =
    useState<MobilityPreviewData>(EMPTY_MOBILITY_PREVIEW);

  const activeWindow =
    TIME_WINDOWS.find((window) => window.id === activeWindowId) ?? TIME_WINDOWS[1];

  const selectedStation = useMemo(() => {
    return (
      initialData.stations.stations.find((station) => station.id === selectedStationId) ??
      initialData.stations.stations[0] ??
      null
    );
  }, [initialData.stations.stations, selectedStationId]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    const query = normalizeText(searchQuery);
    const bestMatch = initialData.stations.stations.find((station) => {
      const normalizedName = normalizeText(station.name);
      const normalizedId = normalizeText(station.id);

      return normalizedName.includes(query) || normalizedId.includes(query);
    });

    if (bestMatch && bestMatch.id !== selectedStationId) {
      setSelectedStationId(bestMatch.id);
    }
  }, [initialData.stations.stations, searchQuery, selectedStationId]);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const refreshMobilityPreview = async () => {
      try {
        const searchParams = new URLSearchParams({
          mobilityDays: String(activeWindow.mobilityDays),
          demandDays: String(activeWindow.demandDays),
        });

        const response = await fetch(`/api/mobility?${searchParams.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('No se pudo cargar la vista previa de flujo.');
        }

        const payload = (await response.json()) as Partial<MobilityPreviewData>;

        if (!isActive) {
          return;
        }

        setMobilityPreview({
          hourlySignals: Array.isArray(payload.hourlySignals) ? payload.hourlySignals : [],
          dailyDemand: Array.isArray(payload.dailyDemand) ? payload.dailyDemand : [],
        });
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }

        console.error('Error al refrescar vista previa de flujo.', error);

        if (isActive) {
          setMobilityPreview(EMPTY_MOBILITY_PREVIEW);
        }
      }
    };

    void refreshMobilityPreview();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [activeWindow.demandDays, activeWindow.mobilityDays]);

  const selectedStationDetailUrl = selectedStation
    ? `/dashboard/estaciones/${encodeURIComponent(selectedStation.id)}`
    : '/dashboard/estaciones';

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 overflow-x-hidden">
      <header className="sticky top-0 z-50 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-6">
            <div className="flex items-center gap-3 text-[var(--accent)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-black text-white">
                B
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Bizi Zaragoza</h1>
            </div>

            <div className="hidden items-center gap-2 rounded-lg bg-[var(--accent)]/10 p-1 lg:flex">
              {TIME_WINDOWS.map((window) => (
                <button
                  key={window.id}
                  type="button"
                  onClick={() => setActiveWindowId(window.id)}
                  className={`rounded-md px-4 py-1.5 text-xs font-semibold transition ${
                    activeWindowId === window.id
                      ? 'bg-[var(--accent)] text-white shadow-sm'
                      : 'text-[var(--muted)] hover:bg-[var(--accent)]/10 hover:text-[var(--foreground)]'
                  }`}
                >
                  {window.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <label className="hidden w-full max-w-md items-center rounded-lg border border-transparent bg-[var(--surface-soft)] px-3 py-2 md:flex md:border-[var(--border)]/60">
              <input
                type="text"
                className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
                placeholder="Buscar estacion o barrio..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>

            <button type="button" className="icon-button" aria-label="Notificaciones">
              N
            </button>
            <Link href="/dashboard/ayuda" className="icon-button" aria-label="Centro de ayuda">
              Ayuda
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="icon-button"
              aria-label="Repositorio de la aplicacion"
            >
              Repositorio
            </a>
            <div className="hidden h-9 w-9 items-center justify-center rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/20 text-xs font-bold text-[var(--foreground)] sm:flex">
              BA
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)]/70 pt-3">
          <label className="flex w-full items-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-sm md:hidden">
            <input
              type="text"
              className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
              placeholder="Buscar estacion o barrio..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          <p className="text-xs text-[var(--muted)]">
            Estaciones: {initialData.stations.stations.length} · Alertas activas:{' '}
            {initialData.alerts.alerts.length} · Ultima consulta: {initialData.status.timestamp}
          </p>

          <div className="flex items-center gap-2 rounded-lg bg-[var(--accent)]/10 p-1 lg:hidden">
            {TIME_WINDOWS.map((window) => (
              <button
                key={window.id}
                type="button"
                onClick={() => setActiveWindowId(window.id)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  activeWindowId === window.id
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {window.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:items-stretch">
        <div className="min-w-0 lg:col-span-3">
          <MapPanel
            stations={initialData.stations.stations}
            selectedStationId={selectedStationId}
            onSelectStation={setSelectedStationId}
          />
        </div>
        <div className="min-w-0 lg:col-span-1">
          <AlertsPanel alerts={initialData.alerts} stations={initialData.stations.stations} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <DemandFlowCard dailyDemand={mobilityPreview.dailyDemand} />
        <RankingsTable rankings={initialData.rankings} stations={initialData.stations.stations} />
        <NeighborhoodLoadCard stations={initialData.stations.stations} />
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--accent)]/8 px-4 py-4">
          <div>
            <h2 className="text-lg font-bold leading-tight text-[var(--foreground)]">
              Analisis de flujo y corredores populares
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Movimiento entre barrios en tiempo real.
            </p>
          </div>
          <Link
            href="/dashboard/flujo"
            className="rounded-lg border border-[var(--accent)] bg-[var(--accent)]/12 px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
          >
            Vista completa
          </Link>
        </div>
        <FlowPreviewPanel
          stations={initialData.stations.stations}
          hourlySignals={mobilityPreview.hourlySignals}
        />
      </section>

      <StationPicker
        stations={initialData.stations.stations}
        selectedStationId={selectedStationId}
        onSelectStation={setSelectedStationId}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <article className="dashboard-card">
          <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
            Detalle de estacion
          </h3>
          <p className="text-sm text-[var(--muted)]">
            Abre la vista completa de la estacion seleccionada para ver prediccion, mapa por barrios y comparativas.
          </p>
          <Link
            href={selectedStationDetailUrl}
            className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
          >
            Abrir detalle completo
          </Link>
        </article>

        <article className="dashboard-card">
          <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
            Flujo por barrios
          </h3>
          <p className="text-sm text-[var(--muted)]">
            Consulta la matriz O-D, el chord y las rutas de mayor volumen en una pagina dedicada.
          </p>
          <Link
            href="/dashboard/flujo"
            className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
          >
            Ir a analisis de flujo
          </Link>
        </article>

        <article className="dashboard-card">
          <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
            Centro de ayuda
          </h3>
          <p className="text-sm text-[var(--muted)]">
            Metodologia, criterios de alertas y documentacion en una pagina independiente.
          </p>
          <Link
            href="/dashboard/ayuda"
            className="mt-auto inline-flex rounded-lg border border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
          >
            Abrir ayuda
          </Link>
        </article>
      </section>

      <footer className="pb-4 text-center text-[11px] text-[var(--muted)]">
        © 2024 Bizi Zaragoza - Sistema de analitica de movilidad urbana.
      </footer>
    </div>
  );
}
