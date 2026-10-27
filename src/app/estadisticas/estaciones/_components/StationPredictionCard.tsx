import { DataStateNotice } from '@/app/_components/DataStateNotice';
import type { StationPredictionsResponse } from '@/lib/predictions';
import { useT } from '@/lib/i18n/use-locale';
import { getStationPredictionCopy } from '@/lib/station-prediction-copy';
import { buildStationPredictionView } from '@/lib/station-prediction-view';

type StationPredictionCardProps = {
  predictions: StationPredictionsResponse | null | undefined;
  capacity: number;
};

export function StationPredictionCard({ predictions, capacity }: StationPredictionCardProps) {
  const { locale } = useT();
  const copy = getStationPredictionCopy(locale);
  const view = buildStationPredictionView({ predictions, capacity, locale });

  return (
    <article className="ui-section-card" data-testid="station-prediction">
      <h2 className="text-xl font-black text-[var(--foreground)]">{copy.heading}</h2>
      {view.state === 'empty' ? (
        <DataStateNotice
          className="mt-4"
          compact
          locale={locale}
          state="empty"
          subject={copy.subject}
          title={copy.insufficientTitle}
          description={copy.insufficientDescription}
        />
      ) : (
        <>
          <p className="stat-label mt-2">{copy.badge}</p>
          <ul className="mt-3 space-y-3 text-sm">
            {view.rows.map((row) => (
              <li key={row.horizonMinutes} className="font-semibold text-[var(--foreground)]">
                {row.sentence}
                {row.accuracy ? (
                  <span className="mt-1 block text-xs font-normal text-[var(--muted)]">{row.accuracy.text}</span>
                ) : null}
              </li>
            ))}
          </ul>
          {view.advice ? <p className="mt-3 text-xs text-[var(--muted)]">{view.advice}</p> : null}
          <p className="mt-2 text-xs text-[var(--muted)]">{copy.disclaimer}</p>
          {view.accuracy === 'unmeasured' ? (
            <DataStateNotice
              className="mt-3"
              compact
              locale={locale}
              state="partial"
              subject={copy.subject}
              title={copy.accuracyUnmeasuredTitle}
              description={copy.accuracyUnmeasuredDescription}
            />
          ) : null}
          {view.state === 'partial' ? (
            <DataStateNotice
              className="mt-3"
              compact
              locale={locale}
              state="partial"
              subject={copy.subject}
              title={copy.lowConfidenceTitle}
              description={copy.lowConfidenceDescription}
            />
          ) : null}
        </>
      )}
    </article>
  );
}
