import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/beta')({
  loader: () => {
    throw redirect({ to: '/biciradar' });
  },
  component: () => null,
});
