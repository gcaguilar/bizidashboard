import type { Metadata } from 'next';
import { SITE_NAME, SITE_TITLE } from '@/lib/site';
import { toAbsoluteRouteUrl } from '@/lib/routes';

type BuildPageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
};

export function buildPageMetadata({ title, description, path, keywords }: BuildPageMetadataOptions): Metadata {
  const absoluteUrl = toAbsoluteRouteUrl(path);
  const ogImageUrl = toAbsoluteRouteUrl('/opengraph-image');
  const twitterImageUrl = toAbsoluteRouteUrl('/twitter-image');
  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: absoluteUrl,
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: `${SITE_TITLE} - ${title}`,
      description,
      url: absoluteUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${SITE_TITLE} - ${title}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_TITLE} - ${title}`,
      description,
      images: [twitterImageUrl],
    },
  };
}
