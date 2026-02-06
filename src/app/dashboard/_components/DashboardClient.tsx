'use client';

import { useMemo, useState } from 'react';
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

  const selectedStation = useMemo(() => {
    return (
      initialData.stations.stations.find(
        (station) => station.id === selectedStationId
      ) ?? initialData.stations.stations[0]
    );
  }, [initialData.stations.stations, selectedStationId]);

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

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <MapPanel
            stations={initialData.stations.stations}
            selectedStationId={selectedStationId}
            onSelectStation={setSelectedStationId}
          />
        </div>
        <div className="lg:col-span-4 flex flex-col gap-6">
          <StationPicker
            stations={initialData.stations.stations}
            selectedStationId={selectedStationId}
            onChange={setSelectedStationId}
          />
          <AlertsPanel
            alerts={initialData.alerts}
            stations={initialData.stations.stations}
          />
        </div>

        <div className="lg:col-span-6">
          <RankingsTable rankings={initialData.rankings} />
        </div>
        <div className="lg:col-span-6">
          <HourlyCharts
            stationId={selectedStation?.id ?? ''}
            stationName={selectedStation?.name ?? 'Estacion desconocida'}
            patterns={initialData.patterns}
          />
        </div>
        <div className="lg:col-span-12">
          <Heatmap
            stationId={selectedStation?.id ?? ''}
            stationName={selectedStation?.name ?? 'Estacion desconocida'}
            heatmap={initialData.heatmap}
          />
        </div>
      </div>
    </div>
  );
}
