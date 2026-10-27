import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StationPredictionCard } from '@/app/estadisticas/estaciones/_components/StationPredictionCard';
import type { StationPredictionsResponse } from '@/lib/predictions';
import { buildStationPredictionView } from '@/lib/station-prediction-view';

const NOW = new Date('2026-03-10T07:00:00Z');

const measuredPayload = (sampleCount: number): StationPredictionsResponse => ({
  stationId: '1',
  generatedAt: NOW.toISOString(),
  modelVersion: 'historical-baseline-v1',
  predictions: [
    {
      horizonMinutes: 30,
      predictedBikesAvailable: 10,
      predictedAnchorsFree: 10,
      confidence: 0.8,
      rangeHalfWidth: 2,
      backtest: { sampleCount, mae: 1.2, hitRateWithin1: 0.73, hitRateWithinRange: 0.82 },
    },
  ],
});

describe('measured prediction accuracy', () => {
  it('shows the hit rate and calibrated range with enough samples', () => {
    const view = buildStationPredictionView({ predictions: measuredPayload(80), capacity: 20, now: NOW });
    expect(view.accuracy).toBe('measured');
    expect(view.rows[0]).toMatchObject({ low: 8, high: 12 });
    expect(view.rows[0].accuracy?.percent).toBe(73);
    const html = renderToStaticMarkup(
      <StationPredictionCard predictions={measuredPayload(80)} capacity={20} />
    );
    expect(html).toContain('acierta ±1 bici el 73 %');
    expect(html).not.toContain('Precisión aún no medida');
  });

  it('degrades with a notice when the sample is too small', () => {
    const view = buildStationPredictionView({ predictions: measuredPayload(5), capacity: 20, now: NOW });
    expect(view.accuracy).toBe('unmeasured');
    expect(view.rows[0].accuracy).toBeNull();
    const html = renderToStaticMarkup(
      <StationPredictionCard predictions={measuredPayload(5)} capacity={20} />
    );
    expect(html).toContain('Precisión aún no medida');
    expect(html).not.toContain('acierta ±1');
  });
});
