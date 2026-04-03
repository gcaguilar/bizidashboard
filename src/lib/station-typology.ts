import { DayType } from '@/analytics/types';
import type { StationType } from '@/types/rebalancing';
import type { StationPatternRow } from '@/lib/api';

export function inferStationType(
  patterns: StationPatternRow[]
): { type: StationType; confidence: number; reasons: string[] } {
  if (!patterns || patterns.length === 0) {
    return { type: 'mixed', confidence: 0.0, reasons: ['Sin datos de patrones, se asume tipo mixto'] };
  }

  const weekdayPatterns = patterns.filter((p) => p.dayType === DayType.WEEKDAY || p.dayType === 'WEEKDAY');
  const weekendPatterns = patterns.filter((p) => p.dayType === DayType.WEEKEND || p.dayType === 'WEEKEND');

  // Helper to average occupancy over specific hours
  const avgOcc = (rows: StationPatternRow[], startHr: number, endHr: number) => {
    const subset = rows.filter((r) => r.hour >= startHr && r.hour <= endHr);
    if (subset.length === 0) return 0;
    return subset.reduce((acc, curr) => acc + curr.occupancyAvg, 0) / subset.length;
  };

  // Helper to sum rotation (proxy: sampleCount is often used, but here we can just use average total bikes/anchors if available)
  // But wait, pattern row only has bikesAvg, anchorsAvg, occupancyAvg, sampleCount. 
  // Let's use occupancy swing as a proxy for rotation if real rotation isn't in pattern.
  // We can just rely on basic occupancy asymmetry for residential/offices.

  const morningOcc = avgOcc(weekdayPatterns, 7, 9);
  const eveningOcc = avgOcc(weekdayPatterns, 17, 19);

  const morningDrop = morningOcc - eveningOcc; // > 0 means it empties out after morning, fills in evening = residential
  const eveningDrop = eveningOcc - morningOcc; // > 0 means it fills in morning, empties in evening = offices

  const reasons: string[] = [];
  let type: StationType = 'mixed';
  let confidence = 0.5; // Base confidence

  // We can refine this using weekend vs weekday differences if needed, but simple asymmetry covers 80% of use cases.
  if (morningDrop > 0.1) {
    type = 'residential';
    confidence = Math.min(0.9, 0.5 + morningDrop * 2);
    reasons.push(`Patron residencial: la ocupacion matinal (${(morningOcc * 100).toFixed(1)}%) es significativamente mayor que la vespertina (${(eveningOcc * 100).toFixed(1)}%). Bicis salen por la manana y vuelven por la tarde.`);
  } else if (eveningDrop > 0.1) {
    type = 'offices';
    confidence = Math.min(0.9, 0.5 + eveningDrop * 2);
    reasons.push(`Patron de oficinas/destinos: la ocupacion vespertina (${(eveningOcc * 100).toFixed(1)}%) es mayor que la matinal (${(morningOcc * 100).toFixed(1)}%). Bicis llegan por la manana y se retiran por la tarde.`);
  } else {
    // Check if it's consistently stable but we need external rotation metrics to classify intermodal/tourist perfectly.
    // For now, if no strong asymmetry, it's mixed.
    reasons.push(`Comportamiento simetrico o mixto (Diferencia manana-tarde menor al 10%).`);
    
    // Check weekend vs weekday average occupancy
    const weekdayAvg = avgOcc(weekdayPatterns, 0, 23);
    const weekendAvg = avgOcc(weekendPatterns, 0, 23);
    
    if (weekendAvg > weekdayAvg + 0.15) {
      type = 'tourist';
      reasons.push(`Patron turistico: ocupacion media en fin de semana superior a laborable.`);
      confidence = 0.7;
    }
  }

  return { type, confidence: Number(confidence.toFixed(2)), reasons };
}
