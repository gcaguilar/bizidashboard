import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CITY_SEGMENTS = new Set(['zaragoza', 'madrid', 'barcelona']);
const LEGACY_REDIRECTS = new Map<string, string>([
  ['/estaciones-mas-usadas', '/estaciones-mas-usadas-zaragoza'],
]);

export default function proxy(request: NextRequest) {
  const segments = request.nextUrl.pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  const currentPath = request.nextUrl.pathname;

  const directLegacyTarget = LEGACY_REDIRECTS.get(currentPath);
  if (directLegacyTarget) {
    const destination = request.nextUrl.clone();
    destination.pathname = directLegacyTarget;
    return NextResponse.redirect(destination, 308);
  }

  if (!firstSegment || !CITY_SEGMENTS.has(firstSegment)) {
    return NextResponse.next();
  }

  const strippedPath =
    segments.length === 1 ? '/dashboard' : `/${segments.slice(1).join('/')}`;
  const targetPath = LEGACY_REDIRECTS.get(strippedPath) ?? strippedPath;
  const destination = request.nextUrl.clone();

  destination.pathname = targetPath;

  return NextResponse.redirect(destination, 308);
}

export const config = {
  matcher: ['/zaragoza/:path*', '/madrid/:path*', '/barcelona/:path*'],
};
