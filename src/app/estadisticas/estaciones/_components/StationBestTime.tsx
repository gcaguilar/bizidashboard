import { DataStateNotice } from '@/app/_components/DataStateNotice';
import type { PeakFullHourSlot, StationPatternRow } from '@/lib/api-types';
import { DayType } from '@/analytics/types';
import { useT } from '@/lib/i18n/use-locale';
import { buildStationBestTime, formatHourSpan, type HourSpan } from '@/lib/station-best-time';
import { getStationBestTimeCopy } from '@/lib/station-insights-copy';

type StationBestTimeProps = {
  patterns: StationPatternRow[];
  peakHours: PeakFullHourSlot[];
};

function SpanLine({ label, spans, fallback }: { label: string; spans: HourSpan[]; fallback: string }) {
  return (
    <p className="mt-1 text-sm text-[var(--muted)]">
      <span className="font-semibold text-[var(--foreground)]">{label}:</span>{' '}
      {spans.length > 0 ? spans.map(formatHourSpan).join(' · ') : fallback}
    </p>
  );
}

export function StationBestTime({ patterns, peakHours }: StationBestTimeProps) {
  const { locale, t } = useT();
  const COPY = getStationBestTimeCopy(locale);
  const view = buildStationBestTime(patterns, peakHours);
  const dayTypeLabel = (dayType: string) =>
    dayType === DayType.WEEKDAY
      ? t('station.dayType.weekday')
      : dayType === DayType.WEEKEND
        ? t('station.dayType.weekend')
        : t('station.dayType.unknown');

  return (
    <section className="ui-section-card" data-testid="station-best-time">
      <h2 className="text-xl font-black text-[var(--foreground)]">{COPY.heading}</h2>
      {view.state === 'empty' ? (
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
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {view.byDayType.map((entry) => (
              <div key={entry.dayType} className="ui-surface-block">
                <p className="text-sm font-semibold text-[var(--foreground)]">{dayTypeLabel(entry.dayType)}</p>
                <SpanLine label={COPY.noBikesLabel} spans={entry.noBikes} fallback={COPY.noIssues} />
                <SpanLine label={COPY.noAnchorsLabel} spans={entry.noAnchors} fallback={COPY.noIssues} />
                <SpanLine label={COPY.betterLabel} spans={entry.better} fallback={COPY.noBetter} />
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-[var(--muted)]">{COPY.note}</p>
        </>
      )}
    </section>
  );
}
