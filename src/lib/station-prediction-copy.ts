/**
 * Copy de la predicción de bicis por estación. Es una estimación a partir del
 * histórico (modelo `historical-baseline-v1`), no un dato observado: todo el
 * texto visible vive aquí para mantener el tono honesto en un único sitio.
 */
export type PredictionConfidenceLevel = 'baja' | 'media' | 'alta';

export const STATION_PREDICTION_COPY = {
  heading: 'Qué podría pasar después',
  badge: 'Estimación',
  subject: 'la predicción de esta estación',
  disclaimer:
    'Estimación basada en el comportamiento histórico de esta estación a esa hora. No es un dato observado ni una garantía.',
  insufficientTitle: 'Aún no hay histórico suficiente para estimar',
  insufficientDescription:
    'Esta estación no tiene todavía suficientes observaciones para esa franja horaria, así que no mostramos una cifra.',
  lowConfidenceTitle: 'Estimación poco fiable',
  lowConfidenceDescription:
    'Hay pocas observaciones históricas de esta franja; tómalo solo como orientación.',
  accuracyUnmeasuredTitle: 'Precisión aún no medida',
  accuracyUnmeasuredDescription:
    'Todavía no hay histórico suficiente para comprobar cuánto acierta esta predicción en esta estación.',
  adviceFillsSoon: 'Puede llenarse pronto. Busca una alternativa si necesitas dejar bici.',
  adviceEmptiesSoon: 'Puede quedarse vacía pronto. Busca una alternativa si necesitas coger bici.',
  adviceStable: 'Se espera que siga disponible la próxima hora.',
} as const;

export const PREDICTION_CONFIDENCE_LABELS: Record<PredictionConfidenceLevel, string> = {
  baja: 'confianza baja',
  media: 'confianza media',
  alta: 'confianza alta',
};

export function formatPredictionSentence(input: {
  timeLabel: string;
  bikes: number;
  low: number;
  high: number;
  confidence: PredictionConfidenceLevel;
}): string {
  const range = input.low === input.high ? '' : ` (entre ${input.low} y ${input.high})`;
  const noun = input.bikes === 1 ? 'bici' : 'bicis';
  return `A las ${input.timeLabel} habrá probablemente ${input.bikes} ${noun}${range}, ${PREDICTION_CONFIDENCE_LABELS[input.confidence]}.`;
}

/** Acierto medido en el histórico (backtest); `percent` ya redondeado a entero. */
export function formatPredictionAccuracy(input: { horizonMinutes: number; percent: number }): string {
  return `A ${input.horizonMinutes} min acierta ±1 bici el ${input.percent} % de las veces (medido en su histórico reciente).`;
}
