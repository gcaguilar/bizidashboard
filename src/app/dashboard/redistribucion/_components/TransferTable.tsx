'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { TransferRecommendation } from '@/types/rebalancing';

type Props = { transfers: TransferRecommendation[] };

export function TransferTable({ transfers }: Props) {
  if (transfers.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-[var(--muted)]">
        No hay transferencias sugeridas en este momento. Las estaciones están dentro de banda o se autocorrigen.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transfers.map((t, i) => (
        <Card
          key={i}
          className="p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            {/* Transfer arrow */}
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-orange-600 dark:text-orange-400">{t.originStationName}</span>
              <span className="text-[var(--muted)]">→</span>
              <span className="text-sky-600 dark:text-sky-400">{t.destinationStationName}</span>
            </div>

            {/* Bikes to move */}
            <Badge className="rounded-full bg-[var(--accent)] px-3 py-1 text-sm font-bold normal-case tracking-normal text-white">
              {t.bikesToMove} bicis
            </Badge>
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
          <Accordion className="mt-3">
            <AccordionItem value={`transfer-reasons-${i}`}>
              <AccordionTrigger className="px-0 py-0 text-xs text-[var(--accent)]">
                Por qué se recomienda esta transferencia
              </AccordionTrigger>
              <AccordionContent className="mt-2 border-t-0 px-0 py-0">
                <ul className="space-y-1 text-xs text-[var(--muted)]">
                  {t.reasons.map((r, j) => (
                    <li key={j} className="flex gap-1">
                      <span className="shrink-0 text-[var(--accent)]">›</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      ))}
    </div>
  );
}
