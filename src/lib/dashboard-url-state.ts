export function normalizeStationIdValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  let normalized = value.trim();

  while (normalized.length >= 2 && normalized.startsWith('"') && normalized.endsWith('"')) {
    normalized = normalized.slice(1, -1).trim();
  }

  return normalized || null;
}
