import type { ReactNode } from 'react';
import { ServiceWorkerRegister } from '@/app/_components/ServiceWorkerRegister';

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <>
      {children}
      <ServiceWorkerRegister />
    </>
  );
}
