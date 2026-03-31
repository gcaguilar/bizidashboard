'use client';

import type { ReportSummary } from '@/types/rebalancing';

type Props = { summary: ReportSummary };

type CardConfig = {
  label: string;
  value: number;
  color: string;
  description: string;
};

export function RebalancingSummaryCards({ summary }: Props) {
  const cards: CardConfig[] = [
    {
      label: 'Donantes',
      value: (summary.byAction.donor ?? 0) + (summary.byAction.peak_remove ?? 0),
      color: 'text-orange-600 dark:text-orange-400',
      description: 'tienen exceso de bicis',
    },
    {
      label: 'Receptoras',
      value: (summary.byAction.receptor ?? 0) + (summary.byAction.peak_fill ?? 0),
      color: 'text-red-600 dark:text-red-400',
      description: 'necesitan bicis',
    },
    {
      label: 'Urgencia alta',
      value: summary.criticalUrgencyCount + summary.highUrgencyCount,
      color: 'text-rose-600 dark:text-rose-400',
      description: 'requieren atención prioritaria',
    },
    {
      label: 'Transferencias',
      value: summary.stationsWithTransfer,
      color: 'text-sky-600 dark:text-sky-400',
      description: 'movimientos sugeridos',
    },
    {
      label: 'Equilibradas',
      value: summary.byAction.stable ?? 0,
      color: 'text-green-600 dark:text-green-400',
      description: 'sin intervención necesaria',
    },
    {
      label: 'A revisar',
      value: summary.byAction.review ?? 0,
      color: 'text-slate-500 dark:text-slate-400',
      description: 'dato anómalo, excluidas',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
        >
          <p className={`text-3xl font-black tabular-nums ${card.color}`}>{card.value}</p>
          <p className="mt-1 text-xs font-semibold text-[var(--foreground)]">{card.label}</p>
          <p className="text-xs text-[var(--muted)]">{card.description}</p>
        </div>
      ))}
    </div>
  );
}
