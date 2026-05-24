import { createFileRoute, redirect } from '@tanstack/react-router';
import { appRoutes } from '@/lib/routes';

export const Route = createFileRoute('/beta')({
  loader: () => {
    throw redirect({ to: appRoutes.biciradar() });
  },
  component: () => null,
});
