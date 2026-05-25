import { describe, expect, it } from 'vitest';
import { compactInitialRebalancingReport } from '@/server-functions/dashboard-redistribucion';
import type { RebalancingReport } from '@/types/rebalancing';

describe('dashboard redistribucion server data', () => {
  it('keeps the initial SSR payload compact while preserving visible counts', () => {
    const report = {
      generatedAt: '2026-01-01T00:00:00.000Z',
      modelVersion: 'test',
      analysisWindowDays: 15,
      districtFilter: null,
      summary: {
        totalStations: 1,
        byClassification: { overstock: 0, deficit: 0, peak_saturation: 0, peak_emptying: 0, balanced: 1, data_review: 0 },
        byAction: { donor: 0, receptor: 0, peak_remove: 0, peak_fill: 0, stable: 1, review: 0 },
        criticalUrgencyCount: 0,
        highUrgencyCount: 0,
        stationsWithTransfer: 0,
      },
      diagnostics: [
        {
          stationId: '1',
          stationName: 'Station',
          districtName: null,
          capacity: 10,
          currentBikes: 5,
          currentAnchors: 5,
          currentOccupancy: 0.5,
          inferredType: 'mixed',
          classification: 'balanced',
          classificationReasons: ['ok'],
          globalMetrics: {
            occupancyAvg: 0.5,
            pctTimeEmpty: 0,
            pctTimeFull: 0,
            rotation: 0,
            rotationPerBike: 0,
            persistenceProxy: 0,
            criticalEpisodeAvgMinutes: 0,
            netImbalance: 0,
            variability: 0,
            unsatisfiedDemandProxy: 0,
          },
          timeBandMetrics: [
            {
              timeBand: 'morning_peak',
              dayCategory: 'weekday',
              occupancyAvg: 0.5,
              pctTimeEmpty: 0,
              pctTimeFull: 0,
              rotation: 0,
              rotationPerBike: 0,
              persistenceProxy: 0,
              criticalEpisodeAvgMinutes: 0,
              netImbalance: 0,
              variability: 0,
              unsatisfiedDemandProxy: 0,
            },
          ],
          targetBand: { min: 0.3, max: 0.7 },
          currentTimeBand: 'morning_peak',
          risk: {
            riskEmptyAt1h: 0,
            riskEmptyAt3h: 0,
            riskFullAt1h: 0,
            riskFullAt3h: 0,
            demandNextHour: 0,
            demandNext3Hours: 0,
            selfCorrectionProbability: 1,
            estimatedRecoveryMinutes: null,
            confidence: 1,
          },
          network: {
            nearbyStations: [
              { stationId: '2', distanceMeters: 100, walkingTimeMinutes: 2, currentOccupancy: 0.5, historicalRobustness: 1 },
            ],
            clusterCapacity: 10,
            clusterAvailability: 5,
            urgencyAdjustment: 0,
          },
          actionGroup: 'stable',
          actionReasons: ['ok'],
          urgency: 'none',
          priorityScore: 0,
        },
      ],
      transfers: [],
      kpis: {
        service: { pctTimeEmpty: 0, pctTimeFull: 0, systemPctTimeEmpty: 0, systemPctTimeFull: 0, avgCriticalEpisodeMinutes: 0, totalRotation: 0, estimatedLostUses: 0 },
        operation: { suggestedTransfers: 0, totalBikesMoved: 0, totalCostScore: 0, avgCostPerTransfer: 0 },
        impact: { totalEmptiesAvoided: 0, totalFullsAvoided: 0, totalUsesRecovered: 0, costPerIncidentAvoided: 0, improvementVsBaseline: 0, improvementVsBaselinePct: null },
      },
      baselineComparison: {
        doNothing: { label: 'none', totalMoves: 0, emptiesAvoided: 0, fullsAvoided: 0, totalEmptiesAvoided: 0, totalFullsAvoided: 0, totalUsesRecovered: 0, costPerIncidentAvoided: 0, improvementVsBaseline: 0, improvementVsBaselinePct: null },
        simpleRules: { label: 'simple', totalMoves: 0, emptiesAvoided: 0, fullsAvoided: 0, totalEmptiesAvoided: 0, totalFullsAvoided: 0, totalUsesRecovered: 0, costPerIncidentAvoided: 0, improvementVsBaseline: 0, improvementVsBaselinePct: null },
        recommended: { label: 'recommended', totalMoves: 0, emptiesAvoided: 0, fullsAvoided: 0, totalEmptiesAvoided: 0, totalFullsAvoided: 0, totalUsesRecovered: 0, costPerIncidentAvoided: 0, improvementVsBaseline: 0, improvementVsBaselinePct: null },
      },
    } satisfies RebalancingReport;

    const compact = compactInitialRebalancingReport(report);

    expect(compact.diagnostics[0]?.timeBandMetrics).toEqual([]);
    expect(compact.diagnostics[0]?.network.nearbyStations).toEqual([]);
    expect(compact.diagnostics[0]?.network.nearbyStationCount).toBe(1);
  });
});
