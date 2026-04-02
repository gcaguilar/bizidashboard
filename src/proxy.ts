import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveRedirectTarget } from '@/lib/routes';
import { cleanCanonicalSearchParams } from '@/lib/seo-policy';

export default function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const requestId =
    requestHeaders.get('x-request-id')?.trim() || crypto.randomUUID();
  requestHeaders.set('x-request-id', requestId);

  const currentPath = request.nextUrl.pathname;
  const targetPath = resolveRedirectTarget(currentPath);
  const destination = request.nextUrl.clone();
  const cleanedSearchParams = cleanCanonicalSearchParams(
    currentPath,
    request.nextUrl.searchParams
  );

  if ((!targetPath || targetPath === currentPath) && cleanedSearchParams === null) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    if (currentPath.startsWith('/api/')) {
      response.headers.set('X-Request-Id', requestId);
    }
    return response;
  }

  destination.pathname = targetPath ?? currentPath;

  if (cleanedSearchParams !== null) {
    const serializedSearch = cleanedSearchParams.toString();
    destination.search = serializedSearch.length > 0 ? `?${serializedSearch}` : '';
  }

  const response = NextResponse.redirect(destination, 301);
  response.headers.set('X-Request-Id', requestId);
  return response;
}

export const config = {
  matcher: ['/((?!_next/|.*\\..*$).*)'],
};
