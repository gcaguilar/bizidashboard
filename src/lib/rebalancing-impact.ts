import type { StationDiagnostic, TransferRecommendation, BaselineComparison, ReportKPIs } from '@/types/rebalancing';

export function computeReportImpact(
  diagnostics: StationDiagnostic[],
  transfers: TransferRecommendation[]
): { kpis: ReportKPIs; baselineComparison: BaselineComparison } {
  // Service KPIs
  let sumPctEmpty = 0;
  let sumPctFull = 0;
  let sumCriticalDuration = 0;
  let totalRotation = 0;
  let estimatedLostUses = 0;

  for (const d of diagnostics) {
    sumPctEmpty += d.globalMetrics.pctTimeEmpty;
    sumPctFull += d.globalMetrics.pctTimeFull;
    sumCriticalDuration += d.globalMetrics.criticalEpisodeAvgMinutes;
    totalRotation += d.globalMetrics.rotation;
    estimatedLostUses += d.globalMetrics.unsatisfiedDemandProxy;
  }

  const stationCount = Math.max(1, diagnostics.length);

  const service = {
    pctTimeEmpty: Number((sumPctEmpty / stationCount).toFixed(4)),
    pctTimeFull: Number((sumPctFull / stationCount).toFixed(4)),
    avgCriticalEpisodeMinutes: Number((sumCriticalDuration / stationCount).toFixed(1)),
    totalRotation: Math.round(totalRotation),
    estimatedLostUses: Math.round(estimatedLostUses),
  };

  // Operation KPIs
  const totalBikesMoved = transfers.reduce((acc, t) => acc + t.bikesToMove, 0);
  const totalCostScore = transfers.reduce((acc, t) => acc + t.expectedImpact.costScore, 0);
  const avgCostPerTransfer = transfers.length > 0 ? totalCostScore / transfers.length : 0;

  const operation = {
    suggestedTransfers: transfers.length,
    totalBikesMoved,
    totalCostScore: Number(totalCostScore.toFixed(2)),
    avgCostPerTransfer: Number(avgCostPerTransfer.toFixed(2)),
  };

  // Impact KPIs (recommended)
  const totalEmptiesAvoided = transfers.reduce((acc, t) => acc + t.expectedImpact.emptiesAvoided, 0);
  const totalFullsAvoided = transfers.reduce((acc, t) => acc + t.expectedImpact.fullsAvoided, 0);
  const totalUsesRecovered = transfers.reduce((acc, t) => acc + t.expectedImpact.usesRecovered, 0);
  const totalIncidents = totalEmptiesAvoided + totalFullsAvoided;
  const costPerIncidentAvoided = totalIncidents > 0 ? totalCostScore / totalIncidents : 0;

  const impact = {
    totalEmptiesAvoided,
    totalFullsAvoided,
    totalUsesRecovered,
    costPerIncidentAvoided: Number(costPerIncidentAvoided.toFixed(2)),
    improvementVsBaseline: 0, // Computed below
  };

  // Baseline A: Do Nothing
  const doNothing = {
    totalEmptiesAvoided: 0,
    totalFullsAvoided: 0,
    totalUsesRecovered: 0,
    costPerIncidentAvoided: 0,
    improvementVsBaseline: 0,
  };

  // Baseline B: Simple Rules (e.g. naive heuristic moving bikes if > 80% or < 20%)
  // Estimation: say simple rules only catch 50% of the true predictive risk
  let simpleEmptiesAvoided = 0;
  let simpleFullsAvoided = 0;

  for (const d of diagnostics) {
    const ratio = d.capacity > 0 ? d.currentBikes / d.capacity : 0;
    if (ratio < 0.20) {
      simpleEmptiesAvoided += Math.round(d.risk.riskEmptyAt1h * 2); // Assume naive moves 2 bikes
    }
    if (ratio > 0.80) {
      simpleFullsAvoided += Math.round(d.risk.riskFullAt1h * 2);
    }
  }

  const simpleCost = (simpleEmptiesAvoided + simpleFullsAvoided) * 1.5; // Guessed average cost

  const simpleRules = {
    totalEmptiesAvoided: simpleEmptiesAvoided,
    totalFullsAvoided: simpleFullsAvoided,
    totalUsesRecovered: Math.round(simpleEmptiesAvoided * 2), // Rough estimate
    costPerIncidentAvoided: Number((simpleCost / Math.max(1, simpleEmptiesAvoided + simpleFullsAvoided)).toFixed(2)),
    improvementVsBaseline: 0,
  };

  // Relative improvement vs simple rules
  const ourIncidents = impact.totalEmptiesAvoided + impact.totalFullsAvoided;
  const simpleIncidents = simpleRules.totalEmptiesAvoided + simpleRules.totalFullsAvoided;
  
  if (simpleIncidents > 0) {
    impact.improvementVsBaseline = Number(((ourIncidents - simpleIncidents) / simpleIncidents).toFixed(2));
  } else if (ourIncidents > 0) {
    impact.improvementVsBaseline = 1.0;
  }

  return {
    kpis: { service, operation, impact },
    baselineComparison: { doNothing, simpleRules, recommended: impact },
  };
}
