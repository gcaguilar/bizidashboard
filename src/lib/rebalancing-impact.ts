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
    systemPctTimeEmpty: Number((sumPctEmpty / stationCount).toFixed(4)),
    systemPctTimeFull: Number((sumPctFull / stationCount).toFixed(4)),
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
    improvementVsBaselinePct: null as number | null,
  };

  // Baseline A: Do Nothing
  const doNothing = {
    label: 'Sin intervención',
    totalMoves: 0,
    emptiesAvoided: 0,
    fullsAvoided: 0,
    totalEmptiesAvoided: 0,
    totalFullsAvoided: 0,
    totalUsesRecovered: 0,
    costPerIncidentAvoided: 0,
    improvementVsBaseline: 0,
    improvementVsBaselinePct: 0,
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
    label: 'Reglas simples',
    totalMoves: Math.round((simpleEmptiesAvoided + simpleFullsAvoided) / 2),
    emptiesAvoided: simpleEmptiesAvoided,
    fullsAvoided: simpleFullsAvoided,
    totalEmptiesAvoided: simpleEmptiesAvoided,
    totalFullsAvoided: simpleFullsAvoided,
    totalUsesRecovered: Math.round(simpleEmptiesAvoided * 2), // Rough estimate
    costPerIncidentAvoided: Number((simpleCost / Math.max(1, simpleEmptiesAvoided + simpleFullsAvoided)).toFixed(2)),
    improvementVsBaseline: 0,
    improvementVsBaselinePct: 0,
  };

  // Relative improvement vs simple rules
  const ourIncidents = impact.totalEmptiesAvoided + impact.totalFullsAvoided;
  const simpleIncidents = simpleRules.totalEmptiesAvoided + simpleRules.totalFullsAvoided;
  
  if (simpleIncidents > 0) {
    impact.improvementVsBaseline = Number(((ourIncidents - simpleIncidents) / simpleIncidents).toFixed(2));
  } else if (ourIncidents > 0) {
    impact.improvementVsBaseline = 1.0;
  }
  impact.improvementVsBaselinePct = Number((impact.improvementVsBaseline * 100).toFixed(1));

  return {
    kpis: { service, operation, impact },
    baselineComparison: {
      doNothing,
      simpleRules,
      recommended: {
        label: 'Sistema recomendado',
        totalMoves: transfers.length,
        emptiesAvoided: impact.totalEmptiesAvoided,
        fullsAvoided: impact.totalFullsAvoided,
        ...impact,
      },
    },
  };
}

export function computeReportKPIs(
  diagnostics: StationDiagnostic[],
  transfers: TransferRecommendation[]
) {
  const { kpis } = computeReportImpact(diagnostics, transfers);
  return {
    ...kpis,
    service: {
      ...kpis.service,
      systemPctTimeEmpty: kpis.service.pctTimeEmpty,
      systemPctTimeFull: kpis.service.pctTimeFull,
    },
  };
}

export function computeBaselineComparison(
  diagnostics: StationDiagnostic[],
  transfers: TransferRecommendation[]
) {
  const { baselineComparison } = computeReportImpact(diagnostics, transfers);
  return {
    doNothing: {
      ...baselineComparison.doNothing,
      label: baselineComparison.doNothing.label ?? 'Do nothing',
      totalMoves: baselineComparison.doNothing.totalMoves ?? 0,
      emptiesAvoided: baselineComparison.doNothing.emptiesAvoided ?? 0,
      fullsAvoided: baselineComparison.doNothing.fullsAvoided ?? 0,
    },
    simpleRules: {
      ...baselineComparison.simpleRules,
      label: baselineComparison.simpleRules.label ?? 'Simple rules',
      totalMoves: baselineComparison.simpleRules.totalMoves ?? transfers.length,
      emptiesAvoided:
        baselineComparison.simpleRules.emptiesAvoided ??
        baselineComparison.simpleRules.totalEmptiesAvoided,
      fullsAvoided:
        baselineComparison.simpleRules.fullsAvoided ??
        baselineComparison.simpleRules.totalFullsAvoided,
    },
    recommended: {
      ...baselineComparison.recommended,
      label: baselineComparison.recommended.label ?? 'Recommended',
      totalMoves: baselineComparison.recommended.totalMoves ?? transfers.length,
      emptiesAvoided:
        baselineComparison.recommended.emptiesAvoided ??
        baselineComparison.recommended.totalEmptiesAvoided,
      fullsAvoided:
        baselineComparison.recommended.fullsAvoided ??
        baselineComparison.recommended.totalFullsAvoided,
    },
  };
}
