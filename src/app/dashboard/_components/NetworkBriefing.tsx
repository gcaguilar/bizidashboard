import { TrackedLink } from '@/app/_components/TrackedLink';
import { Badge } from '@/components/ui/badge';
import type { BadgeVariant } from '@/components/ui/badge';
import type { NetworkBriefing as NetworkBriefingModel } from '@/lib/network-briefing';
import type { NetworkHealthLevel } from '@/lib/network-health';
import { appRoutes } from '@/lib/routes';
import { buildObservatoryEvent } from '@/lib/umami';

const HEALTH_BADGE_VARIANTS: Record<NetworkHealthLevel, BadgeVariant> = {
  green: 'success',
  yellow: 'warning',
  red: 'danger',
  unknown: 'muted',
};

type NetworkBriefingProps = {
  briefing?: NetworkBriefingModel | null;
  state?: 'ready' | 'loading' | 'incomplete' | 'error';
  className?: string;
};

export function NetworkBriefing({ briefing, state = 'ready', className = '' }: NetworkBriefingProps) {
  if (state === 'loading') {
    return <section aria-live="polite" className={`ui-section-card ${className}`}>Cargando el resumen de la red…</section>;
  }

  if (state === 'error') {
    return (
      <section role="alert" className={`ui-section-card ${className}`}>
        No se pudo preparar el resumen con los datos actuales. <TrackedLink href={appRoutes.status()} className="ui-inline-action">Ver estado de los datos</TrackedLink>
      </section>
    );
  }

  if (!briefing || state === 'incomplete' || briefing.state === 'insufficient') {
    return (
      <section className={`ui-section-card ${className}`}>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Resumen de la red</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-black text-[var(--foreground)]">Aún no hay datos suficientes para resumir la red</h2>
          {briefing && briefing.health.level === 'unknown' ? <Badge variant="muted">{briefing.health.label}</Badge> : null}
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">{briefing?.warning ?? 'Esperando más actualizaciones para poder comparar con confianza.'}</p>
        <TrackedLink href={appRoutes.status()} className="ui-inline-action mt-3">Ver cobertura y actualización</TrackedLink>
      </section>
    );
  }

  return (
    <section className={`ui-section-card ${className}`} aria-labelledby="network-briefing-title">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Resumen de la red</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <h2 id="network-briefing-title" className="text-xl font-black text-[var(--foreground)]">Lectura de la red hoy</h2>
        <Badge variant={HEALTH_BADGE_VARIANTS[briefing.health.level]}>{briefing.health.label}</Badge>
      </div>
      <p className="mt-2 text-base font-semibold text-[var(--foreground)]">{briefing.current}</p>
      <div className="mt-3 space-y-1 text-sm text-[var(--muted)]">
        <p>{briefing.comparison}</p>
        <p>{briefing.focus}</p>
        <p>{briefing.alerts}</p>
        <p>{briefing.dataQuality}</p>
      </div>
      {briefing.warning ? <p className="mt-3 text-xs text-[var(--warning)]">{briefing.warning}</p> : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <TrackedLink href={appRoutes.dashboardAlerts()} className="ui-inline-action">Ver alertas</TrackedLink>
        <TrackedLink href={appRoutes.compare()} className="ui-inline-action">Ver comparativa</TrackedLink>
        <TrackedLink href={appRoutes.methodology()} trackingEvent={buildObservatoryEvent('observatory_evidence_opened', { surface: 'public', routeKey: 'observatory_briefing', source: 'network_briefing' })} className="ui-inline-action">Cómo se interpreta</TrackedLink>
      </div>
    </section>
  );
}
