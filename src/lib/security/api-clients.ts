/**
 * API client (Auth0 M2M) management service
 *
 * Handles self-service provisioning of Auth0 Machine-to-Machine applications
 * for third-party API access, with per-client rate limiting.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getOAuthScope } from '@/lib/oauth';

export type ApiClientInfo = {
  id: string;
  auth0ClientId: string;
  name: string;
  ownerEmail: string;
  isActive: boolean;
  customRateLimit: number | null;
  customRateWindow: number | null;
  createdAt: Date;
};

export type CreateApiClientInput = {
  name: string;
  ownerEmail: string;
};

export const DEFAULT_RATE_LIMIT = 100;
export const DEFAULT_RATE_WINDOW_MS = 60_000;

function getAuth0Domain(): string {
  const domain = process.env.AUTH0_DOMAIN?.trim();
  if (!domain) {
    throw new Error('AUTH0_DOMAIN is required to manage API clients.');
  }
  return domain;
}

function getAuth0Audience(): string {
  const audience = process.env.AUTH0_AUDIENCE?.trim();
  if (!audience) {
    throw new Error('AUTH0_AUDIENCE is required to manage API clients.');
  }
  return audience;
}

let cachedManagementToken: { token: string; expiresAt: number } | null = null;

/**
 * Fetches (and caches) a token for the Auth0 Management API, using the
 * backend's own M2M application credentials (AUTH0_MGMT_CLIENT_ID/SECRET).
 */
async function getManagementApiToken(): Promise<string> {
  if (cachedManagementToken && cachedManagementToken.expiresAt > Date.now() + 30_000) {
    return cachedManagementToken.token;
  }

  const domain = getAuth0Domain();
  const clientId = process.env.AUTH0_MGMT_CLIENT_ID?.trim();
  const clientSecret = process.env.AUTH0_MGMT_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error('AUTH0_MGMT_CLIENT_ID and AUTH0_MGMT_CLIENT_SECRET are required.');
  }

  const response = await fetch(`https://${domain}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to obtain Auth0 Management API token: ${response.status}`);
  }

  const body = (await response.json()) as { access_token: string; expires_in: number };
  cachedManagementToken = {
    token: body.access_token,
    expiresAt: Date.now() + body.expires_in * 1000,
  };

  return body.access_token;
}

/**
 * Creates a new Auth0 M2M application authorized against the API audience,
 * and records it as an ApiClient. Returns the client secret in the clear
 * (only available at creation time, mirroring createApiKey()).
 */
export async function createApiClient(
  input: CreateApiClientInput
): Promise<{ clientId: string; clientSecret: string; info: ApiClientInfo }> {
  const domain = getAuth0Domain();
  const audience = getAuth0Audience();
  const managementToken = await getManagementApiToken();

  const createResponse = await fetch(`https://${domain}/api/v2/clients`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${managementToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `${input.name} (${input.ownerEmail})`,
      app_type: 'non_interactive',
      grant_types: ['client_credentials'],
    }),
  });

  if (!createResponse.ok) {
    throw new Error(`Failed to create Auth0 M2M application: ${createResponse.status}`);
  }

  const created = (await createResponse.json()) as {
    client_id: string;
    client_secret: string;
  };

  const grantResponse = await fetch(`https://${domain}/api/v2/client-grants`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${managementToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: created.client_id,
      audience,
      scope: [getOAuthScope()],
    }),
  });

  if (!grantResponse.ok) {
    throw new Error(`Failed to authorize Auth0 M2M application: ${grantResponse.status}`);
  }

  const record = await prisma.apiClient.create({
    data: {
      auth0ClientId: created.client_id,
      name: input.name,
      ownerEmail: input.ownerEmail,
    },
  });

  logger.info('api_client.created', {
    clientId: record.id,
    auth0ClientId: record.auth0ClientId,
    name: record.name,
  });

  return {
    clientId: created.client_id,
    clientSecret: created.client_secret,
    info: {
      id: record.id,
      auth0ClientId: record.auth0ClientId,
      name: record.name,
      ownerEmail: record.ownerEmail,
      isActive: record.isActive,
      customRateLimit: record.customRateLimit,
      customRateWindow: record.customRateWindow,
      createdAt: record.createdAt,
    },
  };
}

/**
 * Looks up an ApiClient by its Auth0 client_id (the `azp`/`client_id` claim
 * on verified access tokens).
 */
export async function getApiClientByAuth0Id(
  auth0ClientId: string
): Promise<ApiClientInfo | null> {
  const record = await prisma.apiClient.findUnique({ where: { auth0ClientId } });

  if (!record || !record.isActive || record.revokedAt) {
    return null;
  }

  return {
    id: record.id,
    auth0ClientId: record.auth0ClientId,
    name: record.name,
    ownerEmail: record.ownerEmail,
    isActive: record.isActive,
    customRateLimit: record.customRateLimit,
    customRateWindow: record.customRateWindow,
    createdAt: record.createdAt,
  };
}

/**
 * Get rate limits for an API client (custom or defaults).
 */
export function getApiClientRateLimits(
  apiClientInfo: ApiClientInfo | null
): { limit: number; windowMs: number } {
  if (apiClientInfo?.customRateLimit && apiClientInfo?.customRateWindow) {
    return {
      limit: apiClientInfo.customRateLimit,
      windowMs: apiClientInfo.customRateWindow,
    };
  }

  return {
    limit: DEFAULT_RATE_LIMIT,
    windowMs: DEFAULT_RATE_WINDOW_MS,
  };
}

export async function revokeApiClient(clientId: string): Promise<boolean> {
  try {
    const record = await prisma.apiClient.update({
      where: { id: clientId },
      data: { isActive: false, revokedAt: new Date() },
    });

    // The ApiClient row is already revoked at this point, so the allow-list
    // check in enforcePublicApiAccess blocks this client regardless of what
    // happens below — but we still want to know if Auth0-side cleanup failed
    // and left an orphaned M2M application in the tenant.
    const managementToken = await getManagementApiToken();
    const domain = getAuth0Domain();

    const deleteResponse = await fetch(`https://${domain}/api/v2/clients/${record.auth0ClientId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${managementToken}` },
    });

    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      logger.warn('api_client.auth0_delete_failed', {
        clientId,
        auth0ClientId: record.auth0ClientId,
        status: deleteResponse.status,
      });
    }

    logger.info('api_client.revoked', { clientId });
    return true;
  } catch (error) {
    logger.error('api_client.revoke_failed', { clientId, error });
    return false;
  }
}

export type RevokeOwnApiClientResult = 'revoked' | 'not_found' | 'not_owner';

/**
 * Revokes an ApiClient on behalf of a logged-in developer, after checking
 * they own it (ownerEmail matches their verified session email).
 */
export async function revokeOwnApiClient(
  auth0ClientId: string,
  ownerEmail: string
): Promise<RevokeOwnApiClientResult> {
  const record = await prisma.apiClient.findUnique({ where: { auth0ClientId } });

  if (!record) {
    return 'not_found';
  }

  if (record.ownerEmail !== ownerEmail) {
    return 'not_owner';
  }

  if (!record.isActive || record.revokedAt) {
    return 'revoked';
  }

  await revokeApiClient(record.id);
  return 'revoked';
}
