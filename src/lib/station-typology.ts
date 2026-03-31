import type { StationType } from '@/types/rebalancing';

type PatternRow = {
  dayType: string;
  hour: number;
  occupancyAvg: number;
  sampleCount: number;
};

export type TypologyResult = {
  type: StationType;
  confidence: number;
  reasons: string[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avgOccupancy(patterns: PatternRow[], dayType: string, hours: number[]): number {
  const matching = patterns.filter(
    (p) => p.dayType === dayType && hours.includes(p.hour) && p.sampleCount > 0
  );
  if (matching.length === 0) return 0;
  const weightedSum = matching.reduce((sum, p) => sum + p.occupancyAvg * p.sampleCount, 0);
  const totalSamples = matching.reduce((sum, p) => sum + p.sampleCount, 0);
  return totalSamples > 0 ? weightedSum / totalSamples : 0;
}

function totalRotation(patterns: PatternRow[], dayType: string, hours: number[]): number {
  return patterns
    .filter((p) => p.dayType === dayType && hours.includes(p.hour))
    .reduce((sum, p) => sum + p.sampleCount, 0); // sampleCount proxies relative activity
}

const MORNING_HOURS = [7, 8, 9];
const EVENING_HOURS = [17, 18, 19];
const NIGHT_HOURS = [21, 22, 23, 0, 1, 2];
const MIDDAY_HOURS = [10, 11, 12, 13, 14, 15, 16];
const ALL_DAY_HOURS = Array.from({ length: 24 }, (_, i) => i);

// ─── Main inference function ─────────────────────────────────────────────────

/**
 * Infers the station usage typology from its aggregated `StationPattern` rows.
 *
 * Algorithm:
 * 1. Compute morning (7-9) vs evening (17-19) occupancy asymmetry for weekdays.
 * 2. Compare weekday vs weekend activity.
 * 3. Check night activity proportion.
 * 4. Apply threshold rules in priority order.
 *
 * Returns the inferred type, a confidence score (0-1), and human-readable reasons.
 */
export function inferStationType(patterns: PatternRow[]): TypologyResult {
  if (patterns.length === 0) {
    return {
      type: 'mixed',
      confidence: 0,
      reasons: ['Sin datos de patrones horarios disponibles.'],
    };
  }

  const reasons: string[] = [];

  const wdMorningOcc = avgOccupancy(patterns, 'WEEKDAY', MORNING_HOURS);
  const wdEveningOcc = avgOccupancy(patterns, 'WEEKDAY', EVENING_HOURS);
  const wdMiddayOcc = avgOccupancy(patterns, 'WEEKDAY', MIDDAY_HOURS);

  const wdTotalActivity = totalRotation(patterns, 'WEEKDAY', ALL_DAY_HOURS);
  const weTotalActivity = totalRotation(patterns, 'WEEKEND', ALL_DAY_HOURS);
  const weToWdRatio = wdTotalActivity > 0 ? weTotalActivity / wdTotalActivity : 0;

  const wdNightActivity = totalRotation(patterns, 'WEEKDAY', NIGHT_HOURS);
  const wdNightFraction = wdTotalActivity > 0 ? wdNightActivity / wdTotalActivity : 0;

  // Residential: bikes leave in the morning → evening occupancy > morning occupancy
  const residentialSignal = wdEveningOcc - wdMorningOcc;  // positive = residential
  // Offices: bikes arrive in the morning → morning occupancy > evening occupancy
  const officesSignal = wdMorningOcc - wdEveningOcc;      // positive = offices
  const middayStability = Math.abs(wdMiddayOcc - (wdMorningOcc + wdEveningOcc) / 2);

  // ─── Rule 1: Data review / not enough samples ────────────────────────────
  const minSamples = patterns.reduce((sum, p) => sum + p.sampleCount, 0);
  if (minSamples < 24) {
    return {
      type: 'mixed',
      confidence: 0.1,
      reasons: ['Pocos datos historicos para inferir tipologia con fiabilidad.'],
    };
  }

  // ─── Rule 2: Leisure / nocturnal ────────────────────────────────────────
  if (wdNightFraction > 0.25) {
    reasons.push(
      `Actividad nocturna elevada (${Math.round(wdNightFraction * 100)}% del total en horas 21-2).`
    );
    return { type: 'leisure', confidence: 0.7, reasons };
  }

  // ─── Rule 3: Tourist (high weekend vs weekday ratio) ─────────────────────
  if (weToWdRatio > 1.35) {
    reasons.push(
      `Actividad fin de semana ${Math.round(weToWdRatio * 100)}% de la actividad laboral.`
    );
    return { type: 'tourist', confidence: 0.75, reasons };
  }

  // ─── Rule 4: Intermodal (high midday stability + high overall rotation) ──
  if (middayStability < 0.08 && wdMiddayOcc > 0.3 && wdTotalActivity > 200) {
    reasons.push(
      `Ocupacion estable durante el dia (variacion <8%) con alta rotacion total.`
    );
    return { type: 'intermodal', confidence: 0.72, reasons };
  }

  // ─── Rule 5: Residential (empties in morning, fills in evening) ──────────
  if (residentialSignal > 0.12) {
    reasons.push(
      `Ocupacion tarde (${Math.round(wdEveningOcc * 100)}%) ` +
      `mayor que manana (${Math.round(wdMorningOcc * 100)}%) en laborables. ` +
      `Las bicis salen por la manana y vuelven por la tarde.`
    );
    const confidence = Math.min(0.9, 0.6 + residentialSignal * 2);
    return { type: 'residential', confidence, reasons };
  }

  // ─── Rule 6: Offices (fills in morning, empties in evening) ──────────────
  if (officesSignal > 0.12) {
    reasons.push(
      `Ocupacion manana (${Math.round(wdMorningOcc * 100)}%) ` +
      `mayor que tarde (${Math.round(wdEveningOcc * 100)}%) en laborables. ` +
      `La gente llega en bici por la manana y se va por la tarde.`
    );
    const confidence = Math.min(0.9, 0.6 + officesSignal * 2);
    return { type: 'offices', confidence, reasons };
  }

  // ─── Default: mixed ──────────────────────────────────────────────────────
  reasons.push('No hay patron dominante claro entre los tipos conocidos.');
  return { type: 'mixed', confidence: 0.5, reasons };
}
