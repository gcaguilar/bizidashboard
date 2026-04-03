import type { StationClassification, StationBaseMetrics, TimeBandMetrics, TargetBand } from '@/types/rebalancing';

// Helper to calculate percentile of a value in an array
function getPercentile(value: number, allValues: number[]): number {
  if (allValues.length === 0) return 0;
  const sorted = [...allValues].sort((a, b) => a - b);
  const index = sorted.findIndex((v) => v >= value);
  return index === -1 ? 1 : index / sorted.length;
}

export function classifyStation(
  capacity: number,
  currentBikes: number,
  currentAnchors: number,
  globalMetrics: StationBaseMetrics,
  timeBandMetrics: TimeBandMetrics[],
  targetBand: TargetBand,
  allGlobalMetrics: Record<string, StationBaseMetrics>
): { classification: StationClassification; reasons: string[] } {
  const reasons: string[] = [];
  
  // Rule F: Data review (Check first to ignore bad data)
  // Suspiciously stable with high movement, or capacity changes detected
  const isAnomalousCapacity = currentBikes + currentAnchors !== capacity;
  if (isAnomalousCapacity) {
    reasons.push(`Revisar datos: la suma de bicis (${currentBikes}) y anclajes libres (${currentAnchors}) no coincide con la capacidad (${capacity})`);
    return { classification: 'data_review', reasons };
  }
  
  if (globalMetrics.variability < 0.02 && globalMetrics.rotation > 10) {
    reasons.push(`Revisar datos: variabilidad anormalmente baja (${(globalMetrics.variability * 100).toFixed(1)}%) a pesar de tener rotacion activa`);
    return { classification: 'data_review', reasons };
  }

  // Calculate percentiles
  const allRotations = Object.values(allGlobalMetrics).map((m) => m.rotationPerBike);
  const rotationPercentile = getPercentile(globalMetrics.rotationPerBike, allRotations);

  // Peak bands
  const peakBands = timeBandMetrics.filter((m) => m.timeBand === 'morning_peak' || m.timeBand === 'evening_peak');
  const nonPeakBands = timeBandMetrics.filter((m) => m.timeBand === 'valley' || m.timeBand === 'night');

  // Rule A: Overstock
  if (globalMetrics.occupancyAvg > 0.70 && rotationPercentile <= 0.40 && globalMetrics.persistenceProxy > 0.40) {
    reasons.push(`Sobrestock: ocupacion media alta (${(globalMetrics.occupancyAvg * 100).toFixed(1)}%), rotacion en el percentil ${(rotationPercentile * 100).toFixed(0)}, y el ${(globalMetrics.persistenceProxy * 100).toFixed(1)}% de las horas no hay movimiento`);
    return { classification: 'overstock', reasons };
  }

  // Rule B: Deficit
  const anyPeakEmpty = peakBands.some((m) => m.pctTimeEmpty > 0.10);
  if (globalMetrics.occupancyAvg < 0.30 && anyPeakEmpty) {
    reasons.push(`Deficit: ocupacion media muy baja (${(globalMetrics.occupancyAvg * 100).toFixed(1)}%) y sufre vaciados frecuentes en hora punta`);
    return { classification: 'deficit', reasons };
  }

  // Rule C: Peak saturation
  const anyPeakFull = peakBands.some((m) => m.pctTimeFull > 0.20);
  const allNonPeakNotFull = nonPeakBands.every((m) => m.pctTimeFull < 0.05);
  if (anyPeakFull && allNonPeakNotFull) {
    reasons.push(`Saturacion en punta: se llena mas del 20% del tiempo en hora punta, pero funciona bien el resto del dia`);
    return { classification: 'peak_saturation', reasons };
  }

  // Rule D: Peak emptying
  const anyPeakEmptyHigh = peakBands.some((m) => m.pctTimeEmpty > 0.20);
  const allNonPeakNotEmpty = nonPeakBands.every((m) => m.pctTimeEmpty < 0.05);
  if (anyPeakEmptyHigh && allNonPeakNotEmpty) {
    reasons.push(`Vaciado en punta: se vacia mas del 20% del tiempo en hora punta, pero se recupera el resto del dia`);
    return { classification: 'peak_emptying', reasons };
  }

  // Rule E: Balanced
  reasons.push(`Equilibrada: la ocupacion se mantiene dentro de los parametros normales sin riesgo cronico detectado`);
  return { classification: 'balanced', reasons };
}
