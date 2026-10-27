import { DataStateNotice } from '@/app/_components/DataStateNotice';
import { formatInteger, formatPercent } from '@/lib/format';
import {
  buildStationDistrictComparison,
  type ComparisonMetricKey,
  type StationComparisonMetrics,
} from '@/lib/station-district-comparison';
import type { Locale } from '@/lib/i18n/locales';
import { useT } from '@/lib/i18n/use-locale';
import { getStationDistrictComparisonCopy } from '@/lib/station-insights-copy';

type StationDistrictComparisonProps = {
  stationMetrics: StationComparisonMetrics;
  districtName: string | null;
  peerMetrics: StationComparisonMetrics[];
};

function formatMetric(key: ComparisonMetricKey, value: number, locale: Locale): string {
  return key === 'movement' ? formatInteger(value, locale) : formatPercent(value);
}

export function StationDistrictComparison({
  stationMetrics,
  districtName,
  peerMetrics,
}: StationDistrictComparisonProps) {
  const { locale } = useT();
  const COPY = getStationDistrictComparisonCopy(locale);
  const comparison = districtName
    ? buildStationDistrictComparison(stationMetrics, peerMetrics)
    : null;

  return (
    <section className="ui-section-card" data-testid="station-district-comparison">
      <h2 className="text-xl font-black text-[var(--foreground)]">{COPY.heading}</h2>
      {!comparison || comparison.state === 'empty' ? (
        <DataStateNotice
          className="mt-4"
          compact
          locale={locale}
          state="empty"
          subject={COPY.subject}
          title={COPY.emptyTitle}
          description={COPY.emptyDescription}
        />
      ) : (
        <>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {COPY.peersLabel(districtName ?? '', comparison.peerCount)}
          </p>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {comparison.rows.map((row) => (
              <li key={row.key} className="ui-surface-block">
                <p className="text-sm font-semibold text-[var(--foreground)]">{COPY.metrics[row.key]}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {COPY.thisStation} <strong>{formatMetric(row.key, row.stationValue, locale)}</strong> · {COPY.district}{' '}
                  <strong>{formatMetric(row.key, row.districtValue, locale)}</strong>
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
                  {COPY.verdicts[row.verdict]}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-[var(--muted)]">{COPY.note}</p>
        </>
      )}
    </section>
  );
}
