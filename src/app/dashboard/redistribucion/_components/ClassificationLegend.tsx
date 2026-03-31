'use client';

import type { StationClassification } from '@/types/rebalancing';

const CLASSIFICATIONS: Array<{
  code: StationClassification;
  label: string;
  color: string;
  bg: string;
  description: string;
}> = [
  {
    code: 'overstock',
    label: 'A — Sobrestock',
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
    description: 'Ocupacion alta sostenida, baja rotación e inmóvil. Bicis "paradas". Candidata a donar.',
  },
  {
    code: 'deficit',
    label: 'B — Déficit',
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    description: 'Ocupacion baja crónica, alta presión de salida. Necesita más stock base.',
  },
  {
    code: 'peak_saturation',
    label: 'C — Saturación puntual',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    description: 'Solo se llena en franjas concretas. Fuera de esas horas, vuelve a la normalidad.',
  },
  {
    code: 'peak_emptying',
    label: 'D — Vaciado puntual',
    color: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
    description: 'Solo se vacía en hora punta. Se recupera después sin intervención.',
  },
  {
    code: 'balanced',
    label: 'E — Equilibrada',
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
    description: 'Fluctúa dentro de banda objetivo. No requiere intervención activa.',
  },
  {
    code: 'data_review',
    label: 'F — Revisar dato',
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700',
    description: 'Dato anómalo o sensor sospechoso. Excluida de decisiones logísticas hasta validar.',
  },
];

export function ClassificationLegend() {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
        Clasificación de estaciones
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {CLASSIFICATIONS.map((c) => (
          <div
            key={c.code}
            className={`rounded-lg border p-3 text-sm ${c.bg}`}
          >
            <p className={`font-semibold ${c.color}`}>{c.label}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{c.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
