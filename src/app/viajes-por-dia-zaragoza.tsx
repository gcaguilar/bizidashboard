import { createFileRoute, redirect } from '@tanstack/react-router';
import { appRoutes } from '@/lib/routes';

export const Route = createFileRoute('/viajes-por-dia-zaragoza')({
  loader: () => { throw redirect({ to: appRoutes.statsViajes(), replace: true }); },
});
