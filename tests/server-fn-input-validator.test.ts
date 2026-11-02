import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { getHttpErrorStatus, isClientError } from '@/lib/http-error';
import { inputValidator } from '@/server-functions/input-validator';

describe('inputValidator', () => {
  it('returns the parsed data', () => {
    const validate = inputValidator(z.object({ q: z.string().trim() }));

    expect(validate({ q: ' bizi ' })).toEqual({ q: 'bizi' });
  });

  it('lets schema defaults handle a missing payload', () => {
    const validate = inputValidator(
      z.object({ locale: z.enum(['es', 'en']).default('es') }).prefault({}),
    );

    expect(validate(undefined)).toEqual({ locale: 'es' });
  });

  it('throws a 400 error carrying the validation issues', () => {
    const validate = inputValidator(z.object({ q: z.string() }));

    try {
      validate({ q: 1 } as never);
      expect.unreachable('validation should throw');
    } catch (error) {
      expect(getHttpErrorStatus(error)).toBe(400);
      expect(isClientError(error)).toBe(true);
      expect((error as Error).message).toContain('expected string');
    }
  });
});

describe('http error helpers', () => {
  it('reads status and statusCode from the error or its cause', () => {
    expect(getHttpErrorStatus(Object.assign(new Error('x'), { status: 404 }))).toBe(404);
    expect(getHttpErrorStatus(Object.assign(new Error('x'), { statusCode: 422 }))).toBe(422);
    expect(
      getHttpErrorStatus(Object.assign(new Error('x'), { cause: { status: 400 } })),
    ).toBe(400);
  });

  it('ignores plain errors and server failures', () => {
    expect(getHttpErrorStatus(new Error('boom'))).toBeUndefined();
    expect(isClientError(new Error('boom'))).toBe(false);
    expect(isClientError(Object.assign(new Error('boom'), { status: 500 }))).toBe(false);
  });

  it('treats a TanStack not-found marker as a client error', () => {
    expect(isClientError({ isNotFound: true })).toBe(true);
  });
});
