import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getSeoLandingPageData } from '@/lib/seo-landing.server';
import { withStaleCache } from '@/lib/cache/cache';
import { isSeoPageSlug } from '@/lib/seo-pages';

const SeoLandingInputSchema = z.object({ slug: z.string() });

/**
 * La landing ya no lee el informe completo (ver `loadAvailabilitySummary`),
 * asi que incluso en frio cuesta decenas de milisegundos. Se mantiene una
 * cache con stale-while-revalidate para que una caida de Redis o un pico de
 * trafico no repita la consulta en cada request: entre 5 minutos y 6 horas se
 * sirve el contenido anterior al instante y se refresca en segundo plano.
 */
const REDISTRIBUCION_SEO_SOFT_TTL_SECONDS = 300;
const REDISTRIBUCION_SEO_HARD_TTL_SECONDS = 6 * 60 * 60;

export const fetchSeoLandingData = createServerFn({ method: 'GET' })
  .validator(SeoLandingInputSchema)
  .handler(async ({ data: { slug } }: { data: { slug: string } }) => {
    if (!isSeoPageSlug(slug)) {
      throw new Error(`Invalid SEO page slug: ${slug}`);
    }
    if (!slug) {
      throw new Error('Missing slug in input');
    }
    const data =
      slug === 'redistribucion'
        ? await withStaleCache(
            'seo-landing:redistribucion:snapshot',
            {
              softTtlSeconds: REDISTRIBUCION_SEO_SOFT_TTL_SECONDS,
              hardTtlSeconds: REDISTRIBUCION_SEO_HARD_TTL_SECONDS,
            },
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
