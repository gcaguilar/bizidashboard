import type {
  StationDiagnostic,
  TransferRecommendation,
  ReportKPIs,
  BaselineComparison,
  BaselineScenario,
  ServiceKPIs,
  OperationKPIs,
  ImpactKPIs,
} from '@/types/rebalancing';

// ─── Service KPIs ────────────────────────────────────────────────────────────

function computeServiceKPIs(diagnostics: StationDiagnostic[]): ServiceKPIs {
  if (diagnostics.length === 0) {
    return {
      systemPctTimeEmpty: 0,
      systemPctTimeFull: 0,
      avgCriticalEpisodeMinutes: 0,
      totalRotation: 0,
      estimatedLostUses: 0,
    };
  }

  const systemPctTimeEmpty =
    diagnostics.reduce((sum, d) => sum + d.globalMetrics.pctTimeEmpty, 0) / diagnostics.length;

  const systemPctTimeFull =
    diagnostics.reduce((sum, d) => sum + d.globalMetrics.pctTimeFull, 0) / diagnostics.length;

  const avgCriticalEpisodeMinutes =
    diagnostics.reduce((sum, d) => sum + d.globalMetrics.criticalEpisodeAvgMinutes, 0) /
    diagnostics.length;

  const totalRotation = diagnostics.reduce((sum, d) => sum + d.globalMetrics.rotation, 0);

  const estimatedLostUses = diagnostics.reduce(
    (sum, d) => sum + d.globalMetrics.unsatisfiedDemandProxy,
    0
  );

  return {
    systemPctTimeEmpty,
    systemPctTimeFull,
    avgCriticalEpisodeMinutes,
    totalRotation,
    estimatedLostUses,
  };
}

// ─── Operation KPIs ──────────────────────────────────────────────────────────

function computeOperationKPIs(transfers: TransferRecommendation[]): OperationKPIs {
  if (transfers.length === 0) {
    return { suggestedTransfers: 0, totalBikesMoved: 0, totalCostScore: 0, avgCostPerTransfer: 0 };
  }

  const totalBikesMoved = transfers.reduce((sum, t) => sum + t.bikesToMove, 0);
  const totalCostScore = transfers.reduce(
    (sum, t) => sum + (1 - t.expectedImpact.costScore) * t.bikesToMove,
    0
  );

  return {
    suggestedTransfers: transfers.length,
    totalBikesMoved,
    totalCostScore,
    avgCostPerTransfer: transfers.length > 0 ? totalCostScore / transfers.length : 0,
  };
}

// ─── Impact KPIs ─────────────────────────────────────────────────────────────

function computeImpactKPIs(
  transfers: TransferRecommendation[],
  service: ServiceKPIs
): ImpactKPIs {
  const totalEmptiesAvoided = transfers.reduce(
    (sum, t) => sum + t.expectedImpact.emptiesAvoided,
    0
  );
  const totalFullsAvoided = transfers.reduce(
    (sum, t) => sum + t.expectedImpact.fullsAvoided,
    0
  );
  const totalUsesRecovered = transfers.reduce(
    (sum, t) => sum + t.expectedImpact.usesRecovered,
    0
  );

  const totalIncidentsAvoided = totalEmptiesAvoided + totalFullsAvoided;
  const totalCostScore = transfers.reduce(
    (sum, t) => sum + (1 - t.expectedImpact.costScore) * t.bikesToMove,
    0
  );

  const costPerIncidentAvoided =
    totalIncidentsAvoided > 0 ? totalCostScore / totalIncidentsAvoided : null;

  // Improvement vs baseline (do-nothing): percentage of estimated lost uses recovered
  const improvementVsBaselinePct =
    service.estimatedLostUses > 0
      ? Math.min(100, (totalUsesRecovered / service.estimatedLostUses) * 100)
      : null;

  return {
    totalEmptiesAvoided,
    totalFullsAvoided,
    totalUsesRecovered,
    costPerIncidentAvoided,
    improvementVsBaselinePct,
  };
}

// ─── Baseline comparison ─────────────────────────────────────────────────────

function buildDoNothingBaseline(): BaselineScenario {
  return {
    label: 'Sin intervención',
    emptiesAvoided: 0,
    fullsAvoided: 0,
    totalMoves: 0,
    totalCostScore: 0,
    costPerIncidentAvoided: null,
  };
}

/**
 * Simulates a naive "simple fixed rules" baseline:
 * Move bikes to any station outside 20-80% occupancy, no prediction or network check.
 * Assumes 50% effectiveness.
 */
function buildSimpleRulesBaseline(diagnostics: StationDiagnostic[]): BaselineScenario {
  const candidates = diagnostics.filter(
    (d) =>
      d.classification !== 'data_review' &&
      (d.currentOccupancy < 0.20 || d.currentOccupancy > 0.80)
  );

  const totalMoves = candidates.reduce((sum, d) => {
    const deficit = d.currentOccupancy < 0.20
      ? Math.max(2, Math.round((0.20 - d.currentOccupancy) * d.capacity))
      : Math.max(2, Math.round((d.currentOccupancy - 0.80) * d.capacity));
    return sum + deficit;
  }, 0);

  // 50% effectiveness assumed
  const effectiveness = 0.5;
  const totalEmptiesAvoided =
    candidates.filter((d) => d.currentOccupancy < 0.20).length * effectiveness;
  const totalFullsAvoided =
    candidates.filter((d) => d.currentOccupancy > 0.80).length * effectiveness;
  const totalIncidents = totalEmptiesAvoided + totalFullsAvoided;
  const costScore = totalMoves * 0.7; // fixed rules are less efficient, higher cost

  return {
    label: 'Reglas fijas simples (20/80%)',
    emptiesAvoided: totalEmptiesAvoided,
    fullsAvoided: totalFullsAvoided,
    totalMoves,
    totalCostScore: costScore,
    costPerIncidentAvoided: totalIncidents > 0 ? costScore / totalIncidents : null,
  };
}

function buildRecommendedBaseline(transfers: TransferRecommendation[]): BaselineScenario {
  const totalEmptiesAvoided = transfers.reduce(
    (sum, t) => sum + t.expectedImpact.emptiesAvoided,
    0
  );
  const totalFullsAvoided = transfers.reduce(
    (sum, t) => sum + t.expectedImpact.fullsAvoided,
    0
  );
  const totalMoves = transfers.reduce((sum, t) => sum + t.bikesToMove, 0);
  const totalCostScore = transfers.reduce(
    (sum, t) => sum + (1 - t.expectedImpact.costScore) * t.bikesToMove,
    0
  );
  const totalIncidents = totalEmptiesAvoided + totalFullsAvoided;

  return {
    label: 'Sistema recomendado',
    emptiesAvoided: totalEmptiesAvoided,
    fullsAvoided: totalFullsAvoided,
    totalMoves,
    totalCostScore,
    costPerIncidentAvoided: totalIncidents > 0 ? totalCostScore / totalIncidents : null,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function computeReportKPIs(
  diagnostics: StationDiagnostic[],
  transfers: TransferRecommendation[]
): ReportKPIs {
  const service = computeServiceKPIs(diagnostics);
  const operation = computeOperationKPIs(transfers);
  const impact = computeImpactKPIs(transfers, service);
  return { service, operation, impact };
}

export function computeBaselineComparison(
  diagnostics: StationDiagnostic[],
  transfers: TransferRecommendation[]
): BaselineComparison {
  return {
    doNothing: buildDoNothingBaseline(),
    simpleRules: buildSimpleRulesBaseline(diagnostics),
    recommended: buildRecommendedBaseline(transfers),
  };
}
