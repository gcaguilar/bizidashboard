import { createFileRoute, redirect } from '@tanstack/react-router';
import { appRoutes } from '@/lib/routes';

export const Route = createFileRoute('/barrios-bizi-zaragoza')({
  loader: () => { throw redirect({ to: appRoutes.statsBarrios(), replace: true }); },
});
