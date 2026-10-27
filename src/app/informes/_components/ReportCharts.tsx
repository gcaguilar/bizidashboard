'use client';

import { useEffect, useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MeasuredResponsiveContainer } from '@/app/dashboard/_components/MeasuredResponsiveContainer';
import { ChartWrapper } from '@/app/dashboard/_components/ChartWrapper';
import { formatInteger, formatPercent } from '@/lib/format';
import { getHeatColor } from '@/lib/heatmap-color';
import { formatMonthLabel } from '@/lib/months';
import type { MonthlyReport, MonthlyReportTrends } from '@/lib/monthly-report';

type ReportChartsProps = {
  report: MonthlyReport;
};

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function shortMonthLabel(monthKey: string): string {
  if (monthKey.length < 7) {
    return monthKey;
  }

  return `${monthKey.slice(5, 7)}/${monthKey.slice(2, 4)}`;
}

function MonthlyTrendChart({ monthly }: { monthly: MonthlyReportTrends['monthly'] }) {
  const data = monthly.map((row) => ({
    label: shortMonthLabel(row.monthKey),
    fullLabel: formatMonthLabel(row.monthKey),
    demandScore: Math.round(row.demandScore),
    avgOccupancy: row.avgOccupancy,
  }));

  return (
    <ChartWrapper height="h-[260px]">
      <div className="h-[260px] w-full">
      <MeasuredResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(234, 6, 21, 0.16)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={8} />
          <YAxis tick={{ fontSize: 11 }} width={46} tickFormatter={(value) => formatInteger(Number(value))} />
          <Tooltip
            formatter={(value) => [formatInteger(Number(value)), 'Índice de actividad']}
            labelFormatter={(_label, payload) =>
              (payload?.[0]?.payload as { fullLabel?: string } | undefined)?.fullLabel ?? ''
            }
          />
          <Bar dataKey="demandScore" fill="var(--primary)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </MeasuredResponsiveContainer>
      </div>
    </ChartWrapper>
  );
}

function HourlyProfileChart({ hourly }: { hourly: MonthlyReportTrends['hourly'] }) {
  const byHour = new Map(hourly.map((row) => [row.hour, row]));

  const data = Array.from({ length: 24 }, (_, hour) => {
    const row = byHour.get(hour);
    return {
      hourLabel: `${String(hour).padStart(2, '0')}:00`,
      occupancy: row ? row.avgOccupancy : null,
    };
  });

  return (
    <ChartWrapper height="h-[260px]">
      <div className="h-[260px] w-full">
      <MeasuredResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(234, 6, 21, 0.16)" />
          <XAxis dataKey="hourLabel" tick={{ fontSize: 11 }} minTickGap={12} />
          <YAxis
            tick={{ fontSize: 11 }}
            width={40}
            domain={[0, 1]}
            tickFormatter={(value) => formatPercent(Number(value))}
          />
          <Tooltip formatter={(value) => [formatPercent(Number(value)), 'Ocupación media']} />
          <Line
            type="monotone"
            dataKey="occupancy"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </MeasuredResponsiveContainer>
      </div>
    </ChartWrapper>
  );
}

function NetworkHeatmapChart({ heatmap }: { heatmap: MonthlyReport['heatmap'] }) {
  const cellMap = useMemo(() => {
    const map = new Map<string, number>();

    for (const cell of heatmap) {
      map.set(`${cell.dayOfWeek}-${cell.hour}`, cell.occupancyAvg);
    }

    return map;
  }, [heatmap]);

  const stats = useMemo(() => {
    const values = heatmap.map((cell) => cell.occupancyAvg).filter((value) => Number.isFinite(value));

    if (values.length === 0) {
      return { min: 0, max: 0 };
    }

    return { min: Math.min(...values), max: Math.max(...values) };
  }, [heatmap]);

  const points = useMemo(
    () =>
      Array.from({ length: 7 }, (_, day) =>
        Array.from({ length: 24 }, (_, hour) => {
          const beyondSunday = day === 6 ? 0 : day + 1;
          const value = cellMap.get(`${beyondSunday}-${hour}`);

          return { day, hour, value: value ?? null };
        })
      ).flat(),
    [cellMap]
  );

  return (
    <ChartWrapper height="h-[300px]">
      <div className="h-[300px] w-full">
      <MeasuredResponsiveContainer>
        <ScatterChart margin={{ top: 16, right: 24, bottom: 20, left: 18 }}>
          <XAxis
            type="number"
            dataKey="hour"
            domain={[-0.5, 23.5]}
            ticks={[0, 4, 8, 12, 16, 20, 23]}
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
            tickFormatter={(value) => DAY_LABELS[value] ?? 'Día'}
            tick={{ fontSize: 11 }}
            tickMargin={8}
            width={48}
          />
          <Tooltip
            formatter={(value) => [value === null ? 'Sin datos' : formatPercent(Number(value)), 'Ocupación']}
            labelFormatter={() => ''}
          />
          <Scatter
            data={points}
            shape={(props) => {
              const { cx, cy, payload } = props as {
                cx?: number;
                cy?: number;
                payload?: { value: number | null };
              };

              if (cx === undefined || cy === undefined || !payload) {
                return null;
              }

              const size = 14;

              return (
                <rect
                  x={cx - size / 2}
                  y={cy - size / 2}
                  width={size}
                  height={size}
                  rx={4}
                  ry={4}
                  fill={getHeatColor(payload.value, stats.min, stats.max)}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={0.6}
                />
              );
            }}
          />
        </ScatterChart>
      </MeasuredResponsiveContainer>
      </div>
    </ChartWrapper>
  );
}

export function ReportCharts({ report }: ReportChartsProps) {
  const hasMonthly = report.trends.monthly.length > 0;
  const hasHourly = report.trends.hourly.length > 0;
  const hasHeatmap = report.heatmap.length > 0;

  // Avisa al render de PDF de que el chunk perezoso de graficos ya esta montado.
  // El flag cubre el caso en que el efecto del hijo corre antes que el listener
  // del padre; el evento cubre el montaje posterior.
  useEffect(() => {
    document.documentElement.dataset.reportChartsReady = 'true';
    window.dispatchEvent(new Event('report-charts-ready'));

    return () => {
      delete document.documentElement.dataset.reportChartsReady;
    };
  }, []);

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <article className="ui-section-card xl:col-span-2">
        <h2 className="text-xl font-black text-[var(--foreground)]">Evolución mes a mes</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Índice de actividad en los últimos meses. Ayuda a reconocer estacionalidad (curso escolar, verano, fiestas) y a comparar el mes con su entorno.
        </p>
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-3">
          {hasMonthly ? (
            <MonthlyTrendChart monthly={report.trends.monthly} />
          ) : (
            <p className="flex h-[260px] items-center justify-center text-sm text-[var(--muted)]">
              Todavía no hay serie mensual suficiente.
            </p>
          )}
        </div>
        {report.seasonality.ratioVsSeries !== null || report.seasonality.ratioVsPreviousYears !== null ? (
          <p className="mt-3 text-xs text-[var(--muted)]">{report.seasonality.label}</p>
        ) : null}
      </article>

      <article className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Uso por hora del día</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Ocupación media de la red en cada franja horaria durante este mes.
        </p>
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-3">
          {hasHourly ? (
            <HourlyProfileChart hourly={report.trends.hourly} />
          ) : (
            <p className="flex h-[260px] items-center justify-center text-sm text-[var(--muted)]">
              Sin histórico horario para este mes.
            </p>
          )}
        </div>
      </article>

      <article className="ui-section-card">
        <h2 className="text-xl font-black text-[var(--foreground)]">Mapa de calor de la red</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Ocupación media por día de la semana y hora. Cuanto más clara es la celda, mayor ocupación media (más tensión de la red).
        </p>
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-3">
          {hasHeatmap ? (
            <NetworkHeatmapChart heatmap={report.heatmap} />
          ) : (
            <p className="flex h-[300px] items-center justify-center text-sm text-[var(--muted)]">
              Sin datos suficientes para el mapa de calor.
            </p>
          )}
        </div>
      </article>
    </section>
  );
}
