import { describe, expect, it } from 'vitest';

import {
  generateAccessToken,
  issueRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '@/lib/auth/jwt';

describe('jwt token type separation', () => {
  it('verifies an access token', async () => {
    const token = await generateAccessToken('install-1');
    const payload = await verifyAccessToken(token);

    expect(payload?.installId).toBe('install-1');
  });

  it('verifies a refresh token', async () => {
    const { token } = await issueRefreshToken('install-1');
    const payload = await verifyRefreshToken(token);

    expect(payload?.installId).toBe('install-1');
    expect(payload?.type).toBe('refresh');
  });

  it('rejects a refresh token presented as an access token', async () => {
    const { token } = await issueRefreshToken('install-1');

    expect(await verifyAccessToken(token)).toBeNull();
  });

  it('rejects an access token presented as a refresh token', async () => {
    const token = await generateAccessToken('install-1');

    expect(await verifyRefreshToken(token)).toBeNull();
  });

  it('rejects garbage tokens', async () => {
    expect(await verifyAccessToken('not-a-jwt')).toBeNull();
    expect(await verifyRefreshToken('not-a-jwt')).toBeNull();
  });
});
