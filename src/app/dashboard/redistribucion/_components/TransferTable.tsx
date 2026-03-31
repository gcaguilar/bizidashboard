'use client';

import type { TransferRecommendation } from '@/types/rebalancing';

type Props = { transfers: TransferRecommendation[] };

export function TransferTable({ transfers }: Props) {
  if (transfers.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
        No hay transferencias sugeridas en este momento. Las estaciones están dentro de banda o se autocorrigen.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transfers.map((t, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            {/* Transfer arrow */}
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-orange-600 dark:text-orange-400">{t.originStationName}</span>
              <span className="text-[var(--muted)]">→</span>
              <span className="text-sky-600 dark:text-sky-400">{t.destinationStationName}</span>
            </div>

            {/* Bikes to move */}
            <div className="rounded-full bg-[var(--accent)] px-3 py-1 text-sm font-bold text-white">
              {t.bikesToMove} bicis
            </div>
          </div>

          {/* Time window */}
          <p className="mt-2 text-xs text-[var(--muted)]">
            Ventana horaria: <strong>{t.timeWindow.start}–{t.timeWindow.end}</strong> ·{' '}
            Confianza: {Math.round(t.confidence * 100)}%
          </p>

          {/* Impact */}
          <div className="mt-3 flex flex-wrap gap-4 text-xs">
            <div>
              <span className="text-[var(--muted)]">Vaciados evitados </span>
              <strong className="text-green-600 dark:text-green-400">
                {t.expectedImpact.emptiesAvoided.toFixed(1)}h
              </strong>
            </div>
            <div>
              <span className="text-[var(--muted)]">Llenos evitados </span>
              <strong className="text-green-600 dark:text-green-400">
                {t.expectedImpact.fullsAvoided.toFixed(1)}h
              </strong>
            </div>
            <div>
              <span className="text-[var(--muted)]">Usos recuperados </span>
              <strong className="text-sky-600 dark:text-sky-400">
                ~{t.expectedImpact.usesRecovered.toFixed(0)}
              </strong>
            </div>
            <div>
              <span className="text-[var(--muted)]">Score logístico </span>
              <strong>{Math.round(t.expectedImpact.costScore * 100)}%</strong>
            </div>
          </div>

          {/* Reasons */}
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-[var(--accent)]">
              Por qué se recomienda esta transferencia
            </summary>
            <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
              {t.reasons.map((r, j) => (
                <li key={j} className="flex gap-1">
                  <span className="shrink-0 text-[var(--accent)]">›</span>
                  {r}
                </li>
              ))}
            </ul>
          </details>
        </div>
      ))}
    </div>
  );
}
