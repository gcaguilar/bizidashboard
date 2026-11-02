/**
 * Same-origin validation for post-login return paths.
 *
 * A value that merely starts with `/` is not necessarily a local path:
 * WHATWG URL parsing treats a backslash (and some control characters) after
 * the leading slash as an authority separator, so `/\evil.example` and
 * `/\t/evil.example` resolve to another origin. Parse the value against a
 * fixed unregistrable base and require the result to stay on that origin.
 */
const LOCAL_BASE = 'https://local.invalid';

export function isSafeReturnTo(value: string | null | undefined): value is string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return false;
  }

  // Reject backslashes and C0/C1 controls before parsing. The URL parser
  // strips tabs/newlines, which would otherwise hide the authority switch.
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (char === '\\' || code < 0x20 || (code >= 0x7f && code <= 0x9f)) {
      return false;
    }
  }

  try {
    return new URL(value, LOCAL_BASE).origin === LOCAL_BASE;
  } catch {
    return false;
  }
}
