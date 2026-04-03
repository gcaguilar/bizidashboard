import type { ActionGroup, Urgency, StationDiagnostic } from '@/types/rebalancing';

export function decideAction(
  diagnostic: Partial<StationDiagnostic>
): { actionGroup: ActionGroup; urgency: Urgency; reasons: string[]; priorityScore: number } {
  const reasons: string[] = [];
  const risk = diagnostic.risk!;
  const classification = diagnostic.classification!;
  const network = diagnostic.network!;
  const targetBand = diagnostic.targetBand!;
  const currentRatio = diagnostic.capacity! > 0 ? diagnostic.currentBikes! / diagnostic.capacity! : 0;
  
  const calculatePriority = (urgencyWeight: number, demandWeightBase: number) => {
    // Normalizing demand between 0 and 1 roughly (say max 20 rotations per hour)
    const demandWeight = Math.min(1, demandWeightBase / 20);
    const networkWeight = network.urgencyAdjustment; // 1.0 down to 0.5 depending on alternatives
    return Number((urgencyWeight * (0.5 + 0.5 * demandWeight) * networkWeight).toFixed(2));
  };

  // Rule 0: Review
  if (classification === 'data_review') {
    reasons.push("Estacion marcada para revision de calidad de datos. No se recomienda accion automatica.");
    return { actionGroup: 'review', urgency: 'none', reasons, priorityScore: 0 };
  }

  // Rule 1: No-move (self-correction)
  if (risk.selfCorrectionProbability > 0.7 && risk.estimatedRecoveryMinutes !== null && risk.estimatedRecoveryMinutes < 45) {
    reasons.push(`La estacion se autocorrige en ~${risk.estimatedRecoveryMinutes} min segun el patron historico.`);
    return { actionGroup: 'stable', urgency: 'none', reasons, priorityScore: 0 };
  }

  // Rule 2: No-move (network absorbs)
  // Only apply this rule if we are not severely out of band (e.g. deviation < 15%)
  const isSlightlyOut = currentRatio < targetBand.min - 0.15 || currentRatio > targetBand.max + 0.15;
  if (!isSlightlyOut && network.urgencyAdjustment < 0.6) {
    const alts = network.nearbyStations.filter(n => n.historicalRobustness > 0.4).map(n => n.stationId).join(', ');
    reasons.push(`Estaciones cercanas (${alts}) pueden absorber la demanda actual.`);
    return { actionGroup: 'stable', urgency: 'low', reasons, priorityScore: calculatePriority(0.2, risk.demandNextHour) };
  }

  // Rule 3: Donor
  if (currentRatio > targetBand.max && (risk.riskFullAt1h > 0.5 || classification === 'overstock' || classification === 'peak_saturation')) {
    let urgency: Urgency = 'low';
    let weight = 0.4;
    
    if (risk.riskFullAt1h > 0.8 || currentRatio >= 0.95) {
      urgency = 'high';
      weight = 0.8;
    } else if (risk.riskFullAt1h > 0.5 || currentRatio > 0.8) {
      urgency = 'medium';
      weight = 0.6;
    }

    reasons.push(`Exceso de stock detectado (Ocupacion: ${(currentRatio * 100).toFixed(0)}% > Max: ${(targetBand.max * 100).toFixed(0)}%). Riesgo de saturacion a 1h: ${(risk.riskFullAt1h * 100).toFixed(0)}%.`);
    return { actionGroup: 'donor', urgency, reasons, priorityScore: calculatePriority(weight, risk.demandNextHour) };
  }

  // Rule 4: Receptor
  if (currentRatio < targetBand.min && (risk.riskEmptyAt1h > 0.5 || classification === 'deficit' || classification === 'peak_emptying')) {
    let urgency: Urgency = 'low';
    let weight = 0.4;

    if (risk.riskEmptyAt1h > 0.8 || currentRatio <= 0.05) {
      urgency = 'critical';
      weight = 1.0;
    } else if (risk.riskEmptyAt1h > 0.5 || currentRatio < 0.2) {
      urgency = 'high';
      weight = 0.8;
    }

    reasons.push(`Deficit detectado (Ocupacion: ${(currentRatio * 100).toFixed(0)}% < Min: ${(targetBand.min * 100).toFixed(0)}%). Riesgo de vaciado a 1h: ${(risk.riskEmptyAt1h * 100).toFixed(0)}%.`);
    return { actionGroup: 'receptor', urgency, reasons, priorityScore: calculatePriority(weight, risk.demandNextHour) };
  }

  // Rule 5: Peak remove
  if (classification === 'peak_saturation' && currentRatio >= targetBand.max) {
    reasons.push(`Retirada preventiva antes de hora punta para evitar saturacion.`);
    return { actionGroup: 'peak_remove', urgency: 'medium', reasons, priorityScore: calculatePriority(0.6, risk.demandNextHour) };
  }

  // Rule 6: Peak fill
  if (classification === 'peak_emptying' && currentRatio <= targetBand.min) {
    reasons.push(`Pre-reposicion antes de hora punta para evitar vaciado.`);
    return { actionGroup: 'peak_fill', urgency: 'medium', reasons, priorityScore: calculatePriority(0.6, risk.demandNextHour) };
  }

  // Rule 7: Stable
  reasons.push(`Operacion normal dentro de parametros aceptables.`);
  return { actionGroup: 'stable', urgency: 'none', reasons, priorityScore: 0 };
}
