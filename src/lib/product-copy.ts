import type { StationSnapshot } from '@/lib/api-types';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales';
import { translate } from '@/lib/i18n/messages';

/**
 * Product vocabulary shared by the public observatory.
 *
 * Keeping these definitions together prevents a healthy ingestion pipeline from
 * being mistaken for a balanced, readily available bike network.
 *
 * Los textos viven en el diccionario central (`src/lib/i18n/messages/product.ts`);
 * `productTerms` y `activityIndexUnits` siguen siendo las constantes en español y
 * `getProductTerms(locale)` / `getActivityIndexUnits(locale)` sirven otros idiomas.
 */
export function getProductTerms(locale: Locale = DEFAULT_LOCALE) {
  return {
    dataStatus: {
      label: translate(locale, 'product.dataStatus.label'),
      definition: translate(locale, 'product.dataStatus.definition'),
    },
    networkBalance: {
      label: translate(locale, 'product.networkBalance.label'),
      definition: translate(locale, 'product.networkBalance.definition'),
    },
    operationalSignal: {
      label: translate(locale, 'product.operationalSignal.label'),
      definition: translate(locale, 'product.operationalSignal.definition'),
    },
    estimate: {
      label: translate(locale, 'product.estimate.label'),
      definition: translate(locale, 'product.estimate.definition'),
    },
  };
}

/**
 * Unidad del "índice de actividad". Se calcula sumando, por estación y
 * franja, la variación de bicis y de huecos entre el mínimo y el máximo
 * observados. No cuenta viajes ni movimientos reales: una misma variación puede
 * contarse dos veces (bicis y huecos) y los vaivenes dentro de una franja no se
 * ven. Todo texto que muestre la cifra debe usar estas unidades.
 */
export function getActivityIndexUnits(locale: Locale = DEFAULT_LOCALE) {
  return {
    label: translate(locale, 'product.activity.label'),
    total: translate(locale, 'product.activity.total'),
    perDay: translate(locale, 'product.activity.perDay'),
    perMonth: translate(locale, 'product.activity.perMonth'),
    tooltipLabel: translate(locale, 'product.activity.tooltipLabel'),
    tooltip: translate(locale, 'product.activity.tooltip'),
  };
}

export const productTerms = getProductTerms('es');

export const activityIndexUnits = getActivityIndexUnits('es');

export type NetworkBalanceSummary = {
  criticalStationsCount: number;
  state: 'balanced' | 'tense' | 'unknown';
  label: string;
  explanation: string;
};

export function getNetworkBalanceSummary(
  stations: StationSnapshot[],
  locale: Locale = DEFAULT_LOCALE
): NetworkBalanceSummary {
  if (stations.length === 0) {
    return {
      criticalStationsCount: 0,
      state: 'unknown',
      label: translate(locale, 'product.balance.unknown.label'),
      explanation: translate(locale, 'product.balance.unknown.explanation'),
    };
  }

  const criticalStationsCount = stations.filter(
    (station) => station.bikesAvailable <= 0 || station.anchorsFree <= 0
  ).length;

  if (criticalStationsCount > 0) {
    return {
      criticalStationsCount,
      state: 'tense',
      label: translate(locale, 'product.balance.tense.label'),
      explanation: translate(locale, 'product.balance.tense.explanation', {
        count: criticalStationsCount,
      }),
    };
  }

  return {
    criticalStationsCount,
    state: 'balanced',
    label: translate(locale, 'product.balance.balanced.label'),
    explanation: translate(locale, 'product.balance.balanced.explanation'),
  };
}
