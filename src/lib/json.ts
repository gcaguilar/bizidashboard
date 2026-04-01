export type JsonParseResult =
  | {
      ok: true;
      value: unknown;
    }
  | {
      ok: false;
      error: unknown;
    };

export function tryParseJson(rawValue: string | null | undefined): JsonParseResult {
  if (typeof rawValue !== 'string') {
    return {
      ok: false,
      error: new Error('JSON input must be a string.'),
    };
  }

  try {
    return {
      ok: true,
      value: JSON.parse(rawValue) as unknown,
    };
  } catch (error) {
    return {
      ok: false,
      error,
    };
  }
}

export function parseJsonValue(rawValue: string | null | undefined): unknown | null {
  const result = tryParseJson(rawValue);
  return result.ok ? result.value : null;
}

export function parseJsonWithGuard<T>(
  rawValue: string | null | undefined,
  guard: (value: unknown) => value is T
): T | null {
  const result = tryParseJson(rawValue);

  if (!result.ok) {
    return null;
  }

  return guard(result.value) ? result.value : null;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
