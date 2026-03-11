import type { ReactNode } from 'react';

type DashboardLayoutProps = {
  children: ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 overflow-x-hidden">{children}</div>;
}
