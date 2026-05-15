import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getSeoLandingPageData } from '@/lib/seo-landing.server';
import type { SeoPageSlug } from '@/lib/seo-pages';

const SeoLandingInputSchema = z.object({ slug: z.string() });

export const fetchSeoLandingData = createServerFn({ method: 'GET' })
  .inputValidator(SeoLandingInputSchema)
  .handler(async ({ data: { slug } }: { data: { slug: SeoPageSlug } }) => {
    if (!slug) {
      throw new Error('Missing slug in input');
    }
    const data = await getSeoLandingPageData(slug);
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
