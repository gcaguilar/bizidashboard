import type { StationDiagnostic, TransferRecommendation } from '@/types/rebalancing';
import { haversineDistanceMeters } from '@/lib/geo';

type LogisticsConfig = {
  vehicleCapacity: number;
  maxTransferDistanceMeters: number;
  costPerKm: number;
  minBikesToMove: number;
};

export const DEFAULT_LOGISTICS_CONFIG: LogisticsConfig = {
  vehicleCapacity: 20,
  maxTransferDistanceMeters: 3000,
  costPerKm: 2.5,
  minBikesToMove: 2,
};

// Requires diagnostics with lat/lon patched in if haversine is to be recalculated,
// but for matching we can use the pre-built distance matrix or just pass coordinates.
// Let's pass the raw stations list to look up coordinates.
export function computeTransfers(
  diagnostics: StationDiagnostic[],
  stations: Array<{ id: string; lat: number; lon: number }>,
  config: LogisticsConfig = DEFAULT_LOGISTICS_CONFIG
): TransferRecommendation[] {
  const transfers: TransferRecommendation[] = [];

  const donors = diagnostics
    .filter((d) => d.actionGroup === 'donor' || d.actionGroup === 'peak_remove')
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const receptors = diagnostics
    .filter((d) => d.actionGroup === 'receptor' || d.actionGroup === 'peak_fill')
    .sort((a, b) => b.priorityScore - a.priorityScore);

  // Keep track of available bikes to give/receive
  const availableToDonate = new Map<string, number>();
  for (const d of donors) {
    const surplus = d.currentBikes - Math.round(d.targetBand.max * d.capacity);
    availableToDonate.set(d.stationId, Math.max(0, surplus));
  }

  const needToReceive = new Map<string, number>();
  for (const r of receptors) {
    const deficit = Math.round(r.targetBand.min * r.capacity) - r.currentBikes;
    needToReceive.set(r.stationId, Math.max(0, deficit));
  }

  for (const receptor of receptors) {
    let deficit = needToReceive.get(receptor.stationId) ?? 0;
    if (deficit < config.minBikesToMove) continue;

    const receptorCoords = stations.find((s) => s.id === receptor.stationId);
    if (!receptorCoords) continue;

    // Find best donor
    let bestDonor: StationDiagnostic | null = null;
    let bestScore = -1;
    let distanceToBest = 0;

    for (const donor of donors) {
      const surplus = availableToDonate.get(donor.stationId) ?? 0;
      if (surplus < config.minBikesToMove) continue;

      const donorCoords = stations.find((s) => s.id === donor.stationId);
      if (!donorCoords) continue;

      const distance = haversineDistanceMeters(
        { latitude: receptorCoords.lat, longitude: receptorCoords.lon },
        { latitude: donorCoords.lat, longitude: donorCoords.lon }
      );

      if (distance > config.maxTransferDistanceMeters) continue;

      // Score matching
      const distanceScore = 1 - distance / config.maxTransferDistanceMeters;
      const districtBonus = donor.districtName === receptor.districtName ? 0.2 : 0;
      const matchScore = donor.priorityScore * 0.5 + distanceScore * 0.4 + districtBonus;

      if (matchScore > bestScore) {
        bestScore = matchScore;
        bestDonor = donor;
        distanceToBest = distance;
      }
    }

    if (bestDonor) {
      const surplus = availableToDonate.get(bestDonor.stationId) ?? 0;
      const bikesToMove = Math.min(surplus, deficit, config.vehicleCapacity);

      // Deduct
      availableToDonate.set(bestDonor.stationId, surplus - bikesToMove);
      needToReceive.set(receptor.stationId, deficit - bikesToMove);
      deficit -= bikesToMove;

      // Calculate simple impact metrics
      const logisticsScore = Math.max(0, 1 - distanceToBest / config.maxTransferDistanceMeters);
      const costScore = Number(((distanceToBest / 1000) * config.costPerKm).toFixed(2));
      
      // Proxies for impact
      const emptiesAvoided = Math.round(receptor.risk.riskEmptyAt1h * bikesToMove);
      const fullsAvoided = Math.round(bestDonor.risk.riskFullAt1h * bikesToMove);
      const usesRecovered = Math.round(emptiesAvoided * (receptor.risk.demandNextHour || 1));

      transfers.push({
        originStationId: bestDonor.stationId,
        destinationStationId: receptor.stationId,
        bikesToMove,
        timeWindow: { start: 'Ahora', end: '+60 min' },
        expectedImpact: {
          emptiesAvoided,
          fullsAvoided,
          usesRecovered,
          costScore,
        },
        logisticsScore: Number(logisticsScore.toFixed(2)),
        confidence: Number(((bestDonor.risk.confidence + receptor.risk.confidence) / 2).toFixed(2)),
        reasons: [
          `Distancia optima (${Math.round(distanceToBest)}m)`,
          `Resuelve deficit critico en ${receptor.stationName} y sobrestock en ${bestDonor.stationName}`
        ],
      });
    }
  }

  return transfers;
}
