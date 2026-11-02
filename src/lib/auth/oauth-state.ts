import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * The OAuth state cookie is a CSRF binding. Sign it so a caller cannot choose
 * both the state query value and the state cookie and drive a callback without
 * first visiting the login route. The nonce cookie remains a random value
 * checked against the signed ID token.
 */
function getStateSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim() || process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error('SESSION_SECRET or JWT_SECRET is required for the OAuth state cookie.');
  }
  return secret;
}

export function signOAuthState(state: string): string {
  const mac = createHmac('sha256', getStateSecret()).update(state).digest('base64url');
  return `${state}.${mac}`;
}

export function verifyOAuthState(signedState: string | null | undefined): string | null {
  if (!signedState) return null;

  const separator = signedState.lastIndexOf('.');
  if (separator <= 0 || separator === signedState.length - 1) return null;

  const state = signedState.slice(0, separator);
  const providedMac = Buffer.from(signedState.slice(separator + 1), 'base64url');
  const expectedMac = Buffer.from(
    createHmac('sha256', getStateSecret()).update(state).digest('base64url'),
    'base64url'
  );

  if (providedMac.length !== expectedMac.length || !timingSafeEqual(providedMac, expectedMac)) {
    return null;
  }

  return state;
}
