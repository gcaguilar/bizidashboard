/**
 * Values that must never reach production as a real secret: the dev-mode
 * fallback used by jwt.ts/signature.ts when a secret env var is unset, plus
 * generic placeholder substrings ops might leave in a template `.env`.
 * validateRuntimeConfiguration() checks every secret-shaped env var against
 * this list, so anything a dev default could realistically match belongs
 * here rather than duplicated inline in each check.
 */
export const KNOWN_INSECURE_SECRET_VALUES = ['dev-secret-do-not-use-in-production'];

export const KNOWN_INSECURE_SECRET_SUBSTRINGS = ['change-me', 'changeme', 'example', 'placeholder'];

export function isKnownInsecureSecret(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    KNOWN_INSECURE_SECRET_VALUES.some((known) => known.toLowerCase() === normalized) ||
    KNOWN_INSECURE_SECRET_SUBSTRINGS.some((substring) => normalized.includes(substring))
  );
}
