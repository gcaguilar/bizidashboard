import { Outlet } from '@tanstack/react-router';
import { ServiceWorkerRegister } from '@/app/_components/ServiceWorkerRegister';

export default function DashboardLayout() {
  return (
    <>
      <Outlet />
      <ServiceWorkerRegister />
    </>
  );
}
