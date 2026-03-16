import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const redirects: [string, string][] = [
  // Dashboard redirects
  ['/dashboard', '/zaragoza/dashboard'],
  ['/dashboard/', '/zaragoza/dashboard'],
  
  // SEO page redirects
  ['/estaciones-mas-usadas-zaragoza', '/zaragoza/estaciones-mas-usadas'],
  ['/barrios-bizi-zaragoza', '/zaragoza/barrios-bizi-zaragoza'],
  ['/viajes-por-dia-zaragoza', '/zaragoza/viajes-por-dia-zaragoza'],
  ['/viajes-por-mes-zaragoza', '/zaragoza/viajes-por-mes-zaragoza'],
  ['/informes-mensuales-bizi-zaragoza', '/zaragoza/informes-mensuales-bizi-zaragoza'],
  ['/informes', '/zaragoza/informes'],
  ['/informes/', '/zaragoza/informes'],
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  for (const [from, to] of redirects) {
    if (pathname === from || pathname.startsWith(from + '/')) {
      const newPath = pathname.replace(from, to)
      return NextResponse.redirect(newPath, 301)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/estaciones-mas-usadas-zaragoza/:path*',
    '/barrios-bizi-zaragoza/:path*',
    '/viajes-por-dia-zaragoza/:path*',
    '/viajes-por-mes-zaragoza/:path*',
    '/informes-mensuales-bizi-zaragoza/:path*',
    '/informes/:path*',
  ],
}
