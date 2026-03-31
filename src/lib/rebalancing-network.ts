import type { NetworkContext, NearbyStation } from '@/types/rebalancing';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Minimum robustness for a nearby station to be considered a "viable alternative". */
const ROBUSTNESS_THRESHOLD = 0.40;

/** Minimum bikes/anchors in a nearby station for it to absorb demand. */
const MIN_VIABLE_BIKES = 3;

// ─── Main function ───────────────────────────────────────────────────────────

/**
 * Builds the network context for a station: nearby alternatives and urgency adjustment.
 *
 * The urgency adjustment is a multiplier (0–1) applied to the station's urgency score:
 * - 1.0: no viable alternatives exist → full urgency
 * - 0.75: one viable alternative exists → reduced urgency
 * - 0.5: two or more robust alternatives exist → significantly reduced urgency
 *
 * "Viable" means robustness > ROBUSTNESS_THRESHOLD AND has enough current bikes/anchors.
 *
 * @param nearbyStations - Pre-computed nearby stations from the distance matrix
 * @param currentBikesMap - stationId → { bikesAvailable, anchorsFree }
 */
export function buildNetworkContext(
  nearbyStations: NearbyStation[],
  currentBikesMap: Map<string, { bikesAvailable: number; anchorsFree: number }>
): NetworkContext {
  const clusterCapacitySum = nearbyStations.reduce(
    (sum, s) => {
      const status = currentBikesMap.get(s.stationId);
      return sum + (status ? status.bikesAvailable + status.anchorsFree : 0);
    },
    0
  );

  const weightedOccupancySum = nearbyStations.reduce((sum, s) => {
    return sum + s.currentOccupancy * (1 - s.distanceMeters / 600); // weight closer stations more
  }, 0);
  const weightedOccupancyTotal = nearbyStations.length > 0
    ? nearbyStations.reduce((sum, s) => sum + (1 - s.distanceMeters / 600), 0)
    : 1;

  const clusterAvailability =
    weightedOccupancyTotal > 0 ? weightedOccupancySum / weightedOccupancyTotal : 0;

  // Count viable alternatives: robust historically AND has bikes right now
  const viableAlternatives = nearbyStations.filter((s) => {
    const status = currentBikesMap.get(s.stationId);
    const hasBikes = status ? status.bikesAvailable >= MIN_VIABLE_BIKES : false;
    return s.historicalRobustness >= ROBUSTNESS_THRESHOLD && hasBikes;
  });

  let urgencyAdjustment: number;
  if (viableAlternatives.length >= 2) {
    urgencyAdjustment = 0.5; // strong network, lower urgency significantly
  } else if (viableAlternatives.length === 1) {
    urgencyAdjustment = 0.75; // one backup, modest reduction
  } else {
    urgencyAdjustment = 1.0; // no alternatives, full urgency
  }

  return {
    nearbyStations,
    clusterCapacity: clusterCapacitySum,
    clusterAvailability,
    urgencyAdjustment,
  };
}
