import { TrackedLink } from '@/app/_components/TrackedLink';
import { appRoutes } from '@/lib/routes';
import { buildObservatoryEvent } from '@/lib/umami';

export function MetricEvidence({ type, coverage, window, limitation }: { type: 'observado' | 'estimado' | 'predicción'; coverage: string; window: string; limitation?: string }) {
  return <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]"><span className="font-semibold text-[var(--foreground)]">{type[0].toUpperCase()}{type.slice(1)}.</span> Cobertura: {coverage}. Ventana: {window}. {limitation ? `${limitation} ` : ''}<TrackedLink href={appRoutes.methodology()} trackingEvent={buildObservatoryEvent('observatory_evidence_opened', { surface: 'public', routeKey: 'metric_evidence', source: 'metric_evidence' })} className="underline underline-offset-2 hover:text-[var(--foreground)]">Metodología</TrackedLink></p>;
}
