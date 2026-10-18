import { Outlet, createFileRoute } from '@tanstack/react-router';
import { DashboardPageLoading } from '@/app/dashboard/_components/DashboardPageLoading';
import { BetaBanner } from '@/app/dashboard/_components/BetaBanner';

export const Route = createFileRoute('/dashboard')({
  ssr: 'data-only',
  pendingComponent: DashboardRoutePending,
  component: DashboardParentRoute,
});

function DashboardParentRoute() {
  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4 md:px-6">
        <BetaBanner />
      </div>
      <Outlet />
    </>
  );
}

function DashboardRoutePending() {
  return (
    <DashboardPageLoading
      title="Cargando el resumen"
      subtitle="Preparando los datos y el mapa"
    />
  );
}
