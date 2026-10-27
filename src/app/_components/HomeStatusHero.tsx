import { TrackedLink } from '@/app/_components/TrackedLink';
import { MetricCard, MetricGrid } from '@/components/ui/metric-card';
import { formatHourMinute, formatInteger } from '@/lib/format';
import type { NetworkBriefing as NetworkBriefingModel } from '@/lib/network-briefing';
import type { NetworkHealth, NetworkHealthLevel } from '@/lib/network-health';
import { useT } from '@/lib/i18n/use-locale';
import type { Translator } from '@/lib/i18n/messages';
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
function joinDistrictNames(names: string[], t: Translator): string {
  if (names.length <= 1) {
    return names[0] ?? '';
  }

  return `${names.slice(0, -1).join(', ')}${t('home.status.districts.and')}${names[names.length - 1]}`;
}

function buildCriticalStationsDetail(criticalStationsCount: number, t: Translator): string {
  return criticalStationsCount === 0 ? t('home.status.critical.none') : t('home.status.critical.some');
}

function buildDistrictSentence(topCriticalDistricts: CriticalDistrictCount[], t: Translator): string {
  const names = topCriticalDistricts.map((district) => district.name);
  if (names.length === 0) {
    return t('home.status.districts.none');
  }

  return t('home.status.districts.some', { names: joinDistrictNames(names, t) });
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
  const { locale, t } = useT();
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
          {t('home.status.updated', { time: formatHourMinute(generatedAt, undefined, locale) })}
        </span>
      </div>

      <MetricGrid columns={4}>
        <MetricCard
          label={t('home.status.bikes.label')}
          value={formatInteger(bikesAvailable, locale)}
          detail={t('home.status.bikes.detail')}
        />
        <MetricCard
          label={t('home.status.anchors.label')}
          value={formatInteger(anchorsFreeTotal, locale)}
          detail={t('home.status.anchors.detail')}
        />
        <MetricCard
          label={t('home.status.stations.label')}
          value={formatInteger(activeStationsCount, locale)}
          detail={t('home.status.stations.detail')}
        />
        <MetricCard
          label={t('home.status.critical.label')}
          value={formatInteger(criticalStationsCount, locale)}
          detail={buildCriticalStationsDetail(criticalStationsCount, t)}
        />
      </MetricGrid>

      <div aria-live="polite">
        <h2 id="home-status-reading-title" className="stat-label">
          {t('home.status.reading')}
        </h2>
        <p className="mt-1 text-base font-semibold text-[var(--foreground)]">
          {briefing.current}
        </p>
        {criticalStationsCount > 0 ? (
          <p className="mt-1 text-sm text-[var(--muted)]">
            {buildDistrictSentence(topCriticalDistricts, t)}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-[var(--muted)]">{health.description}</p>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <TrackedLink href={appRoutes.dashboardAlerts()} className="text-sm text-[var(--muted)] underline underline-offset-2 hover:text-[var(--foreground)]">
          {t('home.status.link.alerts')}
        </TrackedLink>
        <TrackedLink href={appRoutes.compare()} className="text-sm text-[var(--muted)] underline underline-offset-2 hover:text-[var(--foreground)]">
          {t('home.status.link.compare')}
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
          {t('home.status.link.methodology')}
        </TrackedLink>
      </div>
    </section>
  );
}
