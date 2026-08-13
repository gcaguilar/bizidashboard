import { beforeEach, describe, expect, it, vi } from 'vitest';

const isDeveloperSessionConfigured = vi.fn();
const isDeveloperLoginConfigured = vi.fn();
const getDeveloperSession = vi.fn();

vi.mock('@/lib/auth/developer-session', () => ({
  isDeveloperSessionConfigured: () => isDeveloperSessionConfigured(),
  getDeveloperSession: () => getDeveloperSession(),
}));

vi.mock('@/lib/auth/auth0-web', () => ({
  isDeveloperLoginConfigured: () => isDeveloperLoginConfigured(),
}));

const { Route } = await import('@/app/api/auth/session/index');

async function invoke(): Promise<{ email: string | null; configured: boolean }> {
  const handlers = Route.options.server!.handlers as unknown as {
    GET: () => Promise<Response>;
  };
  const handler = handlers.GET;
  const response = await handler();
  expect(response.status).toBe(200);
  return response.json();
}

describe('GET /api/auth/session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports the signed-in email when the login is configured', async () => {
    isDeveloperSessionConfigured.mockReturnValue(true);
    isDeveloperLoginConfigured.mockReturnValue(true);
    getDeveloperSession.mockResolvedValue({ email: 'dev@example.com' });

    await expect(invoke()).resolves.toEqual({ email: 'dev@example.com', configured: true });
  });

  it('reports an anonymous but configured visitor', async () => {
    isDeveloperSessionConfigured.mockReturnValue(true);
    isDeveloperLoginConfigured.mockReturnValue(true);
    getDeveloperSession.mockResolvedValue(null);

    await expect(invoke()).resolves.toEqual({ email: null, configured: true });
  });

  it('marks the login as unconfigured when the session secret is missing', async () => {
    isDeveloperSessionConfigured.mockReturnValue(false);
    isDeveloperLoginConfigured.mockReturnValue(true);

    await expect(invoke()).resolves.toEqual({ email: null, configured: false });
    expect(getDeveloperSession).not.toHaveBeenCalled();
  });

  it('marks the login as unconfigured when Auth0 credentials are missing', async () => {
    isDeveloperSessionConfigured.mockReturnValue(true);
    isDeveloperLoginConfigured.mockReturnValue(false);
    getDeveloperSession.mockResolvedValue(null);

    await expect(invoke()).resolves.toEqual({ email: null, configured: false });
  });
});
