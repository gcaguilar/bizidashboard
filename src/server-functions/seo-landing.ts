import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getSeoLandingPageData } from '@/lib/seo-landing.server';
import { withCache } from '@/lib/cache/cache';
import { isSeoPageSlug } from '@/lib/seo-pages';

const SeoLandingInputSchema = z.object({ slug: z.string() });
const REDISTRIBUCION_SEO_CACHE_TTL_SECONDS = 300;

export const fetchSeoLandingData = createServerFn({ method: 'GET' })
  .inputValidator(SeoLandingInputSchema)
  .handler(async ({ data: { slug } }: { data: { slug: string } }) => {
    if (!isSeoPageSlug(slug)) {
      throw new Error(`Invalid SEO page slug: ${slug}`);
    }
    if (!slug) {
      throw new Error('Missing slug in input');
    }
    const data =
      slug === 'redistribucion'
        ? await withCache(
            'seo-landing:redistribucion:snapshot',
            REDISTRIBUCION_SEO_CACHE_TTL_SECONDS,
            () => getSeoLandingPageData(slug)
          )
        : await getSeoLandingPageData(slug);
    return {
      path: data.path,
      config: data.config,
      content: data.content,
      indexability: {
        canonicalPath: data.indexability.canonicalPath,
        pageType: data.indexability.pageType,
        indexable: data.indexability.indexable,
        includeInSitemap: data.indexability.includeInSitemap,
        follow: data.indexability.follow,
        reason: data.indexability.reason,
      },
    };
  });
