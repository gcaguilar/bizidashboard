import { createHash, timingSafeEqual } from 'node:crypto';
// Native Request/Response replace Request/Response
import { getCity } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  resolveRequestId,
  runWithExecutionContext,
  type ExecutionContext,
} from '@/lib/request-context';
import { getMobileAllowedHeaders, getMobileAllowedOrigins } from '@/lib/security/config';

function readHeader(
  headers: Headers,
  names: string[]
): string | null {
  for (const name of names) {
    const value = headers.get(name)?.trim();
    if (value) {
      return value;
    }
  }

  return null;
}

const IPV4_PATTERN = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV6_PATTERN = /^[0-9a-fA-F:]+$/;

export function isValidIp(value: string): boolean {
  return IPV4_PATTERN.test(value) || (value.includes(':') && IPV6_PATTERN.test(value));
}

/** Cabecera interna sellada por ops/start-server.mjs con la IP TCP del peer. El servidor la sobrescribe siempre, asi el codigo de aplicacion puede fiarse de ella. */
export const SERVER_PEER_IP_HEADER = 'x-server-peer-ip';

/**
 * Rangos oficiales de Cloudflare (https://www.cloudflare.com/ips-v4 e ips-v6).
 * Solo se usan por defecto; se recomienda fijar TRUSTED_PROXY_CIDRS en el
 * despliegue para no depender de esta copia.
 */
const CLOUDFLARE_IP_RANGES = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32',
];

export function getTrustedProxyCidrs(): string[] {
  const configured = (process.env.TRUSTED_PROXY_CIDRS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return configured.length > 0 ? configured : CLOUDFLARE_IP_RANGES;
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) {
    return null;
  }
  let result = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) {
      return null;
    }
    const value = Number(part);
    if (value < 0 || value > 255) {
      return null;
    }
    result = result * 256 + value;
  }
  return result >>> 0;
}

function ipv6Groups(ip: string): number[] | null {
  const address = ip.split('%')[0];
  const halves = address.split('::');
  if (halves.length > 2) {
    return null;
  }
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 ? (halves[1] ? halves[1].split(':') : []) : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 0) {
    return null;
  }
  const groups = [...head, ...Array<string>(missing).fill('0'), ...tail];
  const numbers: number[] = [];
  for (const group of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(group)) {
      return null;
    }
    numbers.push(parseInt(group, 16));
  }
  return numbers;
}

function ipv6ToBigInt(ip: string): bigint | null {
  const groups = ipv6Groups(ip);
  if (!groups) {
    return null;
  }
  let result = 0n;
  for (const group of groups) {
    result = (result << 16n) + BigInt(group);
  }
  return result;
}

export function cidrContains(cidr: string, ip: string): boolean {
  const separator = cidr.lastIndexOf('/');
  if (separator === -1) {
    return false;
  }
  const base = cidr.slice(0, separator).trim();
  const prefix = Number(cidr.slice(separator + 1).trim());
  if (!Number.isInteger(prefix)) {
    return false;
  }

  if (base.includes('.') && !base.includes(':') && !ip.includes(':')) {
    if (prefix < 0 || prefix > 32) {
      return false;
    }
    const baseInt = ipv4ToInt(base);
    const ipInt = ipv4ToInt(ip);
    if (baseInt === null || ipInt === null) {
      return false;
    }
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    return (baseInt & mask) === (ipInt & mask);
  }

  if (base.includes(':') && ip.includes(':')) {
    if (prefix < 0 || prefix > 128) {
      return false;
    }
    const baseInt = ipv6ToBigInt(base);
    const ipInt = ipv6ToBigInt(ip);
    if (baseInt === null || ipInt === null) {
      return false;
    }
    const mask = prefix === 0 ? 0n : (((1n << BigInt(prefix)) - 1n) << BigInt(128 - prefix));
    return (baseInt & mask) === (ipInt & mask);
  }

  return false;
}

export function isTrustedProxyPeer(ip: string, cidrs: string[] = getTrustedProxyCidrs()): boolean {
  return cidrs.some((cidr) => cidrContains(cidr, ip));
}

function lastValidXffIp(forwardedFor: string | null): string | null {
  if (!forwardedFor) {
    return null;
  }
  const entries = forwardedFor.split(',').map((entry) => entry.trim()).filter(Boolean);
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (isValidIp(entries[index])) {
      return entries[index];
    }
  }
  return null;
}

/**
 * Resuelve la IP del cliente con atestacion del servidor.
 *
 * Modelo de confianza: las cabeceras (`cf-connecting-ip`, `x-forwarded-for`)
 * son afirmaciones falsificables por cualquiera que pegue directo al origen.
 * Lo unico fiable es la IP TCP del peer, sellada por ops/start-server.mjs en
 * `x-server-peer-ip` (el servidor la sobrescribe, nunca la hereda).
 *
 * - Peer de confianza (Cloudflare): `cf-connecting-ip` validada; si falta, la
 *   ULTIMA entrada valida de XFF (Cloudflare antepone la IP real al final);
 *   si tampoco hay, el propio peer.
 * - Peer no fiable (conexion directa: healthchecks, cron interno o bypass de
 *   Cloudflare): se usa el peer, imposible de falsificar.
 * - Sin sello del servidor (dev/tests): mejor esfuerzo, NO fiable para
 *   seguridad; produccion debe correr tras start-server.mjs.
 */
export function getClientIp(headers: Headers): string {
  const peer = headers.get(SERVER_PEER_IP_HEADER)?.trim();
  if (peer && isValidIp(peer)) {
    if (isTrustedProxyPeer(peer)) {
      const cfConnectingIp = headers.get('cf-connecting-ip')?.trim();
      if (cfConnectingIp && isValidIp(cfConnectingIp)) {
        return cfConnectingIp;
      }
      return lastValidXffIp(headers.get('x-forwarded-for')) ?? peer;
    }
    return peer;
  }

  const cfConnectingIp = headers.get('cf-connecting-ip')?.trim();
  if (cfConnectingIp && isValidIp(cfConnectingIp)) {
    return cfConnectingIp;
  }

  return (
    lastValidXffIp(headers.get('x-forwarded-for')) ??
    readHeader(headers, ['x-real-ip', 'fly-client-ip']) ??
    'unknown'
  );
}

function getSecuritySalt(): string {
  const salt = process.env.SIGNATURE_SECRET || process.env.JWT_SECRET;
  if (!salt) {
    throw new Error('SECURITY_ERROR: SIGNATURE_SECRET or JWT_SECRET must be configured');
  }
  return salt;
}

export function hashSensitiveValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const salt = getSecuritySalt();
  return createHash('sha256').update(`${salt}:${value}`).digest('hex');
}

export function isApiKeyValid(
  providedApiKey: string | null | undefined,
  expectedApiKey: string
): boolean {
  if (!providedApiKey) {
    return false;
  }

  // Hashear ambos lados antes de comparar: los digests tienen longitud fija,
  // asi no se filtra la longitud de la clave esperada por tiempo de respuesta.
  const providedDigest = createHash('sha256').update(providedApiKey).digest();
  const expectedDigest = createHash('sha256').update(expectedApiKey).digest();

  return timingSafeEqual(providedDigest, expectedDigest);
}

export function readOpsApiKey(headers: Headers): string | null {
  return readHeader(headers, ['x-ops-api-key']);
}

export function readApiKey(headers: Headers): string | null {
  return readHeader(headers, ['x-api-key']);
}

export type RequestExecution = {
  requestId: string;
  clientIp: string;
  userAgent: string | null;
  startedAt: number;
};

export async function withApiRequest<T extends Response>(
  request: Request | Request,
  meta: Pick<ExecutionContext, 'route' | 'routeGroup'>,
  handler: (execution: RequestExecution) => Promise<T>
): Promise<T> {
  const requestId = resolveRequestId(request.headers);
  const clientIp = getClientIp(request.headers);
  const userAgent = request.headers.get('user-agent');
  const startedAt = Date.now();
  const context: ExecutionContext = {
    requestId,
    route: meta.route,
    routeGroup: meta.routeGroup,
    method: request.method,
    city: getCity(),
    ipHash: hashSensitiveValue(clientIp),
    userAgentHash: hashSensitiveValue(userAgent),
  };

  return runWithExecutionContext(context, async () => {
    logger.info('request.started', {
      route: meta.route,
      method: request.method,
    });

    try {
      const response = await handler({
        requestId,
        clientIp,
        userAgent,
        startedAt,
      });

      response.headers.set('X-Request-Id', requestId);
      logger.info('request.completed', {
        route: meta.route,
        method: request.method,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });

      return response;
    } catch (error) {
      logger.error('request.failed', {
        route: meta.route,
        method: request.method,
        durationMs: Date.now() - startedAt,
        error,
      });
      throw error;
    }
  });
}

export function buildMobileCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  const allowedOrigins = getMobileAllowedOrigins();

  if (!origin) {
    return {
      Vary: 'Origin',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': getMobileAllowedHeaders(),
    };
  }

  if (!allowedOrigins.includes(origin)) {
    return { Vary: 'Origin' };
  }

  return {
    Vary: 'Origin',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': getMobileAllowedHeaders(),
  };
}

export function applyMobileCors(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(buildMobileCorsHeaders(request))) {
    headers.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function rejectDisallowedMobileOrigin(request: Request): Response | null {
  const origin = request.headers.get('origin');

  if (!origin) {
    return null;
  }

  const allowedOrigins = getMobileAllowedOrigins();
  if (allowedOrigins.includes(origin)) {
    return null;
  }

  return Response.json(
    { error: 'Origin not allowed', details: 'origin is not in the mobile API allowlist' },
    {
      status: 403,
      headers: {
        Vary: 'Origin',
      },
    }
  );
}

/**
 * CSRF guard for cookie-authenticated, same-origin browser routes (e.g. the
 * developer portal). Browsers attach `Origin` on cross-site fetch/XHR
 * requests, so a mismatch means the request did not originate from our own
 * pages. A missing `Origin` is allowed through — same-site navigations and
 * non-browser clients (curl, server-to-server) don't reliably send it, and
 * those callers don't carry the session cookie anyway unless replayed
 * cross-site, which requires an `Origin` in every modern browser.
 *
 * Compares against the request's own `Host` (falling back to
 * `X-Forwarded-Host` behind a proxy) rather than a configured APP_URL: the
 * attacker's page can put anything in `Origin`, but a browser talking to
 * our server always sets `Host` to the domain it actually connected to, so
 * this can't be defeated by APP_URL drifting from the real serving domain
 * (custom domains, Vercel previews, local dev ports, etc.).
 */
export function rejectCrossOriginRequest(request: Request): Response | null {
  const origin = request.headers.get('origin');

  if (!origin) {
    return null;
  }

  const configuredOrigin = process.env.AUTH0_PUBLIC_ORIGIN?.trim() || process.env.APP_URL?.trim();
  if (configuredOrigin) {
    try {
      if (origin === new URL(configuredOrigin).origin) {
        return null;
      }
    } catch {
      // Fall through to the request/proxy-derived origin below.
    }
  }

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host');
  const requestUrl = new URL(request.url);
  const protocol = forwardedProto === 'http' || forwardedProto === 'https'
    ? forwardedProto
    : requestUrl.protocol.replace(':', '');
  const requestOrigin = `${protocol}://${requestUrl.host}`;

  const isSameOrigin = host
    ? origin === `${new URL(requestOrigin).protocol}//${host}`
    : origin === requestOrigin;

  if (isSameOrigin) {
    return null;
  }

  return Response.json(
    { error: 'Cross-origin request rejected' },
    { status: 403, headers: { Vary: 'Origin' } }
  );
}

export function handleMobilePreflight(request: Request): Response {
  return rejectDisallowedMobileOrigin(request) ??
    new Response(null, {
      status: 204,
      headers: buildMobileCorsHeaders(request),
    });
}
