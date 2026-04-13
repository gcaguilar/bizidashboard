/**
 * Individual API Key management route
 *
 * DELETE /api/admin/keys/:id - Revoke or delete an API key
 * PATCH /api/admin/keys/:id - Update API key metadata
 */

import { NextRequest } from 'next/server';
import { withApiRequest } from '@/lib/security/http';
import { enforceOperationalAccess } from '@/lib/security/ops-api';
import { recordSecurityEvent } from '@/lib/security/audit';
import { revokeApiKey, deleteApiKey } from '@/lib/security/api-keys';
import { z } from 'zod';

const RATE_LIMIT = { limit: 10, windowMs: 60_000 };

const UpdateKeySchema = z.object({
  action: z.enum(['revoke', 'delete']),
  reason: z.string().min(1).max(500),
});

async function checkOpsAccess(request: Request, clientIp: string) {
  return enforceOperationalAccess({
    request,
    clientIp,
    namespace: 'admin.keys',
    limit: RATE_LIMIT.limit,
    windowMs: RATE_LIMIT.windowMs,
    unauthorizedError: 'Unauthorized. Valid OPS_API_KEY required.',
    rateLimitError: 'Too many requests.',
    misconfiguredError: 'Server misconfigured: OPS_API_KEY is required.',
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  return withApiRequest(
    request,
    { route: '/api/admin/keys/:id', routeGroup: 'admin' },
    async ({ clientIp, userAgent, requestId }) => {
      const access = await checkOpsAccess(request, clientIp);

      if ('response' in access) {
        const status = access.response.status;
        if (status === 401) {
          await recordSecurityEvent({
            eventType: 'auth_failed',
            route: '/api/admin/keys/:id',
            requestId,
            ip: clientIp,
            userAgent,
            outcome: 'denied',
            reasonCode: 'ops_api_key_invalid',
          });
        }
        return access.response;
      }

      const { id } = await params;
      const body = await request.json();
      const parsed = UpdateKeySchema.safeParse(body);

      if (!parsed.success) {
        return Response.json(
          { error: 'Invalid input', details: parsed.error.format() },
          { status: 400 }
        );
      }

      const { action, reason } = parsed.data;

      if (action === 'revoke') {
        const success = await revokeApiKey(id, reason);

        if (!success) {
          return Response.json(
            { error: 'API key not found or already revoked' },
            { status: 404 }
          );
        }

        return Response.json({
          message: 'API key revoked successfully',
          id,
          reason,
        });
      }

      // action === 'delete'
      const success = await deleteApiKey(id);

      if (!success) {
        return Response.json(
          { error: 'API key not found' },
          { status: 404 }
        );
      }

      return Response.json({
        message: 'API key deleted permanently',
        id,
      });
    }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  return withApiRequest(
    request,
    { route: '/api/admin/keys/:id', routeGroup: 'admin' },
    async ({ clientIp, userAgent, requestId }) => {
      const access = await checkOpsAccess(request, clientIp);

      if ('response' in access) {
        const status = access.response.status;
        if (status === 401) {
          await recordSecurityEvent({
            eventType: 'auth_failed',
            route: '/api/admin/keys/:id',
            requestId,
            ip: clientIp,
            userAgent,
            outcome: 'denied',
            reasonCode: 'ops_api_key_invalid',
          });
        }
        return access.response;
      }

      const { id } = await params;

      // Soft delete (revoke) by default
      const success = await revokeApiKey(id, 'Deleted via API');

      if (!success) {
        return Response.json(
          { error: 'API key not found' },
          { status: 404 }
        );
      }

      return Response.json({
        message: 'API key revoked successfully',
        id,
      });
    }
  );
}
