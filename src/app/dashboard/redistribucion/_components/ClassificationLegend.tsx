'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
    color: 'text-[var(--warning)]',
    bg: 'bg-[var(--warning)]/10 border-[var(--warning)]/30',
    description: 'Ocupacion alta sostenida, baja rotación e inmóvil. Bicis "paradas". Candidata a donar.',
  },
  {
    code: 'deficit',
    label: 'B — Déficit',
    color: 'text-[var(--danger)]',
    bg: 'bg-[var(--danger)]/10 border-[var(--danger)]/30',
    description: 'Ocupacion baja crónica, alta presión de salida. Necesita más stock base.',
  },
  {
    code: 'peak_saturation',
    label: 'C — Saturación puntual',
    color: 'text-[var(--warning)]',
    bg: 'bg-[var(--warning)]/10 border-[var(--warning)]/30',
    description: 'Solo se llena en franjas concretas. Fuera de esas horas, vuelve a la normalidad.',
  },
  {
    code: 'peak_emptying',
    label: 'D — Vaciado puntual',
    color: 'text-[var(--warning)]',
    bg: 'bg-[var(--warning)]/10 border-[var(--warning)]/30',
    description: 'Solo se vacía en hora punta. Se recupera después sin intervención.',
  },
  {
    code: 'balanced',
    label: 'E — Equilibrada',
    color: 'text-[var(--success)]',
    bg: 'bg-[var(--success)]/10 border-[var(--success)]/30',
    description: 'Fluctúa dentro de banda objetivo. No requiere intervención activa.',
  },
  {
    code: 'data_review',
    label: 'F — Revisar dato',
    color: 'text-[var(--muted)]',
    bg: 'bg-[var(--muted)]/10 border-[var(--border)]',
    description: 'Dato anómalo o sensor sospechoso. Excluida de decisiones logísticas hasta validar.',
  },
];

export function ClassificationLegend() {
  return (
    <section>
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          Clasificación de estaciones
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {CLASSIFICATIONS.map((c) => (
            <Card
              key={c.code}
              variant="stat"
              className={`gap-2 rounded-lg border p-3 text-sm ${c.bg}`}
            >
              <Badge
                variant="muted"
                className={`w-fit border-transparent px-0 py-0 text-xs font-semibold normal-case tracking-normal ${c.color}`}
              >
                {c.label}
              </Badge>
              <p className="mt-1 text-xs text-[var(--muted)]">{c.description}</p>
            </Card>
          ))}
        </div>
      </Card>
    </section>
  );
}
