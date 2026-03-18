import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
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
    canonical: "/",
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
    url: "/",
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
          target: `${siteUrl}/dashboard?q={search_term_string}`,
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
        <link rel="preconnect" href="https://basemaps.cartocdn.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://raw.githubusercontent.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://basemaps.cartocdn.com" />
        <link rel="dns-prefetch" href="https://raw.githubusercontent.com" />
      </head>
      <body
        className={`${inter.variable} ${ibmPlexMono.variable} antialiased`}
      >
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
