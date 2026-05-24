import { createFileRoute, redirect } from '@tanstack/react-router';
import { appRoutes } from '@/lib/routes';

export const Route = createFileRoute('/dashboard/status/')({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
    title: 'Estado de DatosBizi - redirigiendo...',
  }),
  loader: () => {
    throw redirect({ to: appRoutes.status(), replace: true });
  },
});
