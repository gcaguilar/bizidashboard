import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard')({
  component: DashboardParentRoute,
});

function DashboardParentRoute() {
  return <Outlet />;
}
