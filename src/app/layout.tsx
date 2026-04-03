import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import Script from "next/script";
import { appRoutes } from "@/lib/routes";
import {
  SEO_SITE_DESCRIPTION,
  SEO_SITE_NAME,
  SEO_SITE_TITLE,
  getGoogleSiteVerificationToken,
  getSiteUrl,
} from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  preload: false,
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
    default: SEO_SITE_TITLE,
    template: "%s | DatosBizi",
  },
  description: SEO_SITE_DESCRIPTION,
  applicationName: SEO_SITE_NAME,
  authors: [{ name: SEO_SITE_NAME }],
  creator: SEO_SITE_NAME,
  publisher: SEO_SITE_NAME,
  category: 'technology',
  referrer: 'strict-origin-when-cross-origin',
  alternates: {
    canonical: appRoutes.home(),
    languages: {
      'es-ES': appRoutes.home(),
      'x-default': appRoutes.home(),
    },
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
    siteName: SEO_SITE_NAME,
    title: SEO_SITE_TITLE,
    description: SEO_SITE_DESCRIPTION,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: SEO_SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_SITE_TITLE,
    description: SEO_SITE_DESCRIPTION,
    images: ['/twitter-image'],
  },
  appleWebApp: {
    capable: true,
    title: SEO_SITE_TITLE,
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
        name: SEO_SITE_NAME,
        url: siteUrl,
        inLanguage: "es",
        description: SEO_SITE_DESCRIPTION,
      },
      {
        "@type": "Organization",
        name: SEO_SITE_NAME,
        url: siteUrl,
        logo: `${siteUrl}/icon-512.svg`,
      },
      {
        "@type": "SoftwareApplication",
        name: SEO_SITE_TITLE,
        applicationCategory: "TravelApplication",
        operatingSystem: "Web",
        url: siteUrl,
        inLanguage: "es",
        description: SEO_SITE_DESCRIPTION,
        areaServed: {
          "@type": "City",
          name: SEO_SITE_TITLE.includes('Zaragoza') ? 'Zaragoza' : SEO_SITE_TITLE.split(' ').pop(),
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
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
