"use client";

import { useMemo } from 'react';
import type { StationPatternRow } from '@/lib/api';
import { DayType } from '@/analytics/types';
import { formatDayType, formatPercent } from '@/lib/format';
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type HourlyChartsProps = {
  stationId: string;
  stationName: string;
  patterns: StationPatternRow[];
  isRefreshing?: boolean;
};

type ChartPoint = {
  hour: number;
  hourLabel: string;
  weekday: number | null;
  weekend: number | null;
};

type TooltipProps = {
  active?: boolean;
  label?: string;
  payload?: Array<{
    name?: string;
    value?: number | null;
  }>;
};

const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) =>
  `${String(hour).padStart(2, '0')}:00`
);

function toNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function buildChartData(patterns: StationPatternRow[]): ChartPoint[] {
  const totals = new Map<string, { sum: number; count: number }>();

  patterns.forEach((row) => {
    const hour = Number(row.hour);
    if (!Number.isFinite(hour) || hour < 0 || hour > 23) {
      return;
    }

    const dayType = String(row.dayType);
    const key = `${dayType}-${hour}`;
    const entry = totals.get(key) ?? { sum: 0, count: 0 };
    entry.sum += toNumber(row.occupancyAvg);
    entry.count += 1;
    totals.set(key, entry);
  });

  return HOUR_LABELS.map((hourLabel, hour) => {
    const weekdayKey = `${DayType.WEEKDAY}-${hour}`;
    const weekendKey = `${DayType.WEEKEND}-${hour}`;
    const weekday = totals.get(weekdayKey);
    const weekend = totals.get(weekendKey);

    return {
      hour,
      hourLabel,
      weekday: weekday ? weekday.sum / weekday.count : null,
      weekend: weekend ? weekend.sum / weekend.count : null,
    };
  });
}

function HourlyTooltip({ active, label, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const rows = payload.filter((entry) => entry.value !== null);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs shadow-[var(--shadow)]">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
        Hora {label}
      </p>
      {rows.length === 0 ? (
        <p className="mt-1 text-[var(--muted)]">Sin datos para esta hora.</p>
      ) : (
        <div className="mt-1 space-y-1">
          {rows.map((row) => (
            <div key={row.name} className="flex items-center justify-between gap-4">
              <span className="text-[var(--muted)]">{row.name}</span>
              <span className="font-semibold text-[var(--foreground)]">
                {formatPercent(row.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HourlyCharts({
  stationId,
  stationName,
  patterns,
  isRefreshing,
}: HourlyChartsProps) {
  const chartData = useMemo(() => buildChartData(patterns), [patterns]);
  const weekdayLabel = formatDayType(DayType.WEEKDAY);
  const weekendLabel = formatDayType(DayType.WEEKEND);
  const hasData = patterns.length > 0;

  return (
    <section className="flex h-full flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Patrones por hora
        </h2>
        {isRefreshing ? (
          <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
            Actualizando
          </span>
        ) : null}
        <p className="w-full text-xs text-[var(--muted)]">
          Estacion {stationName} ({stationId || 'sin seleccion'})
        </p>
      </header>
      <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-4">
        {hasData ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="hourLabel"
                tick={{ fontSize: 11 }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                width={40}
                tickFormatter={(value) => formatPercent(value as number)}
              />
              <Tooltip content={<HourlyTooltip />} />
              <Legend iconType="circle" />
              <Line
                type="monotone"
                dataKey="weekday"
                name={weekdayLabel}
                stroke="#d97706"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="weekend"
                name={weekendLabel}
                stroke="#0f766e"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-sm text-[var(--muted)]">
            <p>No hay datos de patrones para esta estacion.</p>
            <p className="text-xs">Selecciona otra estacion para comparar.</p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-[var(--muted)]">
        <span>{patterns.length} filas de patrones cargadas.</span>
        <span>Comparativa por hora entre semana vs fin de semana.</span>
      </div>
    </section>
  );
}
