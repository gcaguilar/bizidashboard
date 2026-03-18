import type { Metadata } from 'next';
import { getSiteUrl, SITE_NAME, SITE_TITLE } from '@/lib/site';

type BuildPageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
};

export function buildPageMetadata({ title, description, path, keywords }: BuildPageMetadataOptions): Metadata {
  const absoluteUrl = `${getSiteUrl()}${path}`;
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
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_TITLE} - ${title}`,
      description,
    },
  };
}
