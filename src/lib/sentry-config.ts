/**
 * Sentry v11 replaced `sendDefaultPii` with the per-category `dataCollection`
 * option and made its defaults far more permissive: by default it now attaches
 * user info, cookies, request/response bodies and DB query data.
 *
 * These values reproduce the restrictive Sentry v10 defaults (`sendDefaultPii:
 * false`) so the app keeps never sending raw PII.
 *
 * @see https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/#data-collection
 */
export const SENTRY_DATA_COLLECTION = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
    response: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
  },
  httpBodies: [],
  urlQueryParams: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
};

export function parseSentrySampleRate(
  value: string | undefined,
  fallback: number
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return fallback;
  }

  return parsed;
}
