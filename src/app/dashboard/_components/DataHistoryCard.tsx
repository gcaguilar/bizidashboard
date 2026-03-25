'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatPercent } from '@/lib/format';
import { appRoutes } from '@/lib/routes';
import { ChartWrapper } from './ChartWrapper';

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

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(appRoutes.api.history(), { signal: controller.signal });

        if (!response.ok) {
          throw new Error('No se pudo cargar el historico agregado.');
        }

        const payload = (await response.json()) as HistoryResponse;
        if (!isActive) {
          return;
        }

        setRows(Array.isArray(payload.history) ? payload.history.slice(-30) : []);
      } catch (fetchError) {
        if ((fetchError as Error).name === 'AbortError') {
          return;
        }

        if (isActive) {
          setError('No se pudo cargar el historico de balance.');
          setRows([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const chartData = useMemo(
    () => rows.map((row) => ({ ...row, label: formatDayLabel(row.day) })),
    [rows]
  );

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
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href={appRoutes.api.historyCsv()} className="font-semibold text-[var(--accent)] underline-offset-2 hover:underline" rel="noopener noreferrer">
              Descargar CSV
            </a>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4 h-[280px] animate-pulse rounded-xl bg-[var(--surface-soft)]" />
      ) : error ? (
        <p className="mt-4 text-sm text-[var(--muted)]">{error}</p>
      ) : chartData.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">Sin historico suficiente todavia.</p>
      ) : (
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
          <ChartWrapper height="h-[280px]">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
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
              </ResponsiveContainer>
            </div>
          </ChartWrapper>
          <p className="mt-3 text-[11px] text-[var(--muted)]">
            Balance index cerca de 1 significa una red mas equilibrada. Cerca de 0 indica muchas estaciones alejadas del 50% de ocupacion.
          </p>
        </div>
      )}
    </section>
  );
}
