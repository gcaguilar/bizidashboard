import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import {
  getGoogleSiteVerificationToken,
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
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
  alternates: {
    canonical: "/",
  },
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
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  verification: googleSiteVerificationToken
    ? {
        google: googleSiteVerificationToken,
      }
    : undefined,
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
          name: "Zaragoza",
        },
      },
    ],
  };

  return (
    <html lang="es" className="dark">
      <body
        className={`${inter.variable} ${ibmPlexMono.variable} antialiased`}
      >
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
