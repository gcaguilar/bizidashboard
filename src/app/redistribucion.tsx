import { createFileRoute, redirect } from '@tanstack/react-router';
import { appRoutes } from '@/lib/routes';

export const Route = createFileRoute('/redistribucion')({
  loader: () => { throw redirect({ to: appRoutes.statsRedistribucion(), replace: true }); },
});
