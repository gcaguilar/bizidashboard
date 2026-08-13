import { appRoutes } from '@/lib/routes';

type AccessTokenResponse = {
  accessToken?: string;
};

/** Gets the current user's Auth0 API token without exposing client credentials. */
export async function getAccessToken(): Promise<string | null> {
  const response = await fetch(appRoutes.api.authAccessToken(), {
    credentials: 'same-origin',
    cache: 'no-store',
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as AccessTokenResponse;
  return typeof payload.accessToken === 'string' && payload.accessToken.length > 0
    ? payload.accessToken
    : null;
}
