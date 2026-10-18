import { z } from 'zod';

/**
 * Zod 4 compila sus validadores con `new Function` (JIT) y, antes de hacerlo,
 * sondea `new Function('')` para comprobar si el entorno lo permite. Bajo una
 * CSP estricta sin `'unsafe-eval'`, ese sondeo registra una violación
 * `securitypolicyviolation` *enforced* aunque el error se capture: era la única
 * violación `eval` que aparecía en la auditoría del 18/10/2026.
 *
 * `jitless: true` hace que Zod no sondee ni compile evaluando código. La
 * validación por introspección es algo más lenta, pero irrelevante para este
 * panel y nos deja sin dependencia de `eval`.
 *
 * @see https://zod.dev/v4 — `z.config({ jitless: true })`
 */
export function configureZodForStrictCsp(): void {
  z.config({ jitless: true });
}

configureZodForStrictCsp();
