import type { ReactNode } from 'react';
import type { DashboardViewMode } from '@/lib/dashboard-modes';

type DashboardLayoutProps = {
  children: ReactNode;
  mode?: DashboardViewMode;
};

export function DashboardLayout({ children, mode = 'overview' }: DashboardLayoutProps) {
  return (
    <div
      data-mode={mode}
      className="dashboard-shell mx-auto flex w-full max-w-[1280px] flex-col gap-6 overflow-x-hidden"
    >
      {children}
    </div>
  );
}
