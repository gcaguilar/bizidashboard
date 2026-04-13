/**
 * Centralized cache configuration
 * 
 * All cache TTL values in seconds should be defined here
 * to ensure consistency across the application.
 */

export const CacheTTL = {
  /** Default cache time: 5 minutes */
  DEFAULT: 300,
  
  /** Short-lived cache for live data: 1 minute */
  LIVE: 60,
  
  /** Medium cache for analytics data: 5 minutes */
  ANALYTICS: 300,
  
  /** Extended cache for historical data: 30 minutes */
  HISTORICAL: 1800,
  
  /** Long-term cache for rarely changing data: 1 hour */
  LONG_TERM: 3600,
} as const;

export type CacheTTLValue = typeof CacheTTL[keyof typeof CacheTTL];
