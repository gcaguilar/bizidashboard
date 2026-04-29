'use client';

import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DASHBOARD_MODE_META, type DashboardViewMode } from '@/lib/dashboard-modes';

type ModeHeaderProps = {
  activeMode: DashboardViewMode;
};

const MODE_OPTIONS: Array<{ id: DashboardViewMode; label: string; description: string }> = [
  { id: 'overview', label: DASHBOARD_MODE_META.overview.label, description: DASHBOARD_MODE_META.overview.description },
  { id: 'operations', label: DASHBOARD_MODE_META.operations.label, description: DASHBOARD_MODE_META.operations.description },
  { id: 'research', label: DASHBOARD_MODE_META.research.label, description: DASHBOARD_MODE_META.research.description },
  { id: 'data', label: DASHBOARD_MODE_META.data.label, description: DASHBOARD_MODE_META.data.description },
];

export function ModeHeader({ activeMode }: ModeHeaderProps) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Modo de vista</p>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Panel multi-rol</h2>
          <p className="text-sm text-[var(--muted)]">Cambia entre vistas segun si quieres un resumen, operar, investigar o revisar metodologia.</p>
        </div>

        <TabsList className="grid gap-2 border-none sm:grid-cols-2 xl:grid-cols-4" aria-label="Modos del dashboard">
          {MODE_OPTIONS.map((mode) => {
            const isActive = activeMode === mode.id;
            return (
              <TabsTrigger
                key={mode.id}
                value={mode.id}
                className={`h-auto min-h-0 w-full flex-col items-start justify-start rounded-xl border px-4 py-3 text-left transition ${
                  isActive
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-[var(--shadow-soft)]'
                    : 'border-[var(--border)] bg-[var(--secondary)] hover:border-[var(--primary)]/35 hover:bg-[var(--card)]'
                }`}
              >
                <p className={`text-sm font-bold ${isActive ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>{mode.label}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{mode.description}</p>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
    </section>
  );
}
