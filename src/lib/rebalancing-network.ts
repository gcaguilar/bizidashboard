import type { NetworkContext, NearbyStation, StationBaseMetrics, TimeBandMetrics } from '@/types/rebalancing';

export function buildNetworkContext(
  stationId: string,
  currentOccupancy: number,
  nearbyStations: NearbyStation[],
  allGlobalMetrics: Record<string, StationBaseMetrics>
): NetworkContext {
  // Populate the precomputed distances with live occupancy and historical robustness
  const populatedNeighbors = nearbyStations.map((neighbor) => {
    const neighborMetrics = allGlobalMetrics[neighbor.stationId];
    
    // Robustness: 1 - (pctTimeEmpty + pctTimeFull)
    // Means the station spends most of its time with both bikes and anchors available
    let historicalRobustness = 0;
    if (neighborMetrics) {
      historicalRobustness = Math.max(0, 1 - neighborMetrics.pctTimeEmpty - neighborMetrics.pctTimeFull);
    }

    return {
      ...neighbor,
      historicalRobustness,
    };
  });

  // Keep only robust enough neighbors (e.g. robustness > 40%) that are within a reasonable walk (e.g. < 500m => ~6.5 mins)
  const viableNeighbors = populatedNeighbors.filter((n) => n.historicalRobustness > 0.4 && n.walkingTimeMinutes <= 7);

  let urgencyAdjustment = 1.0; // Default full urgency (1.0)

  if (viableNeighbors.length >= 2) {
    // If there are at least 2 robust alternatives nearby, urgency drops to 50%
    urgencyAdjustment = 0.5;
  } else if (viableNeighbors.length === 1) {
    // If there's 1 robust alternative, urgency drops to 75%
    urgencyAdjustment = 0.75;
  }

  return {
    nearbyStations: populatedNeighbors,
    clusterCapacity: 0, // Not strictly required for urgency rules yet
    clusterAvailability: 0, // Not strictly required yet
    urgencyAdjustment,
  };
}
