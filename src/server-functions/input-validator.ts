import type { z } from 'zod';
import { httpError } from '@/lib/http-error';

/**
 * Wraps a Zod schema for `createServerFn().validator()` so validation failures
 * answer with HTTP 400 instead of being reported as a 500.
 *
 * The schema itself still owns what is valid: defaults (`.default`, `.prefault`)
 * run exactly as they would through `.validator(schema)`.
 */
export function inputValidator<TSchema extends z.ZodType>(
  schema: TSchema,
): (input: z.input<TSchema>) => z.output<TSchema> {
  return (input) => {
    const result = schema.safeParse(input);
    if (!result.success) {
      throw httpError(400, JSON.stringify(result.error.issues));
    }
    return result.data;
  };
}
