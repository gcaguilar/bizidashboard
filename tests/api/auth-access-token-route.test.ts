import { beforeEach, describe, expect, it, vi } from 'vitest';

const isDeveloperSessionConfigured = vi.fn();
const getDeveloperSession = vi.fn();
const resolveActiveAccountByAuth0Subject = vi.fn();

vi.mock('@/lib/auth/developer-session', () => ({
  isDeveloperSessionConfigured: () => isDeveloperSessionConfigured(),
  getDeveloperSession: () => getDeveloperSession(),
}));

vi.mock('@/lib/accounts/global-account-repository', () => ({
  globalAccountRepository: {
    resolveActiveAccountByAuth0Subject: (subject: string) =>
      resolveActiveAccountByAuth0Subject(subject),
  },
}));

const { Route } = await import('@/app/api/auth/access-token/index');

async function invoke(origin?: string): Promise<Response> {
  const handlers = Route.options.server!.handlers as unknown as {
    GET: (options: { request: Request }) => Promise<Response>;
  };
  return handlers.GET({
    request: new Request('https://datosbizi.com/api/auth/access-token', {
      headers: origin ? { Origin: origin, Host: 'datosbizi.com' } : { Host: 'datosbizi.com' },
    }),
  });
}

describe('GET /api/auth/access-token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDeveloperSessionConfigured.mockReturnValue(true);
    resolveActiveAccountByAuth0Subject.mockResolvedValue({ id: 'account-1' });
  });

  it('returns the session access token without cacheable response headers', async () => {
    getDeveloperSession.mockResolvedValue({
      auth0Subject: 'auth0|dev',
      email: 'dev@example.com',
      accessToken: 'test-access-token',
      accessTokenExpiresAt: Date.now() + 60_000,
    });

    const response = await invoke();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toMatchObject({ accessToken: 'test-access-token' });
  });

  it('refuses to export a token after the local account is revoked', async () => {
    getDeveloperSession.mockResolvedValue({
      auth0Subject: 'auth0|revoked',
      email: 'revoked@example.com',
      accessToken: 'still-valid-token',
      accessTokenExpiresAt: Date.now() + 60_000,
    });
    resolveActiveAccountByAuth0Subject.mockRejectedValue(new Error('revoked'));

    const response = await invoke();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Login required.' });
  });

  it('rejects an anonymous or expired session', async () => {
    getDeveloperSession.mockResolvedValue(null);
    expect((await invoke()).status).toBe(401);

    getDeveloperSession.mockResolvedValue({
      email: 'dev@example.com',
      accessToken: 'expired-token',
      accessTokenExpiresAt: Date.now() - 1,
    });
    expect((await invoke()).status).toBe(401);
  });

  it('rejects a cross-origin request before reading the session', async () => {
    const response = await invoke('https://evil.example');
    expect(response.status).toBe(403);
    expect(getDeveloperSession).not.toHaveBeenCalled();
  });
});
