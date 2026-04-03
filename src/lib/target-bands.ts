import type { StationType, TargetBand, TimeBand } from '@/types/rebalancing';

export const DEFAULT_TARGET_BANDS: Record<StationType, Record<TimeBand, TargetBand>> = {
  residential: {
    morning_peak: { min: 0.30, max: 0.60 },
    valley: { min: 0.35, max: 0.65 },
    evening_peak: { min: 0.40, max: 0.70 },
    night: { min: 0.50, max: 0.80 },
  },
  offices: {
    morning_peak: { min: 0.60, max: 0.85 },
    valley: { min: 0.40, max: 0.70 },
    evening_peak: { min: 0.25, max: 0.55 },
    night: { min: 0.20, max: 0.50 },
  },
  intermodal: {
    morning_peak: { min: 0.40, max: 0.70 },
    valley: { min: 0.40, max: 0.70 },
    evening_peak: { min: 0.40, max: 0.70 },
    night: { min: 0.40, max: 0.70 },
  },
  tourist: {
    morning_peak: { min: 0.35, max: 0.65 },
    valley: { min: 0.30, max: 0.60 },
    evening_peak: { min: 0.35, max: 0.65 },
    night: { min: 0.25, max: 0.55 },
  },
  leisure: {
    morning_peak: { min: 0.25, max: 0.55 },
    valley: { min: 0.30, max: 0.60 },
    evening_peak: { min: 0.40, max: 0.70 },
    night: { min: 0.45, max: 0.75 },
  },
  mixed: {
    morning_peak: { min: 0.35, max: 0.65 },
    valley: { min: 0.35, max: 0.65 },
    evening_peak: { min: 0.35, max: 0.65 },
    night: { min: 0.35, max: 0.65 },
  },
};

export function getTargetBand(type: StationType, timeBand: TimeBand): TargetBand {
  return DEFAULT_TARGET_BANDS[type]?.[timeBand] ?? DEFAULT_TARGET_BANDS.mixed[timeBand];
}

export function getCurrentTimeBand(hour: number): TimeBand {
  if (hour >= 7 && hour <= 9) return 'morning_peak';
  if (hour >= 10 && hour <= 16) return 'valley';
  if (hour >= 17 && hour <= 19) return 'evening_peak';
  return 'night';
}
