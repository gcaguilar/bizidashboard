import { DataStateNotice } from '@/app/_components/DataStateNotice';
import type { StationPredictionsResponse } from '@/lib/predictions';
import { STATION_PREDICTION_COPY } from '@/lib/station-prediction-copy';
import { buildStationPredictionView } from '@/lib/station-prediction-view';

type StationPredictionCardProps = {
  predictions: StationPredictionsResponse | null | undefined;
  capacity: number;
};

export function StationPredictionCard({ predictions, capacity }: StationPredictionCardProps) {
  const view = buildStationPredictionView({ predictions, capacity });

  return (
    <article className="ui-section-card" data-testid="station-prediction">
      <h2 className="text-xl font-black text-[var(--foreground)]">{STATION_PREDICTION_COPY.heading}</h2>
      {view.state === 'empty' ? (
        <DataStateNotice
          className="mt-4"
          compact
          state="empty"
          subject={STATION_PREDICTION_COPY.subject}
          title={STATION_PREDICTION_COPY.insufficientTitle}
          description={STATION_PREDICTION_COPY.insufficientDescription}
        />
      ) : (
        <>
          <p className="stat-label mt-2">{STATION_PREDICTION_COPY.badge}</p>
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
          <p className="mt-2 text-xs text-[var(--muted)]">{STATION_PREDICTION_COPY.disclaimer}</p>
          {view.accuracy === 'unmeasured' ? (
            <DataStateNotice
              className="mt-3"
              compact
              state="partial"
              subject={STATION_PREDICTION_COPY.subject}
              title={STATION_PREDICTION_COPY.accuracyUnmeasuredTitle}
              description={STATION_PREDICTION_COPY.accuracyUnmeasuredDescription}
            />
          ) : null}
          {view.state === 'partial' ? (
            <DataStateNotice
              className="mt-3"
              compact
              state="partial"
              subject={STATION_PREDICTION_COPY.subject}
              title={STATION_PREDICTION_COPY.lowConfidenceTitle}
              description={STATION_PREDICTION_COPY.lowConfidenceDescription}
            />
          ) : null}
        </>
      )}
    </article>
  );
}
