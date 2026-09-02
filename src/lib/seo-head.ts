import { getSiteUrl, SEO_SITE_NAME } from '@/lib/site';

type MetaEntry = Record<string, string>;

export type SeoHeadOptions = {
  title: string;
  description: string;
  /** Ruta absoluta dentro del sitio, p. ej. '/dashboard'. Se usa para canonical y og:url; si se omite, no se emiten. */
  path?: string;
  /** Título específico para redes; por defecto el mismo `title`. */
  socialTitle?: string;
  /** Descripción específica para redes; por defecto la misma `description`. */
  socialDescription?: string;
  /** Valor del meta robots; por defecto indexable con previews ampliadas. */
  robots?: string;
  /** Metas adicionales específicos de la página (keywords, article:*, …). */
  extraMeta?: MetaEntry[];
  /** Ruta de la imagen para compartir; por defecto usa la imagen social del sitio. */
  socialImagePath?: string;
};

export const DEFAULT_ROBOTS =
  'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

/**
 * Bloque `head()` estándar para rutas TanStack: title + description + canonical
 * + Open Graph + Twitter card, con la URL canónica resuelta desde `path`.
 */
export function buildSeoHead({
  title,
  description,
  path,
  socialTitle,
  socialDescription,
  robots = DEFAULT_ROBOTS,
  extraMeta = [],
  socialImagePath = '/opengraph-image',
}: SeoHeadOptions): {
  meta: MetaEntry[];
  links: Array<{ rel: string; href: string }>;
  title: string;
} {
  const url = path ? `${getSiteUrl()}${path}` : null;
  const socialImageUrl = `${getSiteUrl()}${socialImagePath}`;
  const resolvedSocialTitle = socialTitle ?? title;
  const resolvedSocialDescription = socialDescription ?? description;

  return {
    meta: [
      { title },
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'description', content: description },
      { property: 'og:title', content: resolvedSocialTitle },
      { property: 'og:description', content: resolvedSocialDescription },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: SEO_SITE_NAME },
      { property: 'og:locale', content: 'es_ES' },
      { property: 'og:image', content: socialImageUrl },
      ...(url ? [{ property: 'og:url', content: url }] : []),
      { name: 'robots', content: robots },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image', content: socialImageUrl },
      { name: 'twitter:title', content: resolvedSocialTitle },
      { name: 'twitter:description', content: resolvedSocialDescription },
      ...extraMeta,
    ],
    links: url ? [{ rel: 'canonical', href: url }] : [],
    title,
  };
}
