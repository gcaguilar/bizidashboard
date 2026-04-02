import type { Metadata } from 'next';
import {
  buildSeoTitle,
  evaluatePageIndexability,
  type SeoIndexabilityInput,
} from '@/lib/seo-policy';
import { toAbsoluteRouteUrl } from '@/lib/routes';
import { SEO_SITE_NAME } from '@/lib/site';

type BuildPageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  canonicalPath?: string;
  keywords?: string[];
  indexability?: Omit<SeoIndexabilityInput, 'path' | 'canonicalPath'>;
};

export function buildPageMetadata({
  title,
  description,
  path,
  canonicalPath,
  keywords,
  indexability,
}: BuildPageMetadataOptions): Metadata {
  const indexabilityDecision = evaluatePageIndexability({
    path,
    canonicalPath,
    ...indexability,
  });
  const absoluteUrl = toAbsoluteRouteUrl(indexabilityDecision.canonicalPath);
  const ogImageUrl = toAbsoluteRouteUrl('/opengraph-image');
  const twitterImageUrl = toAbsoluteRouteUrl('/twitter-image');
  const fullTitle = buildSeoTitle(title);

  return {
    title: {
      absolute: fullTitle,
    },
    description,
    keywords,
    alternates: {
      canonical: absoluteUrl,
    },
    robots: {
      index: indexabilityDecision.indexable,
      follow: indexabilityDecision.follow,
      googleBot: {
        index: indexabilityDecision.indexable,
        follow: indexabilityDecision.follow,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    other: {
      'seo-indexability': indexabilityDecision.reason,
    },
    openGraph: {
      type: 'website',
      siteName: SEO_SITE_NAME,
      title: fullTitle,
      description,
      url: absoluteUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [twitterImageUrl],
    },
  };
}
