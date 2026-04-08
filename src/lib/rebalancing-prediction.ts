import type { StationSnapshot, StationPatternRow } from '@/lib/api';
import type { RiskAssessment, TimeBandMetrics, TargetBand } from '@/types/rebalancing';
import { estimateStationPredictions } from '@/lib/predictions';
import { getCurrentTimeBand } from '@/lib/target-bands';
import { getLocalBucket } from '@/analytics/time-buckets';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function assessStationRisk(
  station: StationSnapshot,
  patterns: Array<Pick<StationPatternRow, 'dayType' | 'hour' | 'occupancyAvg' | 'sampleCount'>>,
  timeBandMetrics: TimeBandMetrics[],
  targetBand: TargetBand,
  now: Date = new Date()
): RiskAssessment {
  if (station.capacity <= 0) {
    return {
      riskEmptyAt1h: 0,
      riskEmptyAt3h: 0,
      riskFullAt1h: 0,
      riskFullAt3h: 0,
      demandNextHour: 0,
      demandNext3Hours: 0,
      selfCorrectionProbability: 0,
      estimatedRecoveryMinutes: null,
      confidence: 0,
    };
  }

  // Use the base 30/60 min prediction from existing engine
  const basePredictions = estimateStationPredictions(
    {
      stationId: station.id,
      capacity: station.capacity,
      bikesAvailable: station.bikesAvailable,
      anchorsFree: station.anchorsFree,
      patterns: patterns.map((row) => ({
        ...row,
        bikesAvg: 0,
        anchorsAvg: 0,
      })),
    },
    now
  );

  const pred60 = basePredictions.predictions.find((p) => p.horizonMinutes === 60);
  const confidence = pred60?.confidence ?? 0.5;

  const currentRatio = station.bikesAvailable / station.capacity;

  // Manual 180 min prediction using lower recency weight
  const future3hDate = new Date(now.getTime() + 180 * 60_000);
  const future3hBucket = getLocalBucket(future3hDate);
  
  const future3hPattern = patterns.find(
    (p) => p.hour === future3hBucket.hour && (p.dayType === future3hBucket.dayType || p.dayType === String(future3hBucket.dayType))
  );

  let predictedRatio3h = currentRatio;
  if (future3hPattern) {
    const recencyWeight = 0.2; // 3h horizon trusts pattern much more than current state
    const currentBucket = getLocalBucket(now);
    const currentPattern = patterns.find(
      (p) => p.hour === currentBucket.hour && (p.dayType === currentBucket.dayType || p.dayType === String(currentBucket.dayType))
    );
    const currentPatternRatio = clamp(currentPattern?.occupancyAvg ?? currentRatio, 0, 1);
    const expectedDelta = clamp(future3hPattern.occupancyAvg, 0, 1) - currentPatternRatio;
    predictedRatio3h = clamp(currentRatio * recencyWeight + (currentRatio + expectedDelta) * (1 - recencyWeight), 0, 1);
  }

  const predictedRatio1h = pred60 && pred60.predictedBikesAvailable !== null
    ? pred60.predictedBikesAvailable / station.capacity
    : currentRatio;

  // Risk empty: if predicted ratio < 0.1, risk is high
  const computeEmptyRisk = (ratio: number) => {
    if (ratio >= targetBand.min) return 0;
    return clamp(1 - (ratio / Math.max(0.01, targetBand.min)), 0, 1) * confidence;
  };

  // Risk full: if predicted ratio > 0.9, risk is high
  const computeFullRisk = (ratio: number) => {
    if (ratio <= targetBand.max) return 0;
    return clamp((ratio - targetBand.max) / (1 - targetBand.max), 0, 1) * confidence;
  };

  const riskEmptyAt1h = computeEmptyRisk(predictedRatio1h);
  const riskFullAt1h = computeFullRisk(predictedRatio1h);
  const riskEmptyAt3h = computeEmptyRisk(predictedRatio3h);
  const riskFullAt3h = computeFullRisk(predictedRatio3h);

  // Demand proxy (rotation from patterns or metrics)
  // For simplicity, sum of rotation in current time band divided by hours
  const currentBand = getCurrentTimeBand(now.getHours());
  const currentBandMetrics = timeBandMetrics.find((m) => m.timeBand === currentBand);
  const avgDemandPerHour = currentBandMetrics ? currentBandMetrics.rotation : 0;
  
  const demandNextHour = avgDemandPerHour;
  const demandNext3Hours = avgDemandPerHour * 3;

  // Self correction: does the pattern return to target band naturally?
  let selfCorrectionProbability = 0;
  let estimatedRecoveryMinutes: number | null = null;

  const isCurrentlyOutOfBand = currentRatio < targetBand.min || currentRatio > targetBand.max;

  if (isCurrentlyOutOfBand) {
    // Check 1h, 2h, 3h, 4h out
    for (let h = 1; h <= 4; h++) {
      const checkDate = new Date(now.getTime() + h * 60 * 60_000);
      const checkBucket = getLocalBucket(checkDate);
      const checkPattern = patterns.find((p) => p.hour === checkBucket.hour);
      
      if (checkPattern) {
        if (checkPattern.occupancyAvg >= targetBand.min && checkPattern.occupancyAvg <= targetBand.max) {
          estimatedRecoveryMinutes = h * 60;
          selfCorrectionProbability = confidence;
          break;
        }
      }
    }
  }

  return {
    riskEmptyAt1h: Number(riskEmptyAt1h.toFixed(2)),
    riskEmptyAt3h: Number(riskEmptyAt3h.toFixed(2)),
    riskFullAt1h: Number(riskFullAt1h.toFixed(2)),
    riskFullAt3h: Number(riskFullAt3h.toFixed(2)),
    demandNextHour: Number(demandNextHour.toFixed(2)),
    demandNext3Hours: Number(demandNext3Hours.toFixed(2)),
    selfCorrectionProbability: Number(selfCorrectionProbability.toFixed(2)),
    estimatedRecoveryMinutes,
    confidence,
  };
}
