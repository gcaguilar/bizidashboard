import { createFileRoute, redirect } from '@tanstack/react-router';
import { appRoutes } from '@/lib/routes';

export const Route = createFileRoute('/estadisticas-bizi-zaragoza')({
  loader: () => { throw redirect({ to: appRoutes.statsHub(), replace: true }); },
});
