import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales';
import { translate } from '@/lib/i18n/messages';

/**
 * Copy de la predicción de bicis por estación. Es una estimación a partir del
 * histórico (modelo `historical-baseline-v1`), no un dato observado: todo el
 * texto visible vive en el diccionario central
 * (`src/lib/i18n/messages/station.ts`) para mantener el tono honesto en un único
 * sitio. Las constantes en español se conservan; `locale` sirve otros idiomas.
 */
export type PredictionConfidenceLevel = 'baja' | 'media' | 'alta';

export function getStationPredictionCopy(locale: Locale = DEFAULT_LOCALE) {
  return {
    heading: translate(locale, 'station.prediction.heading'),
    badge: translate(locale, 'station.prediction.badge'),
    subject: translate(locale, 'station.prediction.subject'),
    disclaimer: translate(locale, 'station.prediction.disclaimer'),
    insufficientTitle: translate(locale, 'station.prediction.insufficientTitle'),
    insufficientDescription: translate(locale, 'station.prediction.insufficientDescription'),
    lowConfidenceTitle: translate(locale, 'station.prediction.lowConfidenceTitle'),
    lowConfidenceDescription: translate(locale, 'station.prediction.lowConfidenceDescription'),
    accuracyUnmeasuredTitle: translate(locale, 'station.prediction.accuracyUnmeasuredTitle'),
    accuracyUnmeasuredDescription: translate(
      locale,
      'station.prediction.accuracyUnmeasuredDescription',
    ),
    adviceFillsSoon: translate(locale, 'station.prediction.adviceFillsSoon'),
    adviceEmptiesSoon: translate(locale, 'station.prediction.adviceEmptiesSoon'),
    adviceStable: translate(locale, 'station.prediction.adviceStable'),
  };
}

export const STATION_PREDICTION_COPY = getStationPredictionCopy('es');

export function getPredictionConfidenceLabels(
  locale: Locale = DEFAULT_LOCALE,
): Record<PredictionConfidenceLevel, string> {
  return {
    baja: translate(locale, 'station.prediction.confidence.baja'),
    media: translate(locale, 'station.prediction.confidence.media'),
    alta: translate(locale, 'station.prediction.confidence.alta'),
  };
}

export const PREDICTION_CONFIDENCE_LABELS = getPredictionConfidenceLabels('es');

export function formatPredictionSentence(
  input: {
    timeLabel: string;
    bikes: number;
    low: number;
    high: number;
    confidence: PredictionConfidenceLevel;
  },
  locale: Locale = DEFAULT_LOCALE,
): string {
  const range =
    input.low === input.high
      ? ''
      : translate(locale, 'station.prediction.range', { low: input.low, high: input.high });
  const noun = translate(
    locale,
    input.bikes === 1 ? 'station.prediction.noun.one' : 'station.prediction.noun.other',
  );
  return translate(locale, 'station.prediction.sentence', {
    time: input.timeLabel,
    bikes: input.bikes,
    noun,
    range,
    confidence: getPredictionConfidenceLabels(locale)[input.confidence],
  });
}

/** Acierto medido en el histórico (backtest); `percent` ya redondeado a entero. */
export function formatPredictionAccuracy(
  input: { horizonMinutes: number; percent: number },
  locale: Locale = DEFAULT_LOCALE,
): string {
  return translate(locale, 'station.prediction.accuracy', {
    minutes: input.horizonMinutes,
    percent: input.percent,
  });
}
