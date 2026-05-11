import { buildMarkdownDocument, countMarkdownTokens, requestWantsMarkdown } from '@/lib/agent-markdown';
import { resolveRedirectTarget } from '@/lib/routes';
import { cleanCanonicalSearchParams } from '@/lib/seo-policy';

export default function proxy(request: Request) {
  const requestHeaders = new Headers(request.headers);
  const requestId = requestHeaders.get('x-request-id')?.trim() || crypto.randomUUID();
  requestHeaders.set('x-request-id', requestId);

  const url = new URL(request.url);
  const currentPath = url.pathname;
  const targetPath = resolveRedirectTarget(currentPath);
  const destination = new URL(request.url);
  const cleanedSearchParams = cleanCanonicalSearchParams(currentPath, url.searchParams);

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
