import { describe, expect, it } from 'vitest';
import {
  getNetworkBalanceSummary,
  getProductTerms,
  activityIndexUnits,
  productTerms,
} from '@/lib/product-copy';

describe('product copy extraction', () => {
  it('keeps the Spanish constants and summaries unchanged', () => {
    expect(productTerms.dataStatus.label).toBe('Estado de los datos');
    expect(productTerms.estimate.definition).toBe(
      'Una cifra calculada para comparar; no es el número exacto de viajes reales.',
    );
    expect(activityIndexUnits.perDay).toBe('puntos de actividad/día');
    expect(activityIndexUnits.tooltip.startsWith('Índice para comparar actividad')).toBe(true);
    expect(getNetworkBalanceSummary([])).toEqual({
      criticalStationsCount: 0,
      state: 'unknown',
      label: 'sin evidencia suficiente',
      explanation: 'No hay una muestra de estaciones suficiente para valorar la disponibilidad de la red.',
    });
  });

  it('serves English on request', () => {
    expect(getProductTerms('en').networkBalance.label).toBe('Network balance');
    expect(getNetworkBalanceSummary([], 'en').label).toBe('not enough evidence');
  });
});
