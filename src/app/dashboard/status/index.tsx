import { createFileRoute, redirect } from '@tanstack/react-router';
import { appRoutes } from '@/lib/routes';

export const Route = createFileRoute('/dashboard/status/')({
  head: () => {
    const title = 'Estado de DatosBizi - redirigiendo...';
    return {
      meta: [
        { title },
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'robots', content: 'noindex, nofollow' },
      ],
      title,
    };
  },
  loader: () => {
    throw redirect({ to: appRoutes.status(), replace: true });
  },
});
