import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

// The card reads the locale from the router; render it as the Spanish page.
vi.mock('@/lib/i18n/use-locale', async () => {
  const { createTranslator } = await import('@/lib/i18n/messages');
  return { useLocale: () => 'es', useT: () => ({ locale: 'es', t: createTranslator('es') }) };
});

import { StationPredictionCard } from '@/app/estadisticas/estaciones/_components/StationPredictionCard';
import type { StationPredictionsResponse } from '@/lib/predictions';
import { formatPredictionSentence } from '@/lib/station-prediction-copy';
import {
  buildStationPredictionView,
  confidenceLevel,
  predictionRange,
} from '@/lib/station-prediction-view';

const NOW = new Date('2026-03-10T07:00:00Z'); // 08:00 en Madrid (CET)

function payload(
  points: Array<{ h: 30 | 60; bikes: number | null; confidence: number | null }>
): StationPredictionsResponse {
  return {
    stationId: '1',
    generatedAt: NOW.toISOString(),
    modelVersion: 'historical-baseline-v1',
    predictions: points.map((p) => ({
      horizonMinutes: p.h,
      predictedBikesAvailable: p.bikes,
      predictedAnchorsFree: p.bikes === null ? null : 20 - p.bikes,
      confidence: p.confidence,
    })),
  };
}

describe('station prediction view', () => {
  it('maps confidence to levels', () => {
    expect(confidenceLevel(0.9)).toBe('alta');
    expect(confidenceLevel(0.6)).toBe('media');
    expect(confidenceLevel(0.42)).toBe('baja');
  });

  it('widens the range with lower confidence and longer horizon, within capacity', () => {
    const tight = predictionRange(10, 20, 0.92, 30);
    const loose = predictionRange(10, 20, 0.45, 60);
    expect(tight.high - tight.low).toBeLessThan(loose.high - loose.low);
    expect(predictionRange(1, 20, 0.42, 60).low).toBe(0);
    expect(predictionRange(19, 20, 0.42, 60).high).toBe(20);
  });

  it('builds sentences with local time and range', () => {
    const view = buildStationPredictionView({
      predictions: payload([
        { h: 30, bikes: 8, confidence: 0.9 },
        { h: 60, bikes: 6, confidence: 0.9 },
      ]),
      capacity: 20,
    });
    expect(view.state).toBe('ok');
    expect(view.rows[0].timeLabel).toBe('08:30');
    expect(view.rows[1].timeLabel).toBe('09:00');
    expect(view.rows[0].sentence).toContain('A las 08:30 habrá probablemente 8 bicis');
    expect(view.rows[0].sentence).toContain('confianza alta');
    expect(view.advice).toBe('Se espera que siga disponible la próxima hora.');
  });

  it('flags low confidence as partial and warns about emptying', () => {
    const view = buildStationPredictionView({
      predictions: payload([{ h: 30, bikes: 1, confidence: 0.45 }]),
      capacity: 20,
    });
    expect(view.state).toBe('partial');
    expect(view.advice).toContain('quedarse vacía');
  });

  it('degrades to empty without data or capacity', () => {
    const nulls = payload([
      { h: 30, bikes: null, confidence: null },
      { h: 60, bikes: null, confidence: null },
    ]);
    expect(buildStationPredictionView({ predictions: nulls, capacity: 20 }).state).toBe('empty');
    expect(buildStationPredictionView({ predictions: null, capacity: 20 }).state).toBe('empty');
    expect(
      buildStationPredictionView({
        predictions: payload([{ h: 30, bikes: 5, confidence: 0.9 }]),
        capacity: 0,
      }).state
    ).toBe('empty');
  });

  it('singularizes and omits a zero-width range', () => {
    expect(
      formatPredictionSentence({ timeLabel: '08:30', bikes: 1, low: 1, high: 1, confidence: 'media' })
    ).toBe('A las 08:30 habrá probablemente 1 bici, confianza media.');
  });
});

describe('StationPredictionCard', () => {
  it('renders the estimate with disclaimer', () => {
    const html = renderToStaticMarkup(
      <StationPredictionCard predictions={payload([{ h: 30, bikes: 8, confidence: 0.9 }])} capacity={20} />
    );
    expect(html).toContain('A las 08:30 habrá probablemente 8 bicis');
    expect(html).toContain('No es un dato observado');
  });

  it('renders DataStateNotice when data is insufficient', () => {
    const html = renderToStaticMarkup(
      <StationPredictionCard predictions={payload([{ h: 30, bikes: null, confidence: null }])} capacity={20} />
    );
    expect(html).toContain('Aún no hay histórico suficiente');
    expect(html).not.toContain('habrá probablemente');
  });
});
