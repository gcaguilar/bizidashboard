import { TrackedLink } from '@/app/_components/TrackedLink';
import { MetricCard, MetricGrid } from '@/components/ui/metric-card';
import { formatHourMinute, formatInteger } from '@/lib/format';
import type { NetworkBriefing as NetworkBriefingModel } from '@/lib/network-briefing';
import type { NetworkHealth, NetworkHealthLevel } from '@/lib/network-health';
import { appRoutes } from '@/lib/routes';
import { buildObservatoryEvent } from '@/lib/umami';
import type { CriticalDistrictCount } from '@/server-functions/home';

const HEALTH_LEVEL_COLORS: Record<NetworkHealthLevel, string> = {
  green: 'var(--success)',
  yellow: 'var(--warning)',
  red: 'var(--danger)',
  unknown: 'var(--muted)',
};

type HomeStatusHeroProps = {
  briefing: NetworkBriefingModel;
  health: NetworkHealth;
  bikesAvailable: number;
  anchorsFreeTotal: number;
  activeStationsCount: number;
  criticalStationsCount: number;
  topCriticalDistricts: CriticalDistrictCount[];
  generatedAt: string;
  className?: string;
};

/** Une 2-3 nombres de barrio como lo haría una persona: "Centro, Delicias y Actur". */
function joinDistrictNames(names: string[]): string {
  if (names.length <= 1) {
    return names[0] ?? '';
  }

  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}

function buildCriticalStationsDetail(criticalStationsCount: number): string {
  return criticalStationsCount === 0 ? 'ninguna ahora mismo' : 'conviene revisarlas';
}

function buildDistrictSentence(topCriticalDistricts: CriticalDistrictCount[]): string {
  const names = topCriticalDistricts.map((district) => district.name);
  if (names.length === 0) {
    return 'Repartidas por toda la ciudad.';
  }

  return `Se concentra sobre todo en ${joinDistrictNames(names)}.`;
}

export function HomeStatusHero({
  briefing,
  health,
  bikesAvailable,
  anchorsFreeTotal,
  activeStationsCount,
  criticalStationsCount,
  topCriticalDistricts,
  generatedAt,
  className = '',
}: HomeStatusHeroProps) {
  const levelColor = HEALTH_LEVEL_COLORS[health.level];

  return (
    <section className={`ui-section-card ${className}`} aria-labelledby="home-status-reading-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-bold"
          style={{
            color: levelColor,
            borderColor: `color-mix(in srgb, ${levelColor} 45%, var(--border))`,
            backgroundColor: `color-mix(in srgb, ${levelColor} 12%, transparent)`,
          }}
        >
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: levelColor }} />
          {health.label}
        </span>
        <span className="ui-chip" suppressHydrationWarning>
          Actualizado {formatHourMinute(generatedAt)}
        </span>
      </div>

      <MetricGrid columns={4}>
        <MetricCard
          label="Bicis disponibles"
          value={formatInteger(bikesAvailable)}
          detail="en toda la red"
        />
        <MetricCard
          label="Huecos libres"
          value={formatInteger(anchorsFreeTotal)}
          detail="anclajes para aparcar"
        />
        <MetricCard
          label="Estaciones operativas"
          value={formatInteger(activeStationsCount)}
          detail="de la red Bizi"
        />
        <MetricCard
          label="Sin bici o sin hueco"
          value={formatInteger(criticalStationsCount)}
          detail={buildCriticalStationsDetail(criticalStationsCount)}
        />
      </MetricGrid>

      <div aria-live="polite">
        <h2 id="home-status-reading-title" className="stat-label">
          La lectura de hoy
        </h2>
        <p className="mt-1 text-base font-semibold text-[var(--foreground)]">
          {briefing.current}
        </p>
        {criticalStationsCount > 0 ? (
          <p className="mt-1 text-sm text-[var(--muted)]">
            {buildDistrictSentence(topCriticalDistricts)}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-[var(--muted)]">{health.description}</p>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <TrackedLink href={appRoutes.dashboardAlerts()} className="text-sm text-[var(--muted)] underline underline-offset-2 hover:text-[var(--foreground)]">
          Ver alertas
        </TrackedLink>
        <TrackedLink href={appRoutes.compare()} className="text-sm text-[var(--muted)] underline underline-offset-2 hover:text-[var(--foreground)]">
          Ver comparativa
        </TrackedLink>
        <TrackedLink
          href={appRoutes.methodology()}
          trackingEvent={buildObservatoryEvent('observatory_evidence_opened', {
            surface: 'public',
            routeKey: 'home_briefing',
            source: 'home_status_hero',
          })}
          className="text-sm text-[var(--muted)] underline underline-offset-2 hover:text-[var(--foreground)]"
        >
          Cómo se interpreta
        </TrackedLink>
      </div>
    </section>
  );
}
