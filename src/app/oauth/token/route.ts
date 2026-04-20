import { NextResponse } from 'next/server';
import {
  generateOAuthAccessToken,
  getOAuthScope,
  OAUTH_ACCESS_TOKEN_EXPIRY_SECONDS,
  parseClientCredentials,
  validateOAuthClient,
} from '@/lib/oauth';

export const dynamic = 'force-dynamic';

function tokenError(
  error: string,
  status: number,
  description: string
): NextResponse {
  return NextResponse.json(
    {
      error,
      error_description: description,
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      },
    }
  );
}

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.includes('application/x-www-form-urlencoded')) {
    return tokenError(
      'invalid_request',
      400,
      'Expected application/x-www-form-urlencoded request body.'
    );
  }

  const formData = await request.formData();
  const grantType = String(formData.get('grant_type') ?? '');
  if (grantType !== 'client_credentials') {
    return tokenError(
      'unsupported_grant_type',
      400,
      'Only client_credentials is supported.'
    );
  }

  const basicCredentials = parseClientCredentials(request);
  const formClientId = String(formData.get('client_id') ?? '').trim();
  const formClientSecret = String(formData.get('client_secret') ?? '').trim();
  const clientId = basicCredentials.clientId ?? (formClientId || null);
  const clientSecret = basicCredentials.clientSecret ?? (formClientSecret || null);

  const client = await validateOAuthClient(clientId, clientSecret);
  if (!client) {
    return tokenError('invalid_client', 401, 'Client authentication failed.');
  }

  const requestedScope = String(formData.get('scope') ?? '').trim();
  if (requestedScope && requestedScope !== getOAuthScope()) {
    return tokenError('invalid_scope', 400, `Only ${getOAuthScope()} is supported.`);
  }

  const accessToken = await generateOAuthAccessToken(client.clientId);
  return NextResponse.json(
    {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: OAUTH_ACCESS_TOKEN_EXPIRY_SECONDS,
      scope: getOAuthScope(),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      },
    }
  );
}
