'use client';

import { Button } from '@/components/ui/button';
import { DASHBOARD_MODE_META, type DashboardViewMode } from '@/lib/dashboard-modes';

type ModeHeaderProps = {
  activeMode: DashboardViewMode;
  onChangeMode: (mode: DashboardViewMode) => void;
};

const MODE_OPTIONS: Array<{ id: DashboardViewMode; label: string; description: string }> = [
  { id: 'overview', label: DASHBOARD_MODE_META.overview.label, description: DASHBOARD_MODE_META.overview.description },
  { id: 'operations', label: DASHBOARD_MODE_META.operations.label, description: DASHBOARD_MODE_META.operations.description },
  { id: 'research', label: DASHBOARD_MODE_META.research.label, description: DASHBOARD_MODE_META.research.description },
  { id: 'data', label: DASHBOARD_MODE_META.data.label, description: DASHBOARD_MODE_META.data.description },
];

export function ModeHeader({ activeMode, onChangeMode }: ModeHeaderProps) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Modo de vista</p>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Panel multi-rol</h2>
          <p className="text-sm text-[var(--muted)]">Cambia entre vistas segun si quieres un resumen, operar, investigar o revisar metodologia.</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" role="tablist" aria-label="Modos del dashboard">
          {MODE_OPTIONS.map((mode) => {
            const isActive = activeMode === mode.id;
            return (
              <Button
                key={mode.id}
                type="button"
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                role="tab"
                aria-selected={isActive}
                aria-pressed={isActive}
                onClick={() => onChangeMode(mode.id)}
                className={`h-full w-full flex-col items-start justify-start rounded-xl px-4 py-3 text-left ${
                  isActive
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary-strong)] shadow-[var(--shadow-soft)] hover:border-[var(--primary)]/35 hover:bg-[var(--primary)]/12'
                    : 'text-[var(--foreground)] hover:border-[var(--primary)]/35'
                }`}
              >
                <p className={`text-sm font-bold ${isActive ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>{mode.label}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{mode.description}</p>
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
