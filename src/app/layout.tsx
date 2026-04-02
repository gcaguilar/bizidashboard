import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import Script from "next/script";
import { appRoutes, toAbsoluteRouteUrl } from "@/lib/routes";
import {
  getGoogleSiteVerificationToken,
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
} from "@/lib/site";
import { ServiceWorkerRegister } from "./_components/ServiceWorkerRegister";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const siteUrl = getSiteUrl();
const googleSiteVerificationToken = getGoogleSiteVerificationToken();
const getNonEmptyEnv = (value: string | undefined, fallback: string): string =>
  value?.trim() || fallback;

const UMAMI_SCRIPT_SRC = getNonEmptyEnv(
  process.env.NEXT_PUBLIC_UMAMI_SCRIPT_SRC,
  "https://cloud.umami.is/script.js"
);
const UMAMI_WEBSITE_ID = getNonEmptyEnv(
  process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
  "1f4de3f2-8f9e-4d77-a5a9-f92599058648"
);
const shouldLoadAnalytics =
  process.env.NODE_ENV === "production" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_TITLE,
    template: "%s | BiziDashboard",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: 'BiziDashboard' }],
  creator: 'BiziDashboard',
  publisher: 'BiziDashboard',
  category: 'technology',
  referrer: 'origin-when-cross-origin',
  alternates: {
    canonical: appRoutes.home(),
  },
  icons: {
    icon: [
      { url: '/icon-192.svg', type: 'image/svg+xml' },
      { url: '/icon-512.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/icon-192.svg', type: 'image/svg+xml' }],
    shortcut: ['/icon-192.svg'],
  },
  manifest: '/manifest.webmanifest',
  keywords: [
    "bizi",
    "zaragoza",
    "dashboard",
    "bicicleta publica",
    "movilidad urbana",
    "open data",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: appRoutes.home(),
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/twitter-image'],
  },
  appleWebApp: {
    capable: true,
    title: SITE_TITLE,
    statusBarStyle: 'default',
  },
  verification: googleSiteVerificationToken
    ? {
        google: googleSiteVerificationToken,
      }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: '#ea0615',
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: siteUrl,
        inLanguage: "es",
        description: SITE_DESCRIPTION,
        potentialAction: {
          "@type": "SearchAction",
          target: `${toAbsoluteRouteUrl(appRoutes.explore())}?q={search_term_string}`,
          "query-input": 'required name=search_term_string',
        },
      },
      {
        "@type": "Organization",
        name: SITE_NAME,
        url: siteUrl,
        logo: `${siteUrl}/icon-512.svg`,
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_TITLE,
        applicationCategory: "TravelApplication",
        operatingSystem: "Web",
        url: siteUrl,
        inLanguage: "es",
        description: SITE_DESCRIPTION,
        areaServed: {
          "@type": "City",
          name: SITE_TITLE.includes('Zaragoza') ? 'Zaragoza' : SITE_TITLE.split(' ').pop(),
        },
      },
    ],
  };

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='bizidashboard-theme';var t=localStorage.getItem(k);var r=document.documentElement;if(t==='light'){r.classList.remove('dark');r.dataset.theme='light';}else if(t==='dark'){r.classList.add('dark');r.dataset.theme='dark';}else if(window.matchMedia('(prefers-color-scheme: dark)').matches){r.classList.add('dark');r.dataset.theme='dark';}else{r.classList.remove('dark');r.dataset.theme='light';}}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://basemaps.cartocdn.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://raw.githubusercontent.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://basemaps.cartocdn.com" />
        <link rel="dns-prefetch" href="https://raw.githubusercontent.com" />
      </head>
      <body
        className={`${inter.variable} ${ibmPlexMono.variable} antialiased`}
      >
        {shouldLoadAnalytics ? (
          <Script
            defer
            src={UMAMI_SCRIPT_SRC}
            data-website-id={UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        ) : null}
        <ServiceWorkerRegister />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
