import { redirect, createFileRoute } from '@tanstack/react-router';
import { appRoutes } from '@/lib/routes';

export const Route = createFileRoute('/dashboard/status')({
  head: () => ({
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
    title: 'Dashboard Status',
  }),
  loader: () => {
    throw redirect({ to: appRoutes.status() });
  },
  component: () => null,
});

export default function DashboardStatusRedirectPage() {
  return null;
}
