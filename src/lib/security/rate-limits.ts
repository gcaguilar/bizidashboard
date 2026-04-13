export const RATE_LIMITS = {
  public: {
    default: { limit: 30, windowMs: 60_000 },
    highTraffic: { limit: 40, windowMs: 60_000 },
    lowTraffic: { limit: 20, windowMs: 60_000 },
  },
  mobile: {
    default: { limit: 30, windowMs: 60_000 },
    sensitive: { limit: 10, windowMs: 5 * 60 * 1000 },
    geocoding: { limit: 60, windowMs: 60_000 },
  },
  ops: {
    admin: { limit: 10, windowMs: 60_000 },
    collect: { limit: 6, windowMs: 60_000 },
    sentryTest: { limit: 6, windowMs: 60_000 },
  },
  apiKeys: {
    default: 100,
    authenticated: 1000,
  },
} as const;

export type RateLimitPreset = keyof typeof RATE_LIMITS.public;

export function getRateLimitPreset(preset: RateLimitPreset) {
  return RATE_LIMITS.public[preset];
}