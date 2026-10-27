import type { StationSnapshot } from '@/lib/api-types';
import { formatFreshnessLabel } from '@/lib/freshness';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales';
import { createTranslator, translate } from '@/lib/i18n/messages';
import { buildNetworkHealth, hasNoAvailability } from '@/lib/network-health';
import type { NetworkHealth, NetworkHealthLevel } from '@/lib/network-health';

export type NetworkBriefingInput = {
  stations: StationSnapshot[];
  activeAlertsCount: number;
  coverageDays: number;
  lastUpdatedAt: string | null;
  pipelineHealthy: boolean;
  baseline?: NetworkBriefingBaseline | null;
};

export type NetworkBriefingBaseline = {
  criticalStationsCount: number;
  activeAlertsCount: number | null;
  label: string;
};

export type NetworkBriefing = {
  state: 'balanced' | 'tense' | 'strained' | 'insufficient';
  health: NetworkHealth;
  current: string;
  comparison: string;
  focus: string;
  alerts: string;
  dataQuality: string;
  warning: string | null;
};

const BRIEFING_STATE_BY_HEALTH_LEVEL: Record<NetworkHealthLevel, NetworkBriefing['state']> = {
  green: 'balanced',
  yellow: 'tense',
  red: 'strained',
  unknown: 'insufficient',
};

/** Spanish label stored (and cached) by the baseline lookup; translated when rendered. */
export const SAME_SLOT_BASELINE_LABEL = 'la misma franja de la semana anterior';

type PluralKey = 'network.unit.day' | 'network.briefing.current' | 'network.briefing.comparison.more' | 'network.briefing.comparison.less' | 'network.briefing.alerts.compared' | 'network.briefing.alerts.uncompared';

function pluralKey<K extends PluralKey>(base: K, count: number): `${K}.one` | `${K}.other` {
  return count === 1 ? `${base}.one` : `${base}.other`;
}

function localizeBaselineLabel(label: string, locale: Locale): string {
  return label === SAME_SLOT_BASELINE_LABEL ? translate(locale, 'network.baseline.sameSlot') : label;
}

export function buildNetworkBriefing(input: NetworkBriefingInput, locale: Locale = DEFAULT_LOCALE): NetworkBriefing {
  const t = createTranslator(locale);
  const health = buildNetworkHealth({
    stations: input.stations,
    pipelineHealthy: input.pipelineHealthy,
    lastUpdatedAt: input.lastUpdatedAt,
    locale,
  });
  const criticalStations = input.stations.filter(hasNoAvailability);
  const focusStation = criticalStations[0] ?? null;
  const hasEnoughEvidence = input.stations.length > 0 && Boolean(input.lastUpdatedAt) && input.coverageDays > 0;

  if (!hasEnoughEvidence) {
    const coverageDays = Math.max(0, input.coverageDays);
    return {
      state: 'insufficient',
      health,
      current: t('network.briefing.insufficient.current'),
      comparison: t('network.briefing.insufficient.comparison'),
      focus: t('network.briefing.insufficient.focus'),
      alerts: t('network.briefing.insufficient.alerts'),
      dataQuality: t('network.briefing.insufficient.coverage', {
        days: coverageDays,
        unit: t(pluralKey('network.unit.day', coverageDays)),
      }),
      warning: t('network.briefing.insufficient.warning'),
    };
  }

  const criticalCount = health.criticalStationsCount;
  const current = criticalCount > 0
    ? t(pluralKey('network.briefing.current', criticalCount), { count: criticalCount })
    : t('network.briefing.current.none');
  const criticalDifference = input.baseline
    ? criticalCount - input.baseline.criticalStationsCount
    : null;
  const baselineLabel = input.baseline ? localizeBaselineLabel(input.baseline.label, locale) : '';
  const comparison = input.baseline && criticalDifference !== null
    ? criticalDifference === 0
      ? t('network.briefing.comparison.same', { label: baselineLabel })
      : t(
          pluralKey(
            criticalDifference > 0 ? 'network.briefing.comparison.more' : 'network.briefing.comparison.less',
            Math.abs(criticalDifference),
          ),
          { count: Math.abs(criticalDifference), label: baselineLabel },
        )
    : t('network.briefing.comparison.none');
  const focus = focusStation
    ? t('network.briefing.focus.some', { name: focusStation.name })
    : t('network.briefing.focus.none');
  const alerts = input.baseline?.activeAlertsCount != null
    ? t(pluralKey('network.briefing.alerts.compared', input.activeAlertsCount), {
        count: input.activeAlertsCount,
        label: baselineLabel,
      })
    : t(pluralKey('network.briefing.alerts.uncompared', input.activeAlertsCount), {
        count: input.activeAlertsCount,
      });
  const freshness = input.lastUpdatedAt
    ? formatFreshnessLabel(input.lastUpdatedAt, locale)
    : t('network.briefing.freshness.noDate');

  return {
    state: BRIEFING_STATE_BY_HEALTH_LEVEL[health.level],
    health,
    current,
    comparison,
    focus,
    alerts,
    dataQuality: t('network.briefing.dataQuality', {
      pipeline: t(input.pipelineHealthy ? 'network.briefing.pipeline.ok' : 'network.briefing.pipeline.incident'),
      freshness,
      days: input.coverageDays,
      unit: t(pluralKey('network.unit.day', input.coverageDays)),
    }),
    warning: null,
  };
}
