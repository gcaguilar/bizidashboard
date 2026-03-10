'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  TransitAlertsResponse,
  TransitHeatmapCell,
  TransitPatternRow,
  TransitRankingsResponse,
  TransitStatusResponse,
  TransitStopsResponse,
} from '@/lib/transit-api';
import { DashboardRouteLinks } from '@/app/dashboard/_components/DashboardRouteLinks';
import { ThemeToggleButton } from '@/app/dashboard/_components/ThemeToggleButton';
import { TransitMapPanel } from './TransitMapPanel';

type TransitMode = 'bus' | 'tram';

type TransitDashboardClientProps = {
  mode: TransitMode;
  initialStops: TransitStopsResponse;
  initialAlerts: TransitAlertsResponse;
  initialRankings: TransitRankingsResponse;
  initialStatus: TransitStatusResponse;
};

const REPO_URL = 'https://github.com/gcaguilar/bizidashboard';
const DAY_LABELS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

function formatAlertType(value: string): string {
  switch (value) {
    case 'STALE_DATA':
      return 'Datos stale';
    case 'NO_REALTIME':
      return 'Sin realtime';
    case 'SLOW_SERVICE':
      return 'Servicio lento';
    default:
      return value;
  }
}

function formatModeLabel(mode: TransitMode): string {
  return mode === 'bus' ? 'Bus urbano' : 'Tranvia';
}

export function TransitDashboardClient({
  mode,
  initialStops,
  initialAlerts,
  initialRankings,
  initialStatus,
}: TransitDashboardClientProps) {
  const [stopsData] = useState(initialStops);
  const [alertsData] = useState(initialAlerts);
  const [rankingsData] = useState(initialRankings);
  const [statusData] = useState(initialStatus);
  const [selectedStopId, setSelectedStopId] = useState(initialStops.stops[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [patterns, setPatterns] = useState<TransitPatternRow[]>([]);
  const [heatmap, setHeatmap] = useState<TransitHeatmapCell[]>([]);

  const filteredStops = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return stopsData.stops;
    }

    return stopsData.stops.filter((stop) => {
      return `${stop.name} ${stop.externalId}`.toLowerCase().includes(normalized);
    });
  }, [query, stopsData.stops]);

  useEffect(() => {
    if (!selectedStopId && filteredStops[0]) {
      setSelectedStopId(filteredStops[0].id);
      return;
    }

    if (filteredStops.some((stop) => stop.id === selectedStopId)) {
      return;
    }

    setSelectedStopId(filteredStops[0]?.id ?? '');
  }, [filteredStops, selectedStopId]);

  useEffect(() => {
    if (!selectedStopId) {
      setPatterns([]);
      setHeatmap([]);
      return;
    }

    const controller = new AbortController();

    const loadDetail = async () => {
      try {
        const params = new URLSearchParams({ mode, transitStopId: selectedStopId });
        const [patternsResponse, heatmapResponse] = await Promise.all([
          fetch(`/api/transit/patterns?${params.toString()}`, { signal: controller.signal }),
          fetch(`/api/transit/heatmap?${params.toString()}`, { signal: controller.signal }),
        ]);

        if (!patternsResponse.ok || !heatmapResponse.ok) {
          throw new Error('No se pudo cargar el detalle de la parada.');
        }

        setPatterns((await patternsResponse.json()) as TransitPatternRow[]);
        setHeatmap((await heatmapResponse.json()) as TransitHeatmapCell[]);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }

        console.error('[Transit] Error loading stop detail', error);
        setPatterns([]);
        setHeatmap([]);
      }
    };

    void loadDetail();

    return () => controller.abort();
  }, [mode, selectedStopId]);

  const selectedStop =
    filteredStops.find((stop) => stop.id === selectedStopId) ?? stopsData.stops.find((stop) => stop.id === selectedStopId) ?? null;

  const chartData = useMemo(() => {
    const rows = Array.from({ length: 24 }, (_, hour) => {
      const weekday = patterns.find((row) => row.dayType === 'WEEKDAY' && row.hour === hour) ?? null;
      const weekend = patterns.find((row) => row.dayType === 'WEEKEND' && row.hour === hour) ?? null;

      return {
        hour: `${String(hour).padStart(2, '0')}:00`,
        weekdayEta: weekday?.etaAvg ?? null,
        weekendEta: weekend?.etaAvg ?? null,
      };
    });

    return rows;
  }, [patterns]);

  const heatmapMatrix = useMemo(() => {
    const cellMap = new Map(heatmap.map((cell) => [`${cell.dayOfWeek}-${cell.hour}`, cell] as const));
    return Array.from({ length: 7 }, (_, dayOfWeek) =>
      Array.from({ length: 24 }, (_, hour) => cellMap.get(`${dayOfWeek}-${hour}`) ?? null)
    );
  }, [heatmap]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 overflow-x-clip px-4 py-6 md:px-6 md:py-8">
      <header className="sticky top-0 z-50 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">Transporte</p>
              <h1 className="text-xl font-bold text-[var(--foreground)]">{formatModeLabel(mode)}</h1>
            </div>
            <DashboardRouteLinks
              routes={['dashboard', 'stations', 'flow', 'conclusions', 'help']}
              variant="inline"
              className="hidden items-center gap-5 md:flex"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/transporte/bus"
              className={`icon-button ${mode === 'bus' ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : ''}`}
            >
              Bus
            </Link>
            <Link
              href="/dashboard/transporte/tranvia"
              className={`icon-button ${mode === 'tram' ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : ''}`}
            >
              Tranvia
            </Link>
            <ThemeToggleButton />
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="icon-button">
              Repo
            </a>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-[260px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--foreground)] outline-none"
            placeholder="Buscar parada por nombre o codigo"
          />
          <select
            id="transit-stop-picker"
            value={selectedStopId}
            onChange={(event) => setSelectedStopId(event.target.value)}
            className="min-w-[260px] rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--foreground)]"
          >
            {filteredStops.map((stop) => (
              <option key={stop.id} value={stop.id}>
                {stop.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="dashboard-card">
          <p className="stat-label">Paradas activas</p>
          <p className="stat-value">{statusData.activeStops}</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Cobertura reciente</p>
          <p className="stat-value">{statusData.stopsWithRecentSnapshot}</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Snapshots 24h</p>
          <p className="stat-value">{statusData.snapshotsLast24Hours}</p>
        </article>
        <article className="dashboard-card">
          <p className="stat-label">Stale 24h</p>
          <p className="stat-value">{statusData.staleSnapshotsLast24Hours}</p>
        </article>
      </section>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <TransitMapPanel
            stops={filteredStops}
            selectedStopId={selectedStopId}
            onSelectStop={setSelectedStopId}
          />
        </div>

        <div className="space-y-6 xl:col-span-4">
          <section className="dashboard-card">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
              Alertas activas
            </h2>
            <div className="mt-3 space-y-2">
              {alertsData.alerts.slice(0, 8).map((alert) => (
                <article key={alert.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{alert.stopName}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatAlertType(alert.alertType)} · sev {alert.severity}
                  </p>
                </article>
              ))}
              {alertsData.alerts.length === 0 ? <p className="text-sm text-[var(--muted)]">Sin alertas activas.</p> : null}
            </div>
          </section>

          <section className="dashboard-card">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
              Ranking de criticidad
            </h2>
            <div className="mt-3 space-y-2">
              {rankingsData.rankings.slice(0, 8).map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedStopId(row.transitStopId)}
                  className="flex w-full items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-left"
                >
                  <span className="text-sm font-semibold text-[var(--foreground)]">{row.stopName}</span>
                  <span className="text-xs font-bold text-[var(--muted)]">{row.criticalityScore.toFixed(1)}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-12">
        <article className="dashboard-card xl:col-span-5">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Detalle de parada</h2>
          {selectedStop ? (
            <div className="mt-3 space-y-3 text-sm">
              <p className="font-semibold text-[var(--foreground)]">{selectedStop.name}</p>
              <p className="text-[var(--muted)]">Codigo {selectedStop.externalId}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <article className="stat-card">
                  <p className="stat-label">ETA minima</p>
                  <p className="stat-value">
                    {selectedStop.etaMinutes === null ? 'N/D' : `${selectedStop.etaMinutes} min`}
                  </p>
                </article>
                <article className="stat-card">
                  <p className="stat-label">Llegadas inmediatas</p>
                  <p className="stat-value">{selectedStop.arrivalEvents}</p>
                </article>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--muted)]">Selecciona una parada.</p>
          )}
        </article>

        <article className="dashboard-card xl:col-span-7">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Patron horario de llegada</h2>
          <div className="mt-3 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} minTickGap={14} />
                <YAxis tick={{ fontSize: 11 }} width={40} />
                <Tooltip />
                <Line type="monotone" dataKey="weekdayEta" name="Laborable" stroke="#ea0615" dot={false} />
                <Line type="monotone" dataKey="weekendEta" name="Fin de semana" stroke="#0ea5e9" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="dashboard-card xl:col-span-12">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Heatmap operativo</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-[11px]">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left text-[var(--muted)]">Dia</th>
                  {Array.from({ length: 24 }, (_, hour) => (
                    <th key={hour} className="px-2 py-2 text-[var(--muted)]">{hour}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapMatrix.map((row, dayIndex) => (
                  <tr key={dayIndex}>
                    <td className="px-2 py-2 font-semibold text-[var(--foreground)]">{DAY_LABELS[dayIndex]}</td>
                    {row.map((cell, hour) => {
                      const intensity = cell?.staleRate ?? 0;
                      const background = cell
                        ? `rgba(234, 6, 21, ${Math.min(0.85, 0.12 + intensity * 0.7)})`
                        : 'rgba(148,163,184,0.12)';
                      const text = cell?.etaAvg === null || cell?.etaAvg === undefined ? '·' : Math.round(cell.etaAvg).toString();

                      return (
                        <td
                          key={`${dayIndex}-${hour}`}
                          className="border border-[var(--border)] px-2 py-2 text-center text-[var(--foreground)]"
                          style={{ backgroundColor: background }}
                        >
                          {text}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </main>
  );
}
