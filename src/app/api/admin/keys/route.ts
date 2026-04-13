/**
 * API Key management routes
 *
 * Admin endpoints for creating, listing, and revoking API keys.
 * Protected by OPS_API_KEY.
 */

import { NextRequest } from 'next/server';
import { withApiRequest } from '@/lib/security/http';
import { enforceOperationalAccess } from '@/lib/security/ops-api';
import { recordSecurityEvent } from '@/lib/security/audit';
import {
  createApiKey,
  listApiKeys,
  type CreateApiKeyInput,
} from '@/lib/security/api-keys';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  ownerEmail: z.string().email().optional(),
  customRateLimit: z.number().int().min(1).max(10000).optional(),
  customRateWindow: z.number().int().min(1000).max(3600000).optional(),
});

/**
 * GET /api/admin/keys
 *
 * List all API keys
 */
export async function GET(request: NextRequest): Promise<Response> {
  return withApiRequest(
    request,
    { route: '/api/admin/keys', routeGroup: 'admin' },
    async ({ clientIp, userAgent, requestId }) => {
      const access = await enforceOperationalAccess({
        request,
        clientIp,
        namespace: 'admin.keys',
      });

      if ('response' in access) {
        const status = access.response.status;
        if (status === 401) {
          await recordSecurityEvent({
            eventType: 'auth_failed',
            route: '/api/admin/keys',
            requestId,
            ip: clientIp,
            userAgent,
            outcome: 'denied',
            reasonCode: 'ops_api_key_invalid',
          });
        }
        return access.response;
      }

      const { searchParams } = new URL(request.url);
      const includeRevoked = searchParams.get('includeRevoked') === 'true';

      const keys = await listApiKeys(includeRevoked);

      return Response.json({
        keys,
        count: keys.length,
      });
    }
  );
}

/**
 * POST /api/admin/keys
 *
 * Create a new API key
 */
export async function POST(request: NextRequest): Promise<Response> {
  return withApiRequest(
    request,
    { route: '/api/admin/keys', routeGroup: 'admin' },
    async ({ clientIp }) => {
      const access = await enforceOperationalAccess({
        request,
        clientIp,
        namespace: 'admin.keys',
      });

      if ('response' in access) {
        return access.response;
      }

      const body = await request.json();
      const parsed = CreateApiKeySchema.safeParse(body);

      if (!parsed.success) {
        return Response.json(
          { error: 'Invalid input', details: parsed.error.format() },
          { status: 400 }
        );
      }

      const input: CreateApiKeyInput = {
        name: parsed.data.name,
        description: parsed.data.description,
        ownerEmail: parsed.data.ownerEmail,
        customRateLimit: parsed.data.customRateLimit,
        customRateWindow: parsed.data.customRateWindow,
      };

      const { fullKey, info } = await createApiKey(input);

      return Response.json(
        {
          message: 'API key created successfully',
          key: fullKey,
          info,
          warning: 'This is the only time the full key will be shown. Store it securely.',
        },
        { status: 201 }
      );
    }
  );
}
