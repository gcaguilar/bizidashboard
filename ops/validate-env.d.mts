/**
 * El entrypoint `ops/validate-env.mjs` se escribe en JS plano a proposito
 * (lo consumen otros `ops/` sin alias ni build). Estas declaraciones permiten
 * que los tests TypeScript lo importen con tipos.
 */
export declare function validateProductionEnv(
  env?: Record<string, string | undefined>
): void
