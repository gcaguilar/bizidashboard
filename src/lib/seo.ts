import type { Metadata } from 'next';
import { SITE_NAME, SITE_TITLE } from '@/lib/site';

type BuildPageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
};

export function buildPageMetadata({ title, description, path, keywords }: BuildPageMetadataOptions): Metadata {
  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: `${SITE_TITLE} - ${title}`,
      description,
      url: path,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_TITLE} - ${title}`,
      description,
    },
  };
}
