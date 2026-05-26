import { createFileRoute } from '@tanstack/react-router';
import { appRoutes } from '@/lib/routes';
import { getSiteUrl, SITE_NAME, SEO_SITE_DESCRIPTION } from '@/lib/site';

export const Route = createFileRoute('/manifest.json')({
  server: {
    handlers: {
      GET: () => {
        const siteUrl = getSiteUrl();
        const manifest = {
          name: SITE_NAME,
          short_name: SITE_NAME,
          description: SEO_SITE_DESCRIPTION,
          start_url: appRoutes.home(),
          scope: appRoutes.home(),
          display: 'standalone',
          background_color: '#0b1220',
          theme_color: '#0f172a',
          lang: 'es',
          icons: [
            {
              src: '/favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
          id: siteUrl,
        };

        return new Response(JSON.stringify(manifest), {
          status: 200,
          headers: {
            'Content-Type': 'application/manifest+json; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
          },
        });
      },
    },
  },
});
