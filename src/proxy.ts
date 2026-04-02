import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveRedirectTarget } from '@/lib/routes';

export default function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const requestId =
    requestHeaders.get('x-request-id')?.trim() || crypto.randomUUID();
  requestHeaders.set('x-request-id', requestId);

  const currentPath = request.nextUrl.pathname;
  const targetPath = resolveRedirectTarget(currentPath);
  const destination = request.nextUrl.clone();

  if (!targetPath || targetPath === currentPath) {
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

  destination.pathname = targetPath;
  const response = NextResponse.redirect(destination, 301);
  response.headers.set('X-Request-Id', requestId);
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/status',
    '/inicio',
    '/ciudades',
    '/ayuda',
    '/metodologia',
    '/developers',
    '/estaciones-mas-usadas',
    '/zaragoza',
    '/zaragoza/:path*',
    '/madrid',
    '/madrid/:path*',
    '/barcelona',
    '/barcelona/:path*',
  ],
};
