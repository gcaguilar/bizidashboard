import type {
  ComparisonBand,
  ComparisonMetricKey,
  InteractiveComparisonDimensionId,
  InteractiveComparisonOption,
} from '@/lib/comparison-hub-builders';

export type ComparisonVerdictTone = 'positive' | 'warning' | 'neutral';

/** Resumen en lenguaje natural de una comparación de dos entidades. */
export type ComparisonVerdict = {
  emoji: string;
  headline: string;
  detail: string;
  recommendation: string;
  tone: ComparisonVerdictTone;
};

const STATUS_SEVERITY: Record<ComparisonBand['status'], number> = {
  unknown: 0,
  green: 1,
  amber: 2,
  red: 3,
};

const TEMPORAL_DIMENSIONS: ReadonlySet<InteractiveComparisonDimensionId> = new Set([
  'periods',
  'months',
  'years',
  'hours',
]);

function metricNumber(option: InteractiveComparisonOption, key: ComparisonMetricKey): number | null {
  const metric = option.metrics?.find((candidate) => candidate.key === key);
  if (!metric) {
    return null;
  }

  const match = /-?\d+(?:[.,]\d+)?/.exec(metric.value);
  if (!match) {
    return null;
  }

  const parsed = Number(match[0].replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDecimalEs(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits }).format(value);
}

function percentWord(ratio: number): string {
  const rounded = Math.abs(Math.round(ratio * 100));
  return rounded <= 1 ? 'prácticamente la misma' : `${rounded}%`;
}

function worstBand(bands: ComparisonBand[] | undefined): ComparisonBand | null {
  if (!bands || bands.length === 0) {
    return null;
  }

  return bands.reduce<ComparisonBand | null>((worst, band) => {
    if (band.status === 'unknown') {
      return worst;
    }
    if (!worst || STATUS_SEVERITY[band.status] > STATUS_SEVERITY[worst.status]) {
      return band;
    }
    return worst;
  }, null);
}

function bandSentence(option: InteractiveComparisonOption): string | null {
  const band = worstBand(option.bands);
  if (!band || band.status === 'green' || band.status === 'unknown') {
    return null;
  }

  const state = band.status === 'red' ? 'en rojo' : 'en naranja';
  const hourHint =
    band.peakHour !== null
      ? `, con el momento crítico sobre las ${String(band.peakHour).padStart(2, '0')}:00`
      : '';
  return `${option.label} está ${state} en la franja de ${band.label.toLowerCase()} (${band.rangeLabel})${hourHint}`;
}

/**
 * Traduce dos opciones comparables a un veredicto ciudadano: qué entidad rinde
 * más, dónde flojea y cuál conviene para el día a día. Puro y sin acceso a red,
 * de modo que la UI lo recalcula al cambiar de selección sin volver al servidor.
 */
export function buildComparisonVerdict(input: {
  dimensionId: InteractiveComparisonDimensionId;
  left: InteractiveComparisonOption;
  right: InteractiveComparisonOption;
}): ComparisonVerdict | null {
  const { left, right, dimensionId } = input;
  const leftValue = left.primaryValue;
  const rightValue = right.primaryValue;
  const metricNoun = TEMPORAL_DIMENSIONS.has(dimensionId) ? 'actividad' : 'rotación';

  if (leftValue === null && rightValue === null) {
    return {
      emoji: '💡',
      headline: `Todavía no hay datos suficientes para comparar ${left.label} y ${right.label}.`,
      detail: 'Prueba con otras opciones o revisa el estado de cobertura.',
      recommendation: '',
      tone: 'neutral',
    };
  }

  if (leftValue !== null && rightValue !== null && leftValue === rightValue) {
    return {
      emoji: '💡',
      headline: `${left.label} y ${right.label} empatan en ${left.primaryLabel.toLowerCase()}.`,
      detail: `Ambos registran ${left.primaryDisplay}. Elige por cercanía o por tus horas habituales.`,
      recommendation: '',
      tone: 'neutral',
    };
  }

  const leftScore = leftValue ?? Number.NEGATIVE_INFINITY;
  const rightScore = rightValue ?? Number.NEGATIVE_INFINITY;
  const leader = leftScore >= rightScore ? left : right;
  const trailer = leader === left ? right : left;
  const leaderValue = leader.primaryValue ?? 0;
  const trailerValue = trailer.primaryValue ?? 0;
  const deltaRatio = trailerValue !== 0 ? (leaderValue - trailerValue) / trailerValue : null;

  const headline =
    deltaRatio !== null
      ? `${leader.label} tiene un ${percentWord(deltaRatio)} más de ${metricNoun} que ${trailer.label}.`
      : `${leader.label} va por delante de ${trailer.label} en ${leader.primaryLabel.toLowerCase()}.`;

  const leftAvailability = metricNumber(left, 'availability');
  const rightAvailability = metricNumber(right, 'availability');
  const availabilityDiffers =
    leftAvailability !== null &&
    rightAvailability !== null &&
    Math.abs(leftAvailability - rightAvailability) >= 0.1;

  const detailParts: string[] = [];

  if (availabilityDiffers && leftAvailability !== null && rightAvailability !== null) {
    const worse = leftAvailability > rightAvailability ? left : right;
    const better = worse === left ? right : left;
    const worseValue = worse === left ? leftAvailability : rightAvailability;
    const betterValue = worse === left ? rightAvailability : leftAvailability;
    detailParts.push(
      `Pero ${worse.label} acumula ${formatDecimalEs(worseValue)} h sin servicio frente a ${formatDecimalEs(betterValue)} h de ${better.label}.`
    );
  }

  const leftBandSentence = bandSentence(left);
  const rightBandSentence = bandSentence(right);
  const bandOfInterest =
    leftBandSentence && !rightBandSentence
      ? leftBandSentence
      : rightBandSentence && !leftBandSentence
        ? rightBandSentence
        : availabilityDiffers
          ? [leftBandSentence, rightBandSentence].filter(Boolean).join(', y ')
          : null;
  if (bandOfInterest) {
    detailParts.push(`${bandOfInterest}.`);
  }

  const leftReliability = left.reliabilityScore ?? null;
  const rightReliability = right.reliabilityScore ?? null;

  let recommended: InteractiveComparisonOption | null = null;
  if (leftReliability !== null && rightReliability !== null && leftReliability !== rightReliability) {
    recommended = leftReliability > rightReliability ? left : right;
  } else if (availabilityDiffers && leftAvailability !== null && rightAvailability !== null) {
    recommended = leftAvailability < rightAvailability ? left : right;
  }

  const recommendation = recommended
    ? recommended === leader
      ? `Para tus desplazamientos, ${recommended.label} sale mejor parada: lidera el uso y no pierde fiabilidad.`
      : `Para desplazamientos a primera hora, ${recommended.label} ofrece mayor fiabilidad aunque tenga ${metricNoun === 'actividad' ? 'menos actividad' : 'menos rotación'}.`
    : '';

  const tone: ComparisonVerdictTone = recommended && recommended !== leader ? 'warning' : 'positive';

  return {
    emoji: '💡',
    headline,
    detail: detailParts.join(' '),
    recommendation,
    tone,
  };
}
