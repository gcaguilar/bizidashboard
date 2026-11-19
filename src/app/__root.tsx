/// <reference types="vite/client" />

import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  redirect,
  useLocation,
} from '@tanstack/react-router'
import { PostHogErrorBoundary, PostHogProvider, usePostHog } from '@posthog/react'
import { lazy, Suspense, useEffect } from 'react'
import Footer from '../components/Footer'
import Header from '../components/Header'
import { NavigationProgress } from './_components/NavigationProgress'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

import { appRoutes } from '@/lib/routes'
import { INSTAGRAM_URL } from '@/lib/social-profiles'
import { getGoogleSiteVerificationToken, getSiteUrl, INTER_FONT_PATH, SEO_SITE_NAME } from '@/lib/site'
import { getFooterData } from '@/server-functions/footer'
import { RouteErrorReporter } from '@/lib/route-error-reporting'
import { getLocaleFromPathname, HTML_LANG } from '@/lib/i18n/locales'
import { normalizeEnglishPublicHref } from '@/lib/i18n/locale-redirect'
import { useLocale } from '@/lib/i18n/use-locale'
import { useDeveloperSession } from '@/lib/use-developer-session'

interface MyRouterContext {
  queryClient: QueryClient
}

const THEME_INIT_SCRIPT = `(function(){try{var modern=window.localStorage.getItem('bizidashboard-theme');var legacy=window.localStorage.getItem('theme');var stored=modern||legacy;var mode=(stored==='light'||stored==='dark')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;if(!modern&&legacy&&(mode==='light'||mode==='dark')){try{window.localStorage.setItem('bizidashboard-theme',mode)}catch(e){}}}catch(e){}})();`

const Devtools = import.meta.env.DEV
  ? lazy(() => import('../components/Devtools'))
  : null

const posthogToken = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST
const missingPostHogVariable = !posthogToken
  ? 'VITE_PUBLIC_POSTHOG_PROJECT_TOKEN'
  : !posthogHost
    ? 'VITE_PUBLIC_POSTHOG_HOST'
    : null
const posthogConfigurationMessage = missingPostHogVariable
  ? `${missingPostHogVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingPostHogVariable} is configured`
  : null

export const Route = createRootRouteWithContext<MyRouterContext>()({
  // version/umami are static per server process (env vars, build metadata);
  // resolve once and never revalidate on navigation.
  staleTime: Infinity,
  // Idioma desde la URL publica (`/en/...`); lo consumen los `head` de las rutas traducidas.
  beforeLoad: ({ location }) => {
    // `/en/` y `/en/metodologia/` -> forma canonica sin barra final (solo ingles).
    const canonicalEnglishHref = normalizeEnglishPublicHref(location.publicHref)
    if (canonicalEnglishHref) {
      throw redirect({ href: canonicalEnglishHref, replace: true, statusCode: 308 })
    }
    return { locale: getLocaleFromPathname(location.publicHref) }
  },
  loader: () => getFooterData(),
  head: () => {
    const googleVerification = getGoogleSiteVerificationToken()
    return {
    meta: [
      { title: 'DatosBizi' },
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      ...(googleVerification
        ? [{ name: 'google-site-verification', content: googleVerification }]
        : []),
    ],
    links: [
      { rel: 'manifest', href: appRoutes.manifest() },
      { rel: 'icon', href: appRoutes.favicon(), type: 'image/svg+xml' },
      { rel: 'preconnect', href: 'https://tiles.openfreemap.org', crossOrigin: 'anonymous' },
      { rel: 'preload', href: INTER_FONT_PATH, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { rel: 'alternate', type: 'application/rss+xml', title: 'Informes mensuales de Bizi Zaragoza', href: appRoutes.feed() },
      { rel: 'stylesheet', href: appCss },
    ],
  }
  },
  errorComponent: ({ error }) => (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] p-8">
        <RouteErrorReporter error={error} area="route.root" />
        <div className="mx-auto max-w-lg space-y-4">
          <h1 className="text-2xl font-black text-red-600">Error interno</h1>
          <p className="text-sm text-[var(--muted)]">
            Lo sentimos, ocurrió un error inesperado. Intenta recargar la página.
          </p>
          {import.meta.env.DEV && (
            <pre className="overflow-auto rounded border border-[var(--border)] bg-[var(--card)] p-4 text-xs">
              {error instanceof Error ? error.message : 'Unknown error'}
            </pre>
          )}
        </div>
      </body>
    </html>
  ),
  shellComponent: RootDocument,
})

function PostHogIdentity() {
  const posthog = usePostHog()
  const session = useDeveloperSession()

  useEffect(() => {
    if (session.status === 'authenticated') {
      posthog.identify(session.auth0Subject, { email: session.email })
    }
  }, [posthog, session])

  return null
}

function PostHogApp({ renderApp }: { renderApp: (onLogout: () => void) => React.ReactNode }) {
  const posthog = usePostHog()

  return (
    <>
      <PostHogIdentity />
      <PostHogErrorBoundary>{renderApp(() => posthog.reset())}</PostHogErrorBoundary>
    </>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const footerData = Route.useLoaderData()
  const umamiConfig = footerData.umami
  const location = useLocation()
  const locale = useLocale()
  const siteUrl = getSiteUrl()
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: SEO_SITE_NAME,
        alternateName: ['BiziDashboard', 'BiciRadar', 'Bici Radar'],
        url: siteUrl,
        description:
          'Observatorio público e independiente de Bizi Zaragoza: disponibilidad, histórico, informes y API de datos abiertos.',
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
        },
        foundingDate: '2026',
        founder: {
          '@type': 'Person',
          name: 'Guillermo Castella',
          sameAs: 'https://www.linkedin.com/in/guillermocastella/',
        },
        areaServed: {
          '@type': 'City',
          name: 'Zaragoza',
        },
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            url: `${siteUrl}${appRoutes.contacto()}`,
            availableLanguage: ['es'],
          },
        ],
        sameAs: [
          'https://github.com/gcaguilar/bizidashboard',
          'https://www.linkedin.com/in/guillermocastella/',
          INSTAGRAM_URL,
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        name: SEO_SITE_NAME,
        alternateName: ['BiziDashboard', 'BiciRadar'],
        url: siteUrl,
        inLanguage: locale === 'en' ? 'en' : 'es-ES',
        publisher: { '@id': `${siteUrl}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}${appRoutes.explore()}?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }

  const app = (onLogout?: () => void) => (
    <>
      {location.pathname === '/dashboard' || location.pathname === '/dashboard/' ? (
        <h1 className="sr-only">Estado y análisis de Bizi Zaragoza: dashboard de la red</h1>
      ) : null}
      <NavigationProgress />
      <Header onLogout={onLogout} />
      {children}
      <Footer footerData={footerData} />
      {Devtools ? (
        <Suspense fallback={null}>
          <Devtools />
        </Suspense>
      ) : null}
      <Scripts />
    </>
  )

  if (posthogConfigurationMessage && import.meta.env.DEV) {
    if (typeof window === 'undefined') {
      console.warn(posthogConfigurationMessage)
    } else {
      throw new Error(posthogConfigurationMessage)
    }
  }

  return (
    <html lang={HTML_LANG[locale]} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script type="application/ld+json" suppressHydrationWarning>{JSON.stringify(structuredData)}</script>
        {umamiConfig ? (
          <script
            async
            defer
            src={umamiConfig.scriptSrc}
            data-website-id={umamiConfig.websiteId}
            data-host-url={umamiConfig.hostUrl}
          />
        ) : null}
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[var(--selection-bg)]">
        {posthogToken && posthogHost ? (
          <PostHogProvider
            apiKey={posthogToken}
            options={{
              api_host: posthogHost,
              capture_exceptions: true,
              debug: import.meta.env.DEV,
              tracing_headers: typeof window !== 'undefined' ? [window.location.hostname] : [],
            }}
          >
            <PostHogApp renderApp={app} />
          </PostHogProvider>
        ) : (
          app()
        )}
      </body>
    </html>
  )
}
