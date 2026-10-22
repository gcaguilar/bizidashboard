'use client';

import { useMemo } from 'react';
import { TrackedLink } from '@/app/_components/TrackedLink';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatPercent } from '@/lib/format';
import { appRoutes } from '@/lib/routes';
import { WidgetEmptyState } from './WidgetEmptyState';
import { ChartWrapper } from './ChartWrapper';
import { MeasuredResponsiveContainer } from './MeasuredResponsiveContainer';

type SystemHourlyProfileRow = {
  hour: number;
  avgOccupancy: number;
  avgBikesAvailable: number;
  sampleCount: number;
};

type SystemIntradayCardProps = {
  rows: SystemHourlyProfileRow[];
  windowLabel: string;
};

type TooltipProps = {
  active?: boolean;
  label?: string;
  payload?: Array<{
    name?: string;
    value?: number | null;
    color?: string;
  }>;
};

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

function SystemTooltip({ active, label, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs shadow-[var(--shadow-soft)]">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Hora {label}</p>
      <div className="mt-1 space-y-1">
        {payload.map((row) => (
          <div key={row.name} className="flex items-center justify-between gap-4">
            <span className="text-[var(--muted)]">{row.name}</span>
            <span className="font-semibold text-[var(--foreground)]">
              {row.name === 'Ocupación media'
                ? formatPercent(row.value ?? 0)
                : `${Number(row.value ?? 0).toFixed(1)} bicis`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SystemIntradayCard({ rows, windowLabel }: SystemIntradayCardProps) {
  const chartData = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        hourLabel: formatHour(row.hour),
      })),
    [rows]
  );

  return (
    <section className="ui-section-card h-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-[var(--foreground)]">
            Evolución del sistema durante el día
          </h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Media por hora de ocupación y bicis disponibles para la ventana {windowLabel.toLowerCase()}.
          </p>
        </div>
        <TrackedLink href={appRoutes.dashboardHelp('demanda-no-viajes-reales')}
          className="text-xs font-semibold text-[var(--primary)] underline-offset-2 hover:underline"
        >
          Cómo se calcula
        </TrackedLink>
      </div>

      {chartData.length === 0 ? (
        <WidgetEmptyState
          title="Sin perfil horario suficiente"
          description="Todavía no hay suficiente histórico por hora para resumir cómo cambia la ocupación y las bicis durante el día."
          helpHref={appRoutes.dashboardHelp('demanda-no-viajes-reales')}
        />
      ) : (
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-3">
          <ChartWrapper height="h-[280px]">
            <div className="h-[280px]">
              <MeasuredResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="hourLabel" tick={{ fontSize: 11 }} minTickGap={12} />
                  <YAxis
                    yAxisId="occupancy"
                    tick={{ fontSize: 11 }}
                    width={42}
                    tickFormatter={(value) => formatPercent(Number(value))}
                  />
                  <YAxis
                    yAxisId="bikes"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    width={42}
                  />
                  <Tooltip content={<SystemTooltip />} />
                  <Legend iconType="circle" />
                  <Area
                    yAxisId="occupancy"
                    type="monotone"
                    dataKey="avgOccupancy"
                    name="Ocupación media"
                    stroke="var(--primary)"
                    fill="color-mix(in srgb, var(--primary) 18%, transparent)"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="bikes"
                    type="monotone"
                    dataKey="avgBikesAvailable"
                    name="Bicis disponibles"
                    stroke="var(--success)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </MeasuredResponsiveContainer>
            </div>
          </ChartWrapper>
          <p className="mt-3 text-[11px] text-[var(--muted)]">
            La ocupación mide el porcentaje medio de bicis sobre capacidad. Bicis disponibles refleja la media de bicis ancladas por estación y hora, no un conteo único de viajes.
          </p>
        </div>
      )}
    </section>
  );
}
