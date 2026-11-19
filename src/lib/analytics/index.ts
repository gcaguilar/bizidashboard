export type { PostHogRuntimeConfig } from './config';
export { resolvePostHogRuntimeConfig } from './config';

export {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_STORAGE_KEY,
  ANALYTICS_PREFERENCES_EVENT,
  openAnalyticsPreferences,
  parseAnalyticsConsent,
  readAnalyticsConsent,
  subscribeToAnalyticsConsent,
  subscribeToAnalyticsPreferences,
  writeAnalyticsConsent,
} from './consent';
export type { AnalyticsConsent, AnalyticsConsentChoice } from './consent';

export { initAnalytics, isAnalyticsClientReady, revokeAnalytics, sanitizeCaptureResult, sanitizeUrl, trackEvent } from './client';

export * from './events';
