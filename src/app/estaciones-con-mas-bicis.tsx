import { createFileRoute, redirect } from '@tanstack/react-router';
import { appRoutes } from '@/lib/routes';

export const Route = createFileRoute('/estaciones-con-mas-bicis')({
  loader: () => { throw redirect({ to: appRoutes.statsEstaciones(), replace: true }); },
});
