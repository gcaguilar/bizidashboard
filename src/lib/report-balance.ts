import { formatRatioDelta, formatRatioMagnitude } from '@/lib/format';
import { formatMonthLabel } from '@/lib/months';
import type { MonthlyReportComparison, ReportBalance } from '@/lib/monthly-report-types';

/**
 * Convierte la comparacion temporal en un balance en lenguaje claro. El titulo
 * siempre lleva la magnitud sin signo (nunca "cayo un -15%").
 */
export function buildReportBalance(input: {
  comparison: MonthlyReportComparison;
  previousMonthKey: string | null;
}): ReportBalance {
  const { comparison, previousMonthKey } = input;
  const referenceLabel = previousMonthKey ? formatMonthLabel(previousMonthKey) : 'el mes anterior';

  if (!comparison.isComparable || comparison.normalizedDemandRatio === null) {
    return {
      tone: 'unknown',
      headline: 'Todavía no hay una comparación fiable con el mes anterior.',
      detail: comparison.reason,
    };
  }

  const ratio = comparison.normalizedDemandRatio;

  if (comparison.trend === 'mejora') {
    return {
      tone: 'up',
      headline: `El uso creció un ${formatRatioMagnitude(ratio)} frente a ${referenceLabel}.`,
      detail: 'Se movieron más bicis y huecos en las estaciones que el mes anterior.',
    };
  }

  if (comparison.trend === 'empeora') {
    return {
      tone: 'down',
      headline: `El uso cayó un ${formatRatioMagnitude(ratio)} frente a ${referenceLabel}.`,
      detail: 'Se movieron menos bicis y huecos en las estaciones que el mes anterior.',
    };
  }

  return {
    tone: 'neutral',
    headline: `El uso se mantuvo estable frente a ${referenceLabel}.`,
    detail: `Variación de ${formatRatioDelta(ratio)}, dentro del rango habitual.`,
  };
}
