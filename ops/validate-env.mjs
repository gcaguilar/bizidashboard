/**
 * Validacion fail-fast de entorno en produccion, sin dependencias.
 * Espejo intencional de `src/lib/security/config.ts#validateRuntimeConfiguration`
 * para los entrypoints `ops/` (que no pueden importar con alias `@/`).
 * Si se anade un chequeo aqui, anadirlo tambien en config.ts y viceversa.
 */

const KNOWN_INSECURE_EXACT = new Set(['dev-secret-do-not-use-in-production']);

const KNOWN_INSECURE_SUBSTRINGS = ['change-me', 'changeme', 'example', 'placeholder'];

function isKnownInsecureSecret(value) {
  if (!value) {
    return false;
  }
  const normalized = String(value).trim().toLowerCase();
  if (KNOWN_INSECURE_EXACT.has(normalized)) {
    return true;
  }
  return KNOWN_INSECURE_SUBSTRINGS.some((part) => normalized.includes(part));
}

export function validateProductionEnv(env = process.env) {
  if (env.NODE_ENV !== 'production') {
    return;
  }

  const problems = [];
  const opsApiKey = (env.OPS_API_KEY ?? env.COLLECT_API_KEY ?? '').trim();

  if (!env.JWT_SECRET || isKnownInsecureSecret(env.JWT_SECRET)) {
    problems.push('JWT_SECRET must be configured with a non-default value in production.');
  }
  if (!env.SIGNATURE_SECRET || isKnownInsecureSecret(env.SIGNATURE_SECRET)) {
    problems.push('SIGNATURE_SECRET must be configured with a non-default value in production.');
  }
  if (!opsApiKey || isKnownInsecureSecret(opsApiKey)) {
    problems.push('OPS_API_KEY or COLLECT_API_KEY must be configured with a non-default value in production.');
  }
  if (!env.REDIS_URL?.trim()) {
    problems.push('REDIS_URL is required in production for shared rate limiting and cache coordination.');
  }

  if (problems.length > 0) {
    throw new Error(`Invalid runtime configuration: ${problems.join(' ')}`);
  }
}
