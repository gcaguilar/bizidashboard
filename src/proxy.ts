import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveRedirectTarget } from '@/lib/routes';

export default function proxy(request: NextRequest) {
  const currentPath = request.nextUrl.pathname;
  const targetPath = resolveRedirectTarget(currentPath);
  const destination = request.nextUrl.clone();

  if (!targetPath || targetPath === currentPath) {
    return NextResponse.next();
  }

  destination.pathname = targetPath;
  return NextResponse.redirect(destination, 301);
}

export const config = {
  matcher: [
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
