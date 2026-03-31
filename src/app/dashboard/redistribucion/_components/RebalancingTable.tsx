'use client';

import { useState } from 'react';
import type { StationDiagnostic, StationClassification, ActionGroup, Urgency } from '@/types/rebalancing';

type SortKey =
  | 'stationName'
  | 'districtName'
  | 'classification'
  | 'actionGroup'
  | 'urgency'
  | 'currentOccupancy'
  | 'priorityScore';

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
        {/* Band range indicator */}
        <div
          className="absolute top-0 h-full rounded-full bg-green-200 dark:bg-green-900/50"
          style={{ left: `${bandMin * 100}%`, width: `${(bandMax - bandMin) * 100}%` }}
        />
        {/* Current value */}
        <div
          className={`absolute top-0 h-full w-1 rounded-full ${barColor}`}
          style={{ left: `${Math.min(99, pct)}%` }}
        />
      </div>
      <span className="tabular-nums text-xs">{pct}%</span>
    </div>
  );
}

// ─── Expandable row detail ────────────────────────────────────────────────────

function RowDetail({ diagnostic }: { diagnostic: StationDiagnostic }) {
  return (
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
              Riesgo vacío 1h: <strong>{Math.round(diagnostic.risk.riskEmptyAt1h * 100)}%</strong> ·{' '}
              Riesgo lleno 1h: <strong>{Math.round(diagnostic.risk.riskFullAt1h * 100)}%</strong> ·{' '}
              Autocorrección: <strong>{Math.round(diagnostic.risk.selfCorrectionProbability * 100)}%</strong>
              {diagnostic.risk.estimatedRecoveryMinutes !== null &&
                ` · Recuperación: ~${diagnostic.risk.estimatedRecoveryMinutes} min`}
            </p>
          </div>
          <div>
            <p className="mb-1 font-semibold text-[var(--foreground)]">Red cercana</p>
            <p className="text-[var(--muted)]">
              {diagnostic.network.nearbyStations.length} estaciones en radio 500m ·{' '}
              Ajuste urgencia: {Math.round(diagnostic.network.urgencyAdjustment * 100)}%
            </p>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RebalancingTable({ diagnostics }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('priorityScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = [...diagnostics].sort((a, b) => {
    const aVal = a[sortKey] ?? '';
    const bVal = b[sortKey] ?? '';
    const cmp = typeof aVal === 'string'
      ? aVal.localeCompare(String(bVal), 'es')
      : Number(aVal) - Number(bVal);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function SortHeader({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k;
    return (
      <th
        className="cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
        onClick={() => handleSort(k)}
      >
        {label}
        {active && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </th>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead className="border-b border-[var(--border)] bg-[var(--surface)]">
          <tr>
            <SortHeader label="Estación" k="stationName" />
            <SortHeader label="Barrio" k="districtName" />
            <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted)]">Tipo</th>
            <SortHeader label="Clasificación" k="classification" />
            <SortHeader label="Ocupación / Banda" k="currentOccupancy" />
            <SortHeader label="Acción" k="actionGroup" />
            <SortHeader label="Urgencia" k="urgency" />
            <SortHeader label="Score" k="priorityScore" />
            <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted)]" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {sorted.map((d) => {
            const isExpanded = expandedId === d.stationId;
            return (
              <>
                <tr
                  key={d.stationId}
                  className="cursor-pointer bg-[var(--surface)] transition-colors hover:bg-[var(--surface-hover,var(--surface))]"
                  onClick={() => setExpandedId(isExpanded ? null : d.stationId)}
                >
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-[var(--foreground)]">{d.stationName}</p>
                    <p className="text-xs text-[var(--muted)]">#{d.stationId}</p>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-[var(--muted)]">
                    {d.districtName ?? '—'}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-[var(--muted)] capitalize">
                    {d.inferredType}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${CLASSIFICATION_STYLE[d.classification]}`}
                    >
                      {CLASSIFICATION_LABEL[d.classification]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <OccupancyBar
                      occupancy={d.currentOccupancy}
                      bandMin={d.targetBand.min}
                      bandMax={d.targetBand.max}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-xs font-medium text-[var(--foreground)]">
                    {ACTION_LABEL[d.actionGroup]}
                  </td>
                  <td className={`px-3 py-2.5 text-xs ${URGENCY_STYLE[d.urgency]}`}>
                    {URGENCY_LABEL[d.urgency]}
                  </td>
                  <td className="px-3 py-2.5 text-xs tabular-nums text-[var(--muted)]">
                    {(d.priorityScore * 100).toFixed(0)}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-[var(--muted)]">
                    {isExpanded ? '▲' : '▼'}
                  </td>
                </tr>
                {isExpanded && <RowDetail key={`${d.stationId}-detail`} diagnostic={d} />}
              </>
            );
          })}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <p className="py-8 text-center text-sm text-[var(--muted)]">
          No hay estaciones que mostrar con los filtros actuales.
        </p>
      )}
    </div>
  );
}
