export type Coordinates = {
  latitude: number;
  longitude: number;
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineDistanceMeters(from: Coordinates, to: Coordinates): number {
  const earthRadiusMeters = 6_371_000;
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const haversineA =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(deltaLongitude / 2) ** 2;

  const haversineC = 2 * Math.atan2(Math.sqrt(haversineA), Math.sqrt(1 - haversineA));
  return earthRadiusMeters * haversineC;
}

export function formatDistanceMeters(value: number | null | undefined): string {
  if (!Number.isFinite(value) || value === null || value === undefined) {
    return 'N/D';
  }

  if (value < 1000) {
    return `${Math.round(value)} m`;
  }

  return `${(value / 1000).toFixed(1)} km`;
}
