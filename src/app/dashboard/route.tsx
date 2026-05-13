import { Outlet, createFileRoute } from '@tanstack/react-router';
import { ServiceWorkerRegister } from '@/app/_components/ServiceWorkerRegister';

export const Route = createFileRoute('/dashboard')({
  component: DashboardParentRoute,
});

function DashboardParentRoute() {
  return (
    <>
      <Outlet />
      <ServiceWorkerRegister />
    </>
  );
}
