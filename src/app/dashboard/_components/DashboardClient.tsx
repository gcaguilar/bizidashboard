'use client';

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
import { RankingsTable } from './RankingsTable';
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

export function DashboardClient({ initialData }: DashboardClientProps) {
  const [selectedStationId, setSelectedStationId] = useState(
    initialData.stations.stations[0]?.id ?? ''
  );
  const [patterns, setPatterns] = useState(initialData.patterns);
  const [heatmap, setHeatmap] = useState(initialData.heatmap);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedStation = useMemo(() => {
    return (
      initialData.stations.stations.find(
        (station) => station.id === selectedStationId
      ) ?? initialData.stations.stations[0]
    );
  }, [initialData.stations.stations, selectedStationId]);

  useEffect(() => {
    if (!selectedStationId) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    const refresh = async () => {
      try {
        setIsRefreshing(true);
        const searchParams = new URLSearchParams({
          stationId: selectedStationId,
        });

        const [patternsResponse, heatmapResponse] = await Promise.all([
          fetch(`/api/patterns?${searchParams}`, {
            signal: controller.signal,
          }),
          fetch(`/api/heatmap?${searchParams}`, {
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-2 rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-6 py-5 shadow-[var(--shadow)]">
        <span className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
          Bizi Zaragoza
        </span>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Panel de actividad y disponibilidad
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Estaciones monitoreadas: {initialData.stations.stations.length} ·
          Alertas activas: {initialData.alerts.alerts.length} · Ultima consulta:{' '}
          {initialData.status.timestamp ?? 'Sin datos'}
        </p>
      </header>

      <StatusBanner
        status={initialData.status}
        stationsGeneratedAt={initialData.stations.generatedAt}
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="md:col-span-2 xl:col-span-2">
          <MapPanel
            stations={initialData.stations.stations}
            selectedStationId={selectedStationId}
            onSelectStation={setSelectedStationId}
          />
        </div>
        <div className="flex flex-col gap-6">
          <StationPicker
            key={selectedStationId}
            stations={initialData.stations.stations}
            selectedStationId={selectedStationId}
            onSelectStation={setSelectedStationId}
          />
          <AlertsPanel
            alerts={initialData.alerts}
            stations={initialData.stations.stations}
          />
        </div>

        <div>
          <RankingsTable
            rankings={initialData.rankings}
            stations={initialData.stations.stations}
          />
        </div>
        <div>
          <HourlyCharts
            stationId={selectedStation?.id ?? ''}
            stationName={selectedStation?.name ?? 'Estacion desconocida'}
            patterns={patterns}
            isRefreshing={isRefreshing}
          />
        </div>
        <div className="md:col-span-2 xl:col-span-3">
          <Heatmap
            stationId={selectedStation?.id ?? ''}
            stationName={selectedStation?.name ?? 'Estacion desconocida'}
            heatmap={heatmap}
            isRefreshing={isRefreshing}
          />
        </div>
      </div>
    </div>
  );
}
