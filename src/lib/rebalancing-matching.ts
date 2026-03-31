import type {
  StationDiagnostic,
  TransferRecommendation,
  TransferImpact,
  LogisticsConfig,
} from '@/types/rebalancing';

// ─── Default config ──────────────────────────────────────────────────────────

export const DEFAULT_LOGISTICS_CONFIG: LogisticsConfig = {
  vehicleCapacity: 20,
  maxTransferDistanceMeters: 3000,
  operationalWindows: [
    { start: '06:00', end: '10:00' },
    { start: '15:00', end: '20:00' },
  ],
  costPerKm: 2.5,
  costPerBike: 0.5,
  minBikesToMove: 2,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function currentOperationalWindow(config: LogisticsConfig): { start: string; end: string } {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentMinutes = hour * 60 + minute;

  for (const window of config.operationalWindows) {
    const [startH, startM] = window.start.split(':').map(Number);
    const [endH, endM] = window.end.split(':').map(Number);
    const windowStart = startH * 60 + (startM ?? 0);
    const windowEnd = endH * 60 + (endM ?? 0);
    if (currentMinutes >= windowStart && currentMinutes <= windowEnd) {
      return window;
    }
  }
  // Default: next operational window
  return config.operationalWindows[0] ?? { start: '06:00', end: '10:00' };
}

function computeTransferImpact(
  donor: StationDiagnostic,
  receptor: StationDiagnostic,
  bikesToMove: number,
  windowHours: number
): TransferImpact {
  const moveFraction = donor.capacity > 0 ? bikesToMove / donor.capacity : 0;

  // Empties avoided: reduce receptor's empty fraction proportional to bikes added
  const emptiesAvoided = receptor.globalMetrics.pctTimeEmpty * windowHours * moveFraction * 0.8;

  // Fulls avoided: reduce donor's full fraction proportional to bikes removed
  const fullsAvoided = donor.globalMetrics.pctTimeFull * windowHours * moveFraction * 0.8;

  // Uses recovered: empty hours avoided × avg demand per hour in peak
  const peakBands = receptor.timeBandMetrics.filter(
    (b) => b.timeBand === 'morning_peak' || b.timeBand === 'evening_peak'
  );
  const avgDemandPerHour =
    peakBands.length > 0
      ? peakBands.reduce((sum, b) => sum + b.rotation, 0) / peakBands.length / 2
      : receptor.globalMetrics.rotation / Math.max(receptor.globalMetrics.rotation, 1);

  const usesRecovered = emptiesAvoided * Math.max(avgDemandPerHour, 0.5);

  // Logistics cost score: closer + fewer bikes = cheaper (0-1, higher = cheaper)
  const nearbyDonor = receptor.network.nearbyStations.find(
    (s) => s.stationId === donor.stationId
  );
  const distanceMeters = nearbyDonor?.distanceMeters ?? config_maxDistance;
  const costScore = Math.max(
    0,
    1 - (distanceMeters / config_maxDistance) * (bikesToMove / DEFAULT_LOGISTICS_CONFIG.vehicleCapacity)
  );

  return {
    emptiesAvoided: Math.max(0, emptiesAvoided),
    fullsAvoided: Math.max(0, fullsAvoided),
    usesRecovered: Math.max(0, usesRecovered),
    costScore,
  };
}

const config_maxDistance = DEFAULT_LOGISTICS_CONFIG.maxTransferDistanceMeters;

// ─── Match score ─────────────────────────────────────────────────────────────

function computeMatchScore(
  donor: StationDiagnostic,
  receptor: StationDiagnostic,
  config: LogisticsConfig
): number {
  const nearbyEntry = receptor.network.nearbyStations.find(
    (s) => s.stationId === donor.stationId
  );
  if (!nearbyEntry) return 0; // not close enough

  const distanceScore = 1 - nearbyEntry.distanceMeters / config.maxTransferDistanceMeters;
  const urgencyScore = donor.priorityScore * receptor.priorityScore;
  const sameDistrictBonus =
    donor.districtName && donor.districtName === receptor.districtName ? 0.05 : 0;

  return Math.min(1, urgencyScore * 0.6 + distanceScore * 0.35 + sameDistrictBonus);
}

// ─── Main matching algorithm ─────────────────────────────────────────────────

/**
 * Generates a prioritised list of origin→destination bike transfer recommendations.
 *
 * Algorithm (greedy, O(donors × receptors)):
 * 1. Separate stations into donors and receptors, sorted by priority score.
 * 2. For each receptor (highest priority first), find the best matching donor within range.
 * 3. Compute bikes to move (constrained by surplus, deficit, and vehicle capacity).
 * 4. Deduct moved bikes from donor surplus for subsequent matches.
 * 5. Compute expected impact and logistics cost for each transfer.
 */
export function computeTransfers(
  diagnostics: StationDiagnostic[],
  config: LogisticsConfig = DEFAULT_LOGISTICS_CONFIG
): TransferRecommendation[] {
  const donors = diagnostics
    .filter((d) => d.actionGroup === 'donor' || d.actionGroup === 'peak_remove')
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const receptors = diagnostics
    .filter((d) => d.actionGroup === 'receptor' || d.actionGroup === 'peak_fill')
    .sort((a, b) => b.priorityScore - a.priorityScore);

  if (donors.length === 0 || receptors.length === 0) return [];

  // Track remaining surplus for each donor across the matching iterations
  const donorSurplusRemaining = new Map<string, number>(
    donors.map((d) => {
      const surplus = Math.max(
        0,
        d.currentBikes - Math.round(d.targetBand.max * d.capacity)
      );
      return [d.stationId, surplus];
    })
  );

  const transfers: TransferRecommendation[] = [];
  const window = currentOperationalWindow(config);
  const windowHours = (() => {
    const [sh, sm] = window.start.split(':').map(Number);
    const [eh, em] = window.end.split(':').map(Number);
    return (eh * 60 + (em ?? 0) - sh * 60 - (sm ?? 0)) / 60;
  })();

  for (const receptor of receptors) {
    const deficit = Math.max(
      0,
      Math.round(receptor.targetBand.min * receptor.capacity) - receptor.currentBikes
    );
    if (deficit < config.minBikesToMove) continue;

    // Find best donor for this receptor
    let bestDonor: StationDiagnostic | null = null;
    let bestScore = 0;

    for (const donor of donors) {
      const remaining = donorSurplusRemaining.get(donor.stationId) ?? 0;
      if (remaining < config.minBikesToMove) continue;

      const score = computeMatchScore(donor, receptor, config);
      if (score > bestScore) {
        bestScore = score;
        bestDonor = donor;
      }
    }

    if (!bestDonor || bestScore <= 0) continue;

    const donorSurplus = donorSurplusRemaining.get(bestDonor.stationId) ?? 0;
    const bikesToMove = Math.max(
      config.minBikesToMove,
      Math.min(donorSurplus, deficit, config.vehicleCapacity)
    );

    // Update donor surplus
    donorSurplusRemaining.set(bestDonor.stationId, donorSurplus - bikesToMove);

    const impact = computeTransferImpact(bestDonor, receptor, bikesToMove, windowHours);
    const reasons: string[] = [
      `Donante: ${bestDonor.stationName} (ocupacion ${Math.round(bestDonor.currentOccupancy * 100)}%, ` +
        `por encima de maximo ${Math.round(bestDonor.targetBand.max * 100)}%).`,
      `Receptora: ${receptor.stationName} (ocupacion ${Math.round(receptor.currentOccupancy * 100)}%, ` +
        `por debajo de minimo ${Math.round(receptor.targetBand.min * 100)}%).`,
      `Impacto esperado: ~${impact.usesRecovered.toFixed(1)} usos recuperados, ` +
        `${impact.emptiesAvoided.toFixed(1)} vaciados evitados.`,
    ];

    transfers.push({
      originStationId: bestDonor.stationId,
      originStationName: bestDonor.stationName,
      destinationStationId: receptor.stationId,
      destinationStationName: receptor.stationName,
      bikesToMove,
      timeWindow: window,
      expectedImpact: impact,
      matchScore: bestScore,
      confidence: Math.min(bestDonor.risk.confidence, receptor.risk.confidence),
      reasons,
    });
  }

  // Sort by match score descending
  return transfers.sort((a, b) => b.matchScore - a.matchScore);
}
