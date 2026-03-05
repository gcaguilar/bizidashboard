'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type {
  AlertsResponse,
  HeatmapCell,
  RankingsResponse,
  StationPatternRow,
  StationsResponse,
  StatusResponse,
} from '@/lib/api';
import { AlertsPanel } from './AlertsPanel';
import { Heatmap } from './Heatmap';
import { HourlyCharts } from './HourlyCharts';
import { MapPanel } from './MapPanel';
import { MethodologyPanel } from './MethodologyPanel';
import { MobilityInsights } from './MobilityInsights';
import { NeighborhoodMiniMap } from './NeighborhoodMiniMap';
import { RankingsTable } from './RankingsTable';
import { StationDetailPanel } from './StationDetailPanel';
import { StationPicker } from './StationPicker';
import { StatusBanner } from './StatusBanner';

export type DashboardInitialData = {
  stations: StationsResponse;
  status: StatusResponse;
  alerts: AlertsResponse;
  rankings: {
    turnover: RankingsResponse;
    availability: RankingsResponse;
  };
  patterns: StationPatternRow[];
  heatmap: HeatmapCell[];
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

const TIME_WINDOWS: TimeWindow[] = [
  { id: '24h', label: 'Ultimas 24h', mobilityDays: 1, demandDays: 7 },
  { id: '7d', label: '7 dias', mobilityDays: 7, demandDays: 14 },
  { id: '30d', label: '30 dias', mobilityDays: 30, demandDays: 30 },
];

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
  const [patterns, setPatterns] = useState(initialData.patterns);
  const [heatmap, setHeatmap] = useState(initialData.heatmap);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeWindowId, setActiveWindowId] = useState(TIME_WINDOWS[1]?.id ?? '7d');

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
    if (!selectedStationId) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    const refresh = async () => {
      try {
        setIsRefreshing(true);
        const searchParams = new URLSearchParams({ stationId: selectedStationId });

        const [patternsResponse, heatmapResponse] = await Promise.all([
          fetch(`/api/patterns?${searchParams.toString()}`, {
            signal: controller.signal,
          }),
          fetch(`/api/heatmap?${searchParams.toString()}`, {
            signal: controller.signal,
          }),
        ]);

        if (!patternsResponse.ok || !heatmapResponse.ok) {
          throw new Error('No se pudieron refrescar los datos de patrones.');
        }

        const [nextPatterns, nextHeatmap] = await Promise.all([
          patternsResponse.json(),
          heatmapResponse.json(),
        ]);

        if (!isActive) {
          return;
        }

        if (Array.isArray(nextPatterns)) {
          setPatterns(nextPatterns);
        }

        if (Array.isArray(nextHeatmap)) {
          setHeatmap(nextHeatmap);
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }

        console.error('Error al refrescar patrones y heatmap.', error);
      } finally {
        if (isActive) {
          setIsRefreshing(false);
        }
      }
    };

    void refresh();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [selectedStationId]);

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 overflow-x-hidden">
      <header className="sticky top-0 z-40 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-black text-white">
                B
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">Bizi Zaragoza</p>
                <h1 className="text-lg font-bold text-[var(--foreground)]">Panel de movilidad urbana</h1>
              </div>
            </div>

            <nav className="hidden items-center gap-5 lg:flex">
              <span className="border-b-2 border-[var(--accent)] pb-1 text-sm font-bold text-[var(--foreground)]">
                Inicio
              </span>
              <Link href="/dashboard/flujo" className="text-sm font-medium text-[var(--muted)]">
                Flujo
              </Link>
              <Link href="/dashboard/estaciones" className="text-sm font-medium text-[var(--muted)]">
                Estaciones
              </Link>
            </nav>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 md:flex-none">
            <label className="hidden w-full max-w-sm items-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-sm md:flex">
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
              FAQ
            </Link>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
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

          <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-1">
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

      <StatusBanner
        status={initialData.status}
        stationsGeneratedAt={initialData.stations.generatedAt}
      />

      <StationPicker
        stations={initialData.stations.stations}
        selectedStationId={selectedStationId}
        onSelectStation={setSelectedStationId}
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-8">
          <MapPanel
            stations={initialData.stations.stations}
            selectedStationId={selectedStationId}
            onSelectStation={setSelectedStationId}
          />
        </div>

        <div className="min-w-0 xl:col-span-4">
          <AlertsPanel
            alerts={initialData.alerts}
            stations={initialData.stations.stations}
          />
        </div>

        <div className="min-w-0 xl:col-span-4">
          <RankingsTable
            rankings={initialData.rankings}
            stations={initialData.stations.stations}
          />
        </div>

        <div className="min-w-0 xl:col-span-4">
          <HourlyCharts
            stationId={selectedStation?.id ?? ''}
            stationName={selectedStation?.name ?? 'Estacion desconocida'}
            patterns={patterns}
            isRefreshing={isRefreshing}
          />
        </div>

        <div className="min-w-0 xl:col-span-4">
          <NeighborhoodMiniMap
            stations={initialData.stations.stations}
            selectedStationId={selectedStation?.id ?? ''}
          />
        </div>

        <div className="min-w-0 xl:col-span-8">
          <StationDetailPanel
            station={selectedStation}
            stations={initialData.stations.stations}
            rankings={initialData.rankings}
            alerts={initialData.alerts}
            patterns={patterns}
            heatmap={heatmap}
            mobilityDays={activeWindow.mobilityDays}
            demandDays={activeWindow.demandDays}
          />
        </div>

        <div className="min-w-0 xl:col-span-4">
          <MethodologyPanel />
        </div>

        <div className="min-w-0 xl:col-span-12">
          <Heatmap
            stationId={selectedStation?.id ?? ''}
            stationName={selectedStation?.name ?? 'Estacion desconocida'}
            heatmap={heatmap}
            isRefreshing={isRefreshing}
          />
        </div>

        <div className="min-w-0 xl:col-span-12">
          <MobilityInsights
            stations={initialData.stations.stations}
            selectedStationId={selectedStation?.id ?? ''}
            mobilityDays={activeWindow.mobilityDays}
            demandDays={activeWindow.demandDays}
          />
        </div>
      </div>

      <footer className="pb-4 text-center text-[11px] text-[var(--muted)]">
        Proyecto{' '}
        <a
          href="https://github.com/gcaguilar/bizidashboard"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-[var(--border)] underline-offset-3 hover:text-[var(--foreground)]"
        >
          open source
        </a>
        .
      </footer>
    </div>
  );
}
