import { getSiteUrl } from '@/lib/site';

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
}: SeoHeadOptions): {
  meta: MetaEntry[];
  links: Array<{ rel: string; href: string }>;
  title: string;
} {
  const url = path ? `${getSiteUrl()}${path}` : null;
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
      ...(url ? [{ property: 'og:url', content: url }] : []),
      { name: 'robots', content: robots },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: resolvedSocialTitle },
      { name: 'twitter:description', content: resolvedSocialDescription },
      ...extraMeta,
    ],
    links: url ? [{ rel: 'canonical', href: url }] : [],
    title,
  };
}
