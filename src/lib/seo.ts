import type { Metadata } from 'next';
import { SITE_NAME, SITE_TITLE } from '@/lib/site';

type BuildPageMetadataOptions = {
  title: string;
  description: string;
  path: string;
};

export function buildPageMetadata({ title, description, path }: BuildPageMetadataOptions): Metadata {
  return {
    title,
    description,
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
