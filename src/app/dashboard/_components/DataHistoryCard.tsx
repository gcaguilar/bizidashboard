'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { DataStateNotice } from '@/app/_components/DataStateNotice';
import { resolveDataState, shouldShowDataStateNotice, type DataState } from '@/lib/data-state';
import { formatPercent } from '@/lib/format';
import { appRoutes } from '@/lib/routes';
import { ChartWrapper } from './ChartWrapper';
import { MeasuredResponsiveContainer } from './MeasuredResponsiveContainer';
import { fetchJson, useAbortableAsyncEffect } from './useAbortableAsyncEffect';

type HistoryRow = {
  day: string;
  demandScore: number;
  avgOccupancy: number;
  balanceIndex: number;
  sampleCount: number;
};

type HistoryResponse = {
  history?: HistoryRow[];
  generatedAt?: string;
  dataState?: DataState;
};

function formatDayLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

export function DataHistoryCard() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responseState, setResponseState] = useState<DataState | null>(null);

  useAbortableAsyncEffect(
    async (signal, isActive) => {
      try {
        const payload = await fetchJson<HistoryResponse>(appRoutes.api.history(), {
          signal,
          errorMessage: 'No se pudo cargar el historico agregado.',
        });

        if (!isActive()) {
          return;
        }

        setRows(Array.isArray(payload.history) ? payload.history.slice(-30) : []);
        setResponseState(payload.dataState ?? null);
      } catch {
        if (!isActive()) {
          return;
        }

        setError('No se pudo cargar el historico de balance.');
        setRows([]);
        setResponseState('error');
      }
    },
    [],
    {
      onStart: () => {
        setIsLoading(true);
        setError(null);
        setResponseState(null);
      },
      onSettled: () => {
        setIsLoading(false);
      },
    }
  );

  const chartData = useMemo(
    () => rows.map((row) => ({ ...row, label: formatDayLabel(row.day) })),
    [rows]
  );
  const historyDataState = resolveDataState({
    isLoading,
    error: error ?? (responseState === 'error' ? 'error' : null),
    hasCoverage: responseState === 'no_coverage' ? false : rows.length > 0,
    hasData: chartData.length > 0,
    isPartial: responseState === 'partial',
    isStale: responseState === 'stale',
  });
  const showChart = historyDataState === 'ok' || historyDataState === 'partial' || historyDataState === 'stale';

  return (
    <section className="dashboard-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[var(--foreground)]">Historico de equilibrio y demanda</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Compara como cambia el balance del sistema junto con la demanda agregada reciente.
          </p>
        </div>
        <div className="text-right text-xs text-[var(--muted)]">
          <div>
            <Link href={appRoutes.dashboardHelp('balance-index')} className="font-semibold text-[var(--accent)] underline-offset-2 hover:underline">
              Entender balance
            </Link>
          </div>
          <div>
            <a href={appRoutes.api.historyCsv()} className="font-semibold text-[var(--accent)] underline-offset-2 hover:underline" rel="noopener noreferrer">
              Descargar CSV
            </a>
          </div>
        </div>
      </div>

      {shouldShowDataStateNotice(historyDataState) ? (
        <DataStateNotice
          state={historyDataState}
          subject="el historico agregado"
          description={
            error ??
            (isLoading
              ? 'Estamos cargando la serie agregada de balance y demanda.'
              : historyDataState === 'partial'
                ? 'La serie historica existe, pero no cubre toda la ventana ideal todavia.'
                : historyDataState === 'stale'
                  ? 'La serie historica esta disponible, pero el dataset no esta fresco.'
                  : 'Todavia no hay historico suficiente para pintar esta serie.')
          }
          href={appRoutes.status()}
          actionLabel="Ver estado"
          className="mt-4"
          compact
        />
      ) : null}

      {showChart ? (
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
          <ChartWrapper height="h-[280px]">
            <div className="h-[280px]">
              <MeasuredResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={12} />
                  <YAxis yAxisId="demand" tick={{ fontSize: 11 }} width={46} />
                  <YAxis
                    yAxisId="balance"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    width={42}
                    tickFormatter={(value) => formatPercent(Number(value))}
                  />
                  <Tooltip
                    formatter={(value, name) =>
                      name === 'Balance index'
                        ? [formatPercent(Number(value)), 'Balance index']
                        : [Number(value).toFixed(1), 'Demanda']
                    }
                  />
                  <Area yAxisId="demand" type="monotone" dataKey="demandScore" name="Demanda" stroke="#ea0615" fill="rgba(234, 6, 21, 0.2)" strokeWidth={2} />
                  <Area yAxisId="balance" type="monotone" dataKey="balanceIndex" name="Balance index" stroke="#0f766e" fill="rgba(15, 118, 110, 0.16)" strokeWidth={2} />
                </AreaChart>
              </MeasuredResponsiveContainer>
            </div>
          </ChartWrapper>
          <p className="mt-3 text-[11px] text-[var(--muted)]">
            Balance index cerca de 1 significa una red mas equilibrada. Cerca de 0 indica muchas estaciones alejadas del 50% de ocupacion.
          </p>
        </div>
      ) : null}
    </section>
  );
}
