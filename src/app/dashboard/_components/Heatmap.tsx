'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { HeatmapCell } from '@/lib/api';
import { formatPercent } from '@/lib/format';
import {
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartWrapper } from './ChartWrapper';

type HeatmapProps = {
  stationId: string;
  stationName: string;
  heatmap: HeatmapCell[];
  isRefreshing?: boolean;
};

type HeatPoint = {
  day: number;
  hour: number;
  value: number | null;
  sampleCount: number;
};

type TooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload?: HeatPoint;
  }>;
};

const DAY_LABELS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

function normalizeDayIndex(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value >= 1 && value <= 7) {
    return value === 7 ? 6 : value - 1;
  }

  return Math.max(0, Math.min(6, Math.round(value)));
}

function getHeatmapStats(cells: HeatmapCell[]) {
  if (cells.length === 0) {
    return { min: 0, max: 0, avg: 0 };
  }

  const totals = cells.reduce(
    (acc, cell) => {
      const value = Number.isFinite(cell.occupancyAvg) ? cell.occupancyAvg : 0;
      acc.min = Math.min(acc.min, value);
      acc.max = Math.max(acc.max, value);
      acc.sum += value;
      return acc;
    },
    { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY, sum: 0 }
  );

  return {
    min: totals.min,
    max: totals.max,
    avg: totals.sum / cells.length,
  };
}

function getHeatColor(value: number | null, min: number, max: number): string {
  if (value === null || !Number.isFinite(value)) {
    return 'hsl(338 22% 20%)';
  }

  const range = max - min || 1;
  const ratio = Math.min(1, Math.max(0, (value - min) / range));
  const lightness = 22 + ratio * 42;
  return `hsl(354 82% ${lightness}%)`;
}

function HeatTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload;
  if (!point) {
    return null;
  }

  const dayLabel = DAY_LABELS[point.day] ?? 'Dia';
  const hourLabel = `${String(point.hour).padStart(2, '0')}:00`;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs shadow-[var(--shadow-soft)]">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
        {dayLabel} · {hourLabel}
      </p>
      <div className="mt-1 flex items-center justify-between gap-4">
        <span className="text-[var(--muted)]">Ocupacion</span>
        <span className="font-semibold text-[var(--foreground)]">{formatPercent(point.value)}</span>
      </div>
      <p className="mt-1 text-[10px] text-[var(--muted)]">{point.sampleCount} muestras</p>
    </div>
  );
}

export function Heatmap({
  stationId,
  stationName,
  heatmap,
  isRefreshing,
}: HeatmapProps) {
  const points = useMemo<HeatPoint[]>(() => {
    const cellMap = new Map<string, HeatmapCell>();

    heatmap.forEach((cell) => {
      const day = normalizeDayIndex(cell.dayOfWeek);
      const hour = Number(cell.hour);

      if (!Number.isFinite(hour) || hour < 0 || hour > 23) {
        return;
      }

      cellMap.set(`${day}-${hour}`, cell);
    });

    return Array.from({ length: 7 }, (_, day) => day).flatMap((day) =>
      Array.from({ length: 24 }, (_, hour) => {
        const cell = cellMap.get(`${day}-${hour}`);

        return {
          day,
          hour,
          value: cell?.occupancyAvg ?? null,
          sampleCount: cell?.sampleCount ?? 0,
        };
      })
    );
  }, [heatmap]);

  const stats = getHeatmapStats(heatmap);
  const hasData = heatmap.length > 0;
  const tickHours = [0, 4, 8, 12, 16, 20, 23];

  return (
    <section className="dashboard-card gap-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Heatmap de ocupacion</h2>
          <p className="text-xs text-[var(--muted)]">
            Estacion {stationName} ({stationId || 'sin seleccion'})
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Cada celda resume la ocupacion media por dia de semana y hora para detectar patrones repetidos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/ayuda#detalle-estacion"
            className="text-xs font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
          >
            Como leerlo
          </Link>
          {isRefreshing ? <span className="kpi-chip">Actualizando</span> : null}
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <article className="stat-card">
          <p className="stat-label">Celdas</p>
          <p className="stat-value">{heatmap.length}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Media</p>
          <p className="stat-value">{formatPercent(stats.avg)}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Rango</p>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {formatPercent(stats.min)} - {formatPercent(stats.max)}
          </p>
        </article>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
        {hasData ? (
          <ChartWrapper height="h-[300px]">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                <ScatterChart margin={{ top: 16, right: 24, bottom: 20, left: 18 }}>
                  <XAxis
                    type="number"
                    dataKey="hour"
                    domain={[-0.5, 23.5]}
                    ticks={tickHours}
                    allowDecimals={false}
                    tickFormatter={(value) => `${String(value).padStart(2, '0')}:00`}
                    tick={{ fontSize: 11 }}
                    tickMargin={8}
                  />
                  <YAxis
                    type="number"
                    dataKey="day"
                    domain={[-0.5, 6.5]}
                    ticks={[0, 1, 2, 3, 4, 5, 6]}
                    allowDecimals={false}
                    tickFormatter={(value) => DAY_LABELS[value] ?? 'Dia'}
                    tick={{ fontSize: 11 }}
                    tickMargin={8}
                    width={52}
                  />
                  <Tooltip content={<HeatTooltip />} />
                  <Scatter
                    data={points}
                    shape={(props) => {
                      const { cx, cy, payload } = props as {
                        cx?: number;
                        cy?: number;
                        payload?: HeatPoint;
                      };

                      if (cx === undefined || cy === undefined || !payload) {
                        return null;
                      }

                      const size = 14;
                      const fill = getHeatColor(payload.value, stats.min, stats.max);

                      return (
                        <rect
                          x={cx - size / 2}
                          y={cy - size / 2}
                          width={size}
                          height={size}
                          rx={4}
                          ry={4}
                          fill={fill}
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth={0.6}
                        />
                      );
                    }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </ChartWrapper>
        ) : (
          <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-sm text-[var(--muted)]">
            <p>No hay datos de heatmap para esta estacion.</p>
            <p className="text-xs">Selecciona otra estacion para comparar.</p>
          </div>
        )}
      </div>
    </section>
  );
}
