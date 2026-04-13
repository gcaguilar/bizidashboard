'use client';

import { Fragment, useState, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import type { StationDiagnostic, StationClassification, ActionGroup, Urgency } from '@/types/rebalancing';

type Props = {
  diagnostics: StationDiagnostic[];
};

// ─── Style helpers ────────────────────────────────────────────────────────────

const CLASSIFICATION_STYLE: Record<StationClassification, string> = {
  overstock: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  deficit: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  peak_saturation: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  peak_emptying: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  balanced: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  data_review: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400',
};

const CLASSIFICATION_LABEL: Record<StationClassification, string> = {
  overstock: 'A Sobrestock',
  deficit: 'B Déficit',
  peak_saturation: 'C Sat. punta',
  peak_emptying: 'D Vaciado punta',
  balanced: 'E Equilibrada',
  data_review: 'F Revisar dato',
};

const ACTION_LABEL: Record<ActionGroup, string> = {
  donor: 'Donar',
  receptor: 'Recibir',
  peak_remove: 'Retirar (prev.)',
  peak_fill: 'Reponer (prev.)',
  stable: 'No actuar',
  review: 'Revisar',
};

const URGENCY_STYLE: Record<Urgency, string> = {
  critical: 'text-rose-600 dark:text-rose-400 font-bold',
  high: 'text-red-600 dark:text-red-400 font-semibold',
  medium: 'text-amber-600 dark:text-amber-400',
  low: 'text-slate-500',
  none: 'text-slate-400',
};

const URGENCY_LABEL: Record<Urgency, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
  none: '—',
};

// ─── Occupancy bar ────────────────────────────────────────────────────────────

function OccupancyBar({
  occupancy,
  bandMin,
  bandMax,
}: {
  occupancy: number;
  bandMin: number;
  bandMax: number;
}) {
  const pct = Math.round(occupancy * 100);
  const inBand = occupancy >= bandMin && occupancy <= bandMax;
  const barColor = inBand
    ? 'bg-green-500'
    : occupancy < bandMin
    ? 'bg-red-500'
    : 'bg-orange-500';

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-2 w-20 rounded-full bg-[var(--border)]">
        <div
          className="absolute top-0 h-full rounded-full bg-green-200 dark:bg-green-900/50"
          style={{ left: `${bandMin * 100}%`, width: `${(bandMax - bandMin) * 100}%` }}
        />
        <div
          className={`absolute top-0 h-full w-1 rounded-full ${barColor}`}
          style={{ left: `${Math.min(99, pct)}%` }}
        />
      </div>
      <span className="tabular-nums text-xs">{pct}%</span>
    </div>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────

const columns: ColumnDef<StationDiagnostic>[] = [
  {
    accessorKey: 'stationName',
    header: 'Estación',
    cell: ({ row }) => (
      <>
        <p className="font-medium text-[var(--foreground)]">{row.original.stationName}</p>
        <p className="text-xs text-[var(--muted)]">#{row.original.stationId}</p>
      </>
    ),
  },
  {
    accessorKey: 'districtName',
    header: 'Barrio',
    cell: ({ getValue }) => <span className="text-xs text-[var(--muted)]">{getValue<string>() ?? '—'}</span>,
  },
  {
    id: 'inferredType',
    header: 'Tipo',
    cell: ({ row }) => (
      <span className="text-xs text-[var(--muted)] capitalize">{row.original.inferredType}</span>
    ),
  },
  {
    accessorKey: 'classification',
    header: 'Clasificación',
    cell: ({ getValue }) => {
      const value = getValue<StationClassification>();
      return (
        <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${CLASSIFICATION_STYLE[value]}`}>
          {CLASSIFICATION_LABEL[value]}
        </span>
      );
    },
  },
  {
    accessorKey: 'currentOccupancy',
    header: 'Ocupación / Banda',
    cell: ({ row }) => (
      <OccupancyBar
        occupancy={row.original.currentOccupancy}
        bandMin={row.original.targetBand.min}
        bandMax={row.original.targetBand.max}
      />
    ),
  },
  {
    accessorKey: 'actionGroup',
    header: 'Acción',
    cell: ({ getValue }) => (
      <span className="text-xs font-medium text-[var(--foreground)]">
        {ACTION_LABEL[getValue<ActionGroup>()]}
      </span>
    ),
  },
  {
    accessorKey: 'urgency',
    header: 'Urgencia',
    cell: ({ getValue }) => {
      const value = getValue<Urgency>();
      return <span className={`text-xs ${URGENCY_STYLE[value]}`}>{URGENCY_LABEL[value]}</span>;
    },
  },
  {
    accessorKey: 'priorityScore',
    header: 'Score',
    cell: ({ getValue }) => (
      <span className="text-xs tabular-nums text-[var(--muted)]">
        {(getValue<number>() * 100).toFixed(0)}
      </span>
    ),
  },
  {
    id: 'expand',
    header: '',
    cell: () => <span className="text-xs text-[var(--muted)]" />,
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function RebalancingTable({ diagnostics }: Props) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'priorityScore', desc: true }]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = useCallback((stationId: string) => {
    setExpandedId((id) => (id === stationId ? null : stationId));
  }, []);

  const table = useReactTable({
    data: diagnostics,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.stationId,
  });

  const sortedData = table.getSortedRowModel().rows;

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead className="border-b border-[var(--border)] bg-[var(--surface)]">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder
                    ? null
                    : typeof header.column.columnDef.header === 'function'
                    ? header.column.columnDef.header(header.getContext())
                    : header.column.columnDef.header}
                  {{
                    asc: ' ↑',
                    desc: ' ↓',
                  }[header.column.getIsSorted() as string] ?? null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {sortedData.map((row) => {
            const isExpanded = expandedId === row.original.stationId;
            const diagnostic = row.original;
            return (
              <Fragment key={row.id}>
                <tr
                  className="cursor-pointer bg-[var(--surface)] transition-colors hover:bg-[var(--surface-hover,var(--surface))]"
                  onClick={() => handleToggle(diagnostic.stationId)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const colId = cell.column.id;
                    if (colId === 'expand') {
                      return (
                        <td key={colId} className="px-3 py-2.5 text-xs text-[var(--muted)]">
                          {isExpanded ? '▲' : '▼'}
                        </td>
                      );
                    }
                    return (
                      <td key={colId} className="px-3 py-2.5">
                        {typeof cell.column.columnDef.cell === 'function'
                          ? cell.column.columnDef.cell(cell.getContext())
                          : null}
                      </td>
                    );
                  })}
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={9} className="border-b border-[var(--border)] bg-[var(--surface-secondary,var(--surface))] px-4 pb-4 pt-2">
                      <div className="grid gap-4 text-xs sm:grid-cols-2">
                        <div>
                          <p className="mb-1 font-semibold text-[var(--foreground)]">Razones de clasificación</p>
                          <ul className="space-y-1 text-[var(--muted)]">
                            {diagnostic.classificationReasons.map((r, i) => (
                              <li key={i} className="flex gap-1">
                                <span className="shrink-0 text-[var(--accent)]">›</span>
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="mb-1 font-semibold text-[var(--foreground)]">Razones de acción</p>
                          <ul className="space-y-1 text-[var(--muted)]">
                            {diagnostic.actionReasons.map((r, i) => (
                              <li key={i} className="flex gap-1">
                                <span className="shrink-0 text-[var(--accent)]">›</span>
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="mb-1 font-semibold text-[var(--foreground)]">Predicción</p>
                          <p className="text-[var(--muted)]">
                            Riesgo vacío 1h: <strong>{Math.round(diagnostic.risk.riskEmptyAt1h * 100)}%</strong>{' '}
                            · Riesgo lleno 1h: <strong>{Math.round(diagnostic.risk.riskFullAt1h * 100)}%</strong>{' '}
                            · Autocorrección:{' '}
                            <strong>{Math.round(diagnostic.risk.selfCorrectionProbability * 100)}%</strong>
                            {diagnostic.risk.estimatedRecoveryMinutes !== null &&
                              ` · Recuperación: ~${diagnostic.risk.estimatedRecoveryMinutes} min`}
                          </p>
                        </div>
                        <div>
                          <p className="mb-1 font-semibold text-[var(--foreground)]">Red cercana</p>
                          <p className="text-[var(--muted)]">
                            {diagnostic.network.nearbyStations.length} estaciones en radio 500m · Ajuste urgencia:{' '}
                            {Math.round(diagnostic.network.urgencyAdjustment * 100)}%
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      {sortedData.length === 0 && (
        <p className="py-8 text-center text-sm text-[var(--muted)]">
          No hay estaciones que mostrar con los filtros actuales.
        </p>
      )}
    </div>
  );
}