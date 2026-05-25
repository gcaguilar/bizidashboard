import { buildMarkdownDocument, countMarkdownTokens, requestWantsMarkdown } from '@/lib/agent-markdown';
import { resolveRedirectTarget } from '@/lib/routes';
import { cleanCanonicalSearchParams } from '@/lib/seo-policy';

const API_METHODS: Array<{ pattern: RegExp; methods: string[] }> = [
  { pattern: /^\/api\/collect\/?$/, methods: ['GET', 'POST'] },
  { pattern: /^\/api\/install\/register\/?$/, methods: ['POST', 'OPTIONS'] },
  { pattern: /^\/api\/token\/refresh\/?$/, methods: ['POST', 'OPTIONS'] },
  { pattern: /^\/api\/geo\/search\/?$/, methods: ['GET', 'POST', 'OPTIONS'] },
  { pattern: /^\/api\/geo\/reverse\/?$/, methods: ['GET', 'POST', 'OPTIONS'] },
  { pattern: /^\/api\/ops\/sentry-test\/?$/, methods: ['POST'] },
  { pattern: /^\/api\/(?:alerts|alerts\/history|app-versions|docs|geo|health|health\/live|health\/ready|heatmap|history|mobility|openapi\.json|patterns|predictions|rankings|rebalancing-report|stations|status|version)\/?$/, methods: ['GET'] },
];

function getAllowedApiMethods(pathname: string): string[] | null {
  return API_METHODS.find((entry) => entry.pattern.test(pathname))?.methods ?? null;
}

function isMethodAllowed(method: string, allowedMethods: string[]): boolean {
  return allowedMethods.includes(method) || (method === 'HEAD' && allowedMethods.includes('GET'));
}

export default function proxy(request: Request) {
  const requestHeaders = new Headers(request.headers);
  const requestId = requestHeaders.get('x-request-id')?.trim() || crypto.randomUUID();
  requestHeaders.set('x-request-id', requestId);

  const url = new URL(request.url);
  const currentPath = url.pathname;
  const targetPath = resolveRedirectTarget(currentPath);
  const destination = new URL(request.url);
  const cleanedSearchParams = cleanCanonicalSearchParams(currentPath, url.searchParams);
  const allowedApiMethods = currentPath.startsWith('/api/') ? getAllowedApiMethods(currentPath) : null;

  if (allowedApiMethods && !isMethodAllowed(request.method, allowedApiMethods)) {
    return new Response(JSON.stringify({ error: `Method ${request.method} not allowed` }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        Allow: allowedApiMethods.join(', '),
        'X-Request-Id': requestId,
      },
    });
  }

  if ((!targetPath || targetPath === currentPath) && cleanedSearchParams === null) {
    if (!currentPath.startsWith('/api/') && requestWantsMarkdown(request)) {
      const markdown = buildMarkdownDocument(currentPath);
      return new Response(markdown, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          Vary: 'Accept',
          'X-Markdown-Tokens': String(countMarkdownTokens(markdown)),
          'X-Request-Id': requestId,
        },
      });
    }

    // Forward the request — return a simple pass-through
    return new Response(null, { status: 200, headers: { 'X-Request-Id': requestId } });
  }

  destination.pathname = targetPath ?? currentPath;

  if (cleanedSearchParams !== null) {
    const serializedSearch = cleanedSearchParams.toString();
    destination.search = serializedSearch.length > 0 ? `?${serializedSearch}` : '';
  }

  return Response.redirect(destination, 301);
}
