import type {
  StationClassification,
  ActionGroup,
  Urgency,
  RiskAssessment,
  NetworkContext,
  TargetBand,
  TimeBand,
} from '@/types/rebalancing';

export type DecisionResult = {
  actionGroup: ActionGroup;
  urgency: Urgency;
  reasons: string[];
  priorityScore: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

function urgencyToWeight(urgency: Urgency): number {
  const weights: Record<Urgency, number> = {
    critical: 1.0,
    high: 0.80,
    medium: 0.50,
    low: 0.20,
    none: 0.0,
  };
  return weights[urgency];
}

function riskToUrgency(risk: number): Urgency {
  if (risk >= 0.85) return 'critical';
  if (risk >= 0.65) return 'high';
  if (risk >= 0.40) return 'medium';
  if (risk >= 0.20) return 'low';
  return 'none';
}

/**
 * Check if current time band is 30–90 minutes before a known problematic peak.
 * Used for preventive interventions.
 */
function isBeforePeakBand(currentTimeBand: TimeBand, problematicBand: TimeBand): boolean {
  const order: TimeBand[] = ['night', 'morning_peak', 'valley', 'evening_peak'];
  const currentIdx = order.indexOf(currentTimeBand);
  const targetIdx = order.indexOf(problematicBand);
  return currentIdx === targetIdx - 1;
}

// ─── Main decision function ──────────────────────────────────────────────────

/**
 * Decides the recommended operational action for a station.
 *
 * Rules applied in priority order (first match wins):
 *   Rule 0 – Data review: skip logistics
 *   Rule 1 – Self-correction: station fixes itself, do not intervene
 *   Rule 2 – Network absorbs: nearby robust alternatives, reduce urgency
 *   Rule 3 – Donor: has surplus, downstream needs bikes
 *   Rule 4 – Receptor: has deficit, needs bikes
 *   Rule 5 – Preventive peak removal (peak_remove)
 *   Rule 6 – Preventive peak fill (peak_fill)
 *   Rule 7 – Stable (default)
 */
export function decideAction(
  classification: StationClassification,
  currentOccupancy: number,
  targetBand: TargetBand,
  currentTimeBand: TimeBand,
  risk: RiskAssessment,
  network: NetworkContext,
  maxDemandAcrossStations: number
): DecisionResult {
  const reasons: string[] = [];

  // ─── Rule 0: Data review ──────────────────────────────────────────────────
  if (classification === 'data_review') {
    return {
      actionGroup: 'review',
      urgency: 'none',
      reasons: ['Dato anonimo: excluida de decisiones logisticas hasta validar el sensor.'],
      priorityScore: 0,
    };
  }

  // ─── Rule 1: Self-correction ──────────────────────────────────────────────
  if (
    risk.selfCorrectionProbability > 0.70 &&
    risk.estimatedRecoveryMinutes !== null &&
    risk.estimatedRecoveryMinutes <= 45
  ) {
    reasons.push(
      `La estacion se autocorrige en ~${risk.estimatedRecoveryMinutes} min ` +
      `segun patron historico (probabilidad ${fmt(risk.selfCorrectionProbability)}).`
    );
    return { actionGroup: 'stable', urgency: 'none', reasons, priorityScore: 0 };
  }

  // ─── Rule 2: Network absorbs ──────────────────────────────────────────────
  const deviation = Math.abs(currentOccupancy - (targetBand.min + targetBand.max) / 2);
  if (network.urgencyAdjustment < 0.6 && deviation < 0.15) {
    const robustCount = network.nearbyStations.filter((s) => s.historicalRobustness >= 0.4).length;
    reasons.push(
      `${robustCount} estacion(es) cercana(s) robusta(s) pueden absorber la demanda. ` +
      `Desviacion de banda (${fmt(deviation)}) es moderada.`
    );
    return { actionGroup: 'stable', urgency: 'low', reasons, priorityScore: 0.05 };
  }

  // ─── Rule 5 and 6: Preventive peak interventions (checked before donor/receptor) ──
  if (
    classification === 'peak_saturation' &&
    isBeforePeakBand(currentTimeBand, 'morning_peak')
  ) {
    reasons.push(`Retirada preventiva recomendada antes de la hora punta de manana.`);
    const urgency = risk.riskFullAt1h > 0.5 ? 'high' : 'medium';
    const score = computePriorityScore(urgency, risk, network, maxDemandAcrossStations);
    return { actionGroup: 'peak_remove', urgency, reasons, priorityScore: score };
  }

  if (
    classification === 'peak_saturation' &&
    isBeforePeakBand(currentTimeBand, 'evening_peak')
  ) {
    reasons.push(`Retirada preventiva recomendada antes de la hora punta de tarde.`);
    const urgency = risk.riskFullAt1h > 0.5 ? 'high' : 'medium';
    const score = computePriorityScore(urgency, risk, network, maxDemandAcrossStations);
    return { actionGroup: 'peak_remove', urgency, reasons, priorityScore: score };
  }

  if (
    classification === 'peak_emptying' &&
    isBeforePeakBand(currentTimeBand, 'morning_peak')
  ) {
    reasons.push(`Pre-reposicion recomendada antes de la hora punta de manana.`);
    const urgency = risk.riskEmptyAt1h > 0.5 ? 'high' : 'medium';
    const score = computePriorityScore(urgency, risk, network, maxDemandAcrossStations);
    return { actionGroup: 'peak_fill', urgency, reasons, priorityScore: score };
  }

  if (
    classification === 'peak_emptying' &&
    isBeforePeakBand(currentTimeBand, 'evening_peak')
  ) {
    reasons.push(`Pre-reposicion recomendada antes de la hora punta de tarde.`);
    const urgency = risk.riskEmptyAt1h > 0.5 ? 'high' : 'medium';
    const score = computePriorityScore(urgency, risk, network, maxDemandAcrossStations);
    return { actionGroup: 'peak_fill', urgency, reasons, priorityScore: score };
  }

  // ─── Rule 3: Donor ────────────────────────────────────────────────────────
  const isAboveBand = currentOccupancy > targetBand.max;
  const isDonorCandidate =
    isAboveBand ||
    classification === 'overstock' ||
    (classification === 'peak_saturation' && risk.riskFullAt1h > 0.5);

  if (isDonorCandidate) {
    const maxRisk = Math.max(risk.riskFullAt1h, risk.riskFullAt3h);
    const urgency = riskToUrgency(maxRisk * network.urgencyAdjustment);
    reasons.push(
      `Ocupacion actual ${fmt(currentOccupancy)} por encima de maximo objetivo ${fmt(targetBand.max)}. ` +
      `Riesgo de llenado a 1h: ${fmt(risk.riskFullAt1h)}.`
    );
    if (classification === 'overstock') reasons.push(`Clasificacion: sobrestock estructural.`);
    const score = computePriorityScore(urgency, risk, network, maxDemandAcrossStations);
    return { actionGroup: 'donor', urgency, reasons, priorityScore: score };
  }

  // ─── Rule 4: Receptor ────────────────────────────────────────────────────
  const isBelowBand = currentOccupancy < targetBand.min;
  const isReceptorCandidate =
    isBelowBand ||
    classification === 'deficit' ||
    (classification === 'peak_emptying' && risk.riskEmptyAt1h > 0.5);

  if (isReceptorCandidate) {
    const maxRisk = Math.max(risk.riskEmptyAt1h, risk.riskEmptyAt3h);
    const urgency = riskToUrgency(maxRisk * network.urgencyAdjustment);
    reasons.push(
      `Ocupacion actual ${fmt(currentOccupancy)} por debajo de minimo objetivo ${fmt(targetBand.min)}. ` +
      `Riesgo de vaciado a 1h: ${fmt(risk.riskEmptyAt1h)}.`
    );
    if (classification === 'deficit') reasons.push(`Clasificacion: deficit estructural.`);
    const score = computePriorityScore(urgency, risk, network, maxDemandAcrossStations);
    return { actionGroup: 'receptor', urgency, reasons, priorityScore: score };
  }

  // ─── Rule 7: Stable (default) ────────────────────────────────────────────
  reasons.push(
    `Estacion dentro de banda objetivo (${fmt(targetBand.min)}-${fmt(targetBand.max)}). ` +
    `Ocupacion actual: ${fmt(currentOccupancy)}.`
  );
  return { actionGroup: 'stable', urgency: 'none', reasons, priorityScore: 0 };
}

// ─── Priority score ──────────────────────────────────────────────────────────

/**
 * Computes a composite priority score (0–1) for ordering the intervention queue.
 *
 * priorityScore = urgencyWeight × demandWeight × networkWeight
 */
function computePriorityScore(
  urgency: Urgency,
  risk: RiskAssessment,
  network: NetworkContext,
  maxDemandAcrossStations: number
): number {
  const urgencyWeight = urgencyToWeight(urgency);
  const demandWeight =
    maxDemandAcrossStations > 0 ? risk.demandNextHour / maxDemandAcrossStations : 0.5;
  const networkWeight = network.urgencyAdjustment;

  return Math.min(1, urgencyWeight * Math.max(0.1, demandWeight) * networkWeight);
}
